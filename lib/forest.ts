// ============================================================
// 산림청 국가표준식물목록 (KpniService) — scnmSearch
// 엔드포인트: https://apis.data.go.kr/1400119/KpniService/scnmSearch
//
// ⚠ 실측 결과: scnmSearch 는 'sw' / 'kwd' / 'scnm' 등 어떤 검색
// 파라미터도 받지 않고, 한글명 가나다순 전체(약 39,030건)를
// 페이지네이션만 해서 반환함. 따라서 학명으로 직접 필터링이 불가.
// 사용 방식: 전체 DB 를 페이지로 받아 메모리에서 학명 매칭.
// ============================================================

const FOREST_SCNM_SEARCH_URL =
  'https://apis.data.go.kr/1400119/KpniService/scnmSearch'

export interface ForestPlantRecord {
  sciName: string         // plantSpecsScnm
  familyKor?: string      // falmKorNm
  familySci?: string      // falmNm
  genusKor?: string       // genusKorNm
  genusSci?: string       // genusNm
  relCodeName?: string    // stpltScnmRltnCdNm ('정명' / '이명' / ...)
}

export interface ForestPage {
  records: ForestPlantRecord[]
  totalCount: number
  pageNo: number
  numOfRows: number
}

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

function detectApiError(xml: string): string | null {
  const authMsg = tagText(xml, 'returnAuthMsg')
  const reasonCode = tagText(xml, 'returnReasonCode')
  if (authMsg) {
    return `data.go.kr 오류: ${authMsg}${reasonCode ? ` (code ${reasonCode})` : ''}`
  }
  const errMsg = tagText(xml, 'errMsg')
  if (errMsg && !/normal/i.test(errMsg)) {
    return errMsg
  }
  const resultCode = tagText(xml, 'resultCode')
  if (resultCode && resultCode !== '00' && resultCode !== '0000') {
    const resultMsg = tagText(xml, 'resultMsg') || resultCode
    return `산림청 API 오류: ${resultMsg}`
  }
  return null
}

export function parseForestXml(xml: string): ForestPlantRecord[] {
  return iterItemBlocks(xml).map((block) => {
    const rec: ForestPlantRecord = {
      sciName: pickTag(block, 'plantSpecsScnm', 'sciNm'),
    }
    const fk = pickTag(block, 'falmKorNm')
    const fs = pickTag(block, 'falmNm')
    const gk = pickTag(block, 'genusKorNm')
    const gs = pickTag(block, 'genusNm')
    const rc = pickTag(block, 'stpltScnmRltnCdNm')
    if (fk) rec.familyKor = fk
    if (fs) rec.familySci = fs
    if (gk) rec.genusKor = gk
    if (gs) rec.genusSci = gs
    if (rc) rec.relCodeName = rc
    return rec
  })
}

export async function fetchForestPage(
  apiKey: string,
  pageNo: number,
  numOfRows: number
): Promise<ForestPage> {
  // serviceKey 는 .env 의 'Encoding' 형식(이미 URL-인코딩된 값)을 그대로 사용.
  const url =
    `${FOREST_SCNM_SEARCH_URL}` +
    `?serviceKey=${apiKey}` +
    `&numOfRows=${numOfRows}` +
    `&pageNo=${pageNo}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `산림청 API HTTP 오류 (status ${res.status}, page ${pageNo})`
    )
  }
  const xml = await res.text()

  const apiErr = detectApiError(xml)
  if (apiErr) throw new Error(apiErr)

  return {
    records: parseForestXml(xml),
    totalCount: Number(tagText(xml, 'totalCount')) || 0,
    pageNo: Number(tagText(xml, 'pageNo')) || pageNo,
    numOfRows: Number(tagText(xml, 'numOfRows')) || numOfRows,
  }
}

export interface ForestMatch {
  record: ForestPlantRecord
  via: '정명' | '이명'
}

// 학명에서 속명+종소명만 추출 (저자명 제거, 대소문자 무시)
function scientificStem(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ')
    .toLowerCase()
}

export function findForestRecordBySciName(
  records: ForestPlantRecord[],
  sciName: string
): ForestMatch | null {
  const target = scientificStem(sciName)
  if (!target) return null

  const matches = records.filter(
    (r) => scientificStem(r.sciName) === target
  )

  const verified = matches.find((r) => r.relCodeName === '정명')
  if (verified) return { record: verified, via: '정명' }

  // 정명이 다른 학명으로 옮겨간 경우(이명 매칭) — 과/속 정보는 동일하므로 활용
  const synonym = matches.find((r) => r.relCodeName === '이명')
  if (synonym) return { record: synonym, via: '이명' }

  return null
}
