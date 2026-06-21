const KAKAO_BOOK_SEARCH_URL = 'https://dapi.kakao.com/v3/search/book'

export async function fetchKakaoCover(isbn: string, key: string): Promise<string> {
  const isbn13 = isbn.split(/\s+/).find((i) => i.startsWith('978')) ?? isbn.split(/\s+/)[0]
  if (!isbn13) return ''
  try {
    const res = await fetch(
      `${KAKAO_BOOK_SEARCH_URL}?target=isbn&query=${encodeURIComponent(isbn13)}`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    )
    if (!res.ok) return ''
    const json = (await res.json()) as { documents?: Array<{ thumbnail: string }> }
    return json.documents?.[0]?.thumbnail ?? ''
  } catch {
    return ''
  }
}
