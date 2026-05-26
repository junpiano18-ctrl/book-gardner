import { fetchForestPage } from '@/lib/forest'

// ⚠ 산림청 scnmSearch 는 학명/한글명으로 필터링되지 않음 (전체 DB 페이지네이션).
// 이 라우트는 디버깅용 페이지 프록시. 검색은 plant_info 테이블(캐시)에서 직접.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pageNo = Math.max(1, Number(searchParams.get('pageNo')) || 1)
  const numOfRows = Math.min(
    1000,
    Math.max(1, Number(searchParams.get('numOfRows')) || 10)
  )

  const key = process.env.FOREST_API_KEY
  if (!key) {
    return Response.json({ error: 'FOREST_API_KEY is not set' }, { status: 500 })
  }

  try {
    const page = await fetchForestPage(key, pageNo, numOfRows)
    return Response.json(page)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
