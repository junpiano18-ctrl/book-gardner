// ============================================================
// 국립중앙도서관 사서추천도서 API 프록시
// - 4개 drCode(11/6/5/4) 병렬 호출 → 분야 골고루 섞은 추천 목록
// - 각 책의 실제 KDC 는 ISBN 으로 소장자료 search.do 재조회
// - 메모리 캐시 (하루 1회 새로 호출)
// ============================================================

const SASEO_URL = 'https://nl.go.kr/NL/search/openApi/saseoApi.do'
const NL_SEARCH_URL = 'https://www.nl.go.kr/NL/search/openApi/search.do'

const DR_CODES = [11, 6, 5, 4] as const

// drCode → KDC 첫자리 폴백 매핑 (ISBN 재조회 실패 시)
//   11 어문학 → 8 (문학)
//    6 인문과학 → 1 (철학)
//    5 사회과학 → 3 (사회과학)
//    4 자연과학 → 4 (자연과학)
const DR_TO_KDC: Record<number, string> = {
  11: '8',
  6: '1',
  5: '3',
  4: '4',
}

interface RawSaseo {
  recomNo: string
  isbn: string
  title: string
  author: string
  publisher: string
  coverUrl: string
  drCode: string
  drCodeName: string
}

interface LibrarianPick extends RawSaseo {
  kdcCode: string
}

// ── XML 파서 (route.ts 의 helper 와 동일 ─────────────────────
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

function tagText(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`,
    'i'
  )
  const m = xml.match(re)
  if (!m) return ''
  return decodeEntities((m[1] ?? m[2] ?? '').trim())
}

function pickTag(xml: string, ...tags: string[]): string {
  for (const t of tags) {
    const v = tagText(xml, t)
    if (v) return v
  }
  return ''
}

function iterItemBlocks(xml: string): string[] {
  const blocks: string[] = []
  const re = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) blocks.push(m[1])
  return blocks
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim()
}

function firstKdcDigit(raw: string): string | null {
  const m = raw.match(/\d/)
  return m ? m[0] : null
}

// ── 사서추천도서 한 분류 호출 ────────────────────────────────
async function fetchSaseo(
  drCode: number,
  key: string,
  startDate: string,
  endDate: string
): Promise<RawSaseo[]> {
  // endRowNumApi=15: NL 정상 응답 확인됨 (실측). 단 NL 사서추천 자체가
  // 분야×기간당 totalCount 약 8건 정도라 15를 채우진 못함 — 여유분 요청만.
  const url =
    `${SASEO_URL}?key=${key}` +
    `&startRowNumApi=1&endRowNumApi=15` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&drCode=${drCode}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`사서추천 HTTP ${res.status}`)
  const xml = await res.text()

  // 인증 에러
  const errCode = tagText(xml, 'error_code')
  if (errCode) {
    const msg = tagText(xml, 'msg') || `사서추천 API 오류 (${errCode})`
    if (errCode === '010' || errCode === '011') {
      console.error(
        '[saseoApi] 인증 실패 — saseoApi.do 는 별도 신청 키일 수 있음. ' +
          'NL OpenAPI 콘솔에서 "사서추천도서" 활용신청 확인 필요.'
      )
    }
    throw new Error(`${msg} (code ${errCode})`)
  }

  const blocks = iterItemBlocks(xml)
  return blocks.map((b) => ({
    recomNo: pickTag(b, 'recomNo'),
    isbn: pickTag(b, 'recomisbn', 'recome_isbn', 'recom_isbn').trim(),
    title: stripHtml(pickTag(b, 'recomtitle', 'recom_title')),
    author: stripHtml(pickTag(b, 'recomauthor', 'recom_author')),
    publisher: stripHtml(pickTag(b, 'recompublisher', 'recom_publisher')),
    coverUrl: pickTag(b, 'recomfilepath', 'recom_file_path'),
    drCode: pickTag(b, 'drCode'),
    drCodeName: pickTag(b, 'drCodeName'),
  }))
}

// ── ISBN 으로 소장자료 search.do 재조회해 실제 KDC 첫자리 추출
async function fetchKdcByIsbn(
  isbn: string,
  key: string
): Promise<string | null> {
  const clean = isbn.replace(/\s+/g, '')
  if (!clean) return null
  const url =
    `${NL_SEARCH_URL}?key=${key}` +
    `&srchTarget=total&kwd=${clean}` +
    `&category=도서&pageNum=1&pageSize=1`
  const res = await fetch(url)
  if (!res.ok) return null
  const xml = await res.text()
  // 인증 에러 응답 있어도 그냥 null 리턴 (폴백 매핑 사용)
  if (tagText(xml, 'ERR_CODE') && tagText(xml, 'ERR_CODE') !== '000') return null
  const items = iterItemBlocks(xml)
  if (items.length === 0) return null
  const raw = pickTag(
    items[0],
    'kdc_code_1s',
    'kdcCode1s',
    'kdc_code',
    'kdcCode',
    'class_no'
  )
  return firstKdcDigit(raw)
}

// ── 캐시 ────────────────────────────────────────────────────
let cache: { date: string; data: LibrarianPick[] } | null = null
const todayKey = () => new Date().toISOString().slice(0, 10)

function formatYMD(d: Date): string {
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  )
}

// ── GET ─────────────────────────────────────────────────────
export async function GET() {
  // 캐시 히트
  if (cache && cache.date === todayKey()) {
    return Response.json({ picks: cache.data, cached: true })
  }

  const key = process.env.NL_API_KEY
  if (!key) {
    return Response.json({ error: 'NL_API_KEY is not set' }, { status: 500 })
  }

  // 최근 12개월 범위 (사서추천이 자주 안 올라오는 분류 대비)
  const end = new Date()
  const start = new Date(end)
  start.setMonth(start.getMonth() - 12)

  // 4개 분야 병렬 호출
  let perCode: RawSaseo[][]
  try {
    perCode = await Promise.all(
      DR_CODES.map((c) => fetchSaseo(c, key, formatYMD(start), formatYMD(end)))
    )
  } catch (e) {
    console.error('[saseoApi] failed:', e)
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }

  // round-robin 으로 분야 골고루 섞음 (최대 12개).
  // outer 한계를 분야 최대 길이로 — 한 분야가 적게 와도 다른 분야에서
  // 더 끌어와 12개 cap 까지 안정적으로 채움.
  const interleaved: RawSaseo[] = []
  const maxLen = Math.max(0, ...perCode.map((a) => a.length))
  for (let i = 0; i < maxLen; i++) {
    for (const arr of perCode) {
      if (arr[i]) interleaved.push(arr[i])
      if (interleaved.length >= 12) break
    }
    if (interleaved.length >= 12) break
  }

  // ISBN 으로 실제 KDC 병렬 재조회 (rate-limit 부담 적게 12회)
  const kdcs = await Promise.all(
    interleaved.map(async (item) => {
      const fallback = DR_TO_KDC[Number(item.drCode)] ?? '8'
      if (!item.isbn) return fallback
      try {
        const kdc = await fetchKdcByIsbn(item.isbn, key)
        return kdc ?? fallback
      } catch {
        return fallback
      }
    })
  )

  const picks: LibrarianPick[] = interleaved.map((item, i) => ({
    ...item,
    kdcCode: kdcs[i],
  }))

  cache = { date: todayKey(), data: picks }
  return Response.json({ picks, cached: false })
}
