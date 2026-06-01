import type { KakaoBook } from '@/types'
import { nlLanguagePriority } from '@/lib/books'

const NL_BOOK_SEARCH_URL = 'https://www.nl.go.kr/NL/search/openApi/search.do'

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

function stripHighlight(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim()
}

function firstKdcDigit(raw: string): string {
  const m = raw.match(/\d/)
  return m ? m[0] : '8'
}

function iterItemBlocks(xml: string): string[] {
  const blocks: string[] = []
  const re = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) blocks.push(m[1])
  return blocks
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim() ?? ''
  if (!query) return Response.json({ documents: [] })

  const key = process.env.NL_API_KEY
  if (!key) {
    return Response.json({ error: 'NL_API_KEY is not set' }, { status: 500 })
  }

  // category=도서 로 음악자료/기사 등 제외, 책만 반환
  const params = new URLSearchParams({
    srchTarget: 'total',
    kwd: query,
    category: '도서',
    pageNum: '1',
    pageSize: '10',
    key,
  })

  const upstreamUrl = `${NL_BOOK_SEARCH_URL}?${params.toString()}`
  const redactedUrl = upstreamUrl.replace(key, '***')
  console.log('[NL API] →', redactedUrl)

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl)
  } catch (e) {
    console.error('[NL API] fetch failed:', e)
    return Response.json(
      { error: '국립중앙도서관 API 요청 실패 (네트워크 오류)' },
      { status: 502 }
    )
  }

  const contentType = upstream.headers.get('content-type') ?? ''
  console.log(
    '[NL API] ← status',
    upstream.status,
    '| content-type',
    contentType
  )

  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => '')
    console.error('[NL API] non-OK body:', errBody.slice(0, 500))
    return Response.json(
      {
        error: `국립중앙도서관 API 오류 (status ${upstream.status}). 일일 호출 한도를 확인해주세요.`,
        debug: {
          upstreamUrl: redactedUrl,
          upstreamStatus: upstream.status,
          contentType,
          rawXml: errBody,
        },
      },
      { status: upstream.status === 429 ? 429 : 502 }
    )
  }

  const xml = await upstream.text()
  console.log(
    '[NL API] ← body length',
    xml.length,
    '— first 1500 chars:\n' + xml.slice(0, 1500)
  )

  // API 자체 에러 응답 (잘못된 키, 호출 한도 초과 등)
  const errCode = tagText(xml, 'ERR_CODE')
  if (errCode && errCode !== '000') {
    const errMsg =
      tagText(xml, 'ERR_MSG') || `국립중앙도서관 API 오류 (${errCode})`
    console.error('[NL API] ERR_CODE', errCode, errMsg)
    return Response.json(
      {
        error: errMsg,
        debug: {
          upstreamUrl: redactedUrl,
          upstreamStatus: upstream.status,
          contentType,
          rawXml: xml,
        },
      },
      { status: 502 }
    )
  }

  const blocks = iterItemBlocks(xml)
  console.log('[NL API] parsed <item> block count:', blocks.length)

  // 한국 자료(K) > 미상 > 외국 자료(J/C/W) 안정 정렬.
  // control_no 첫 글자가 NL 의 원산지/언어 코드.
  const sortedBlocks = [...blocks].sort((a, b) => {
    const pa = nlLanguagePriority(pickTag(a, 'control_no'), pickTag(a, 'isbn'))
    const pb = nlLanguagePriority(pickTag(b, 'control_no'), pickTag(b, 'isbn'))
    return pa - pb
  })

  const documents: KakaoBook[] = sortedBlocks.map((block) => {
    const title = stripHighlight(pickTag(block, 'title_info', 'titleInfo'))
    const author = stripHighlight(pickTag(block, 'author_info', 'authorInfo'))
    const publisher = stripHighlight(pickTag(block, 'pub_info', 'pubInfo'))
    const isbn = pickTag(block, 'isbn')
    const kdcRaw = pickTag(
      block,
      'kdc_code_1s',
      'kdcCode1s',
      'kdc_code',
      'kdcCode',
      'class_no'
    )
    const image = pickTag(block, 'image_url', 'imageUrl', 'title_url')

    return {
      title,
      contents: '',
      url: '',
      isbn,
      datetime: '',
      authors: author ? [author] : [],
      publisher,
      translators: [],
      price: 0,
      sale_price: 0,
      thumbnail: image,
      status: '',
      kdc_code: firstKdcDigit(kdcRaw),
    }
  })

  return Response.json({
    documents,
    debug: {
      upstreamUrl: redactedUrl,
      upstreamStatus: upstream.status,
      contentType,
      rawXmlLength: xml.length,
      itemBlockCount: blocks.length,
      rawXml: xml,
    },
  })
}
