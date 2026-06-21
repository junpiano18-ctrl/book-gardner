import { fetchKakaoCover } from '@/lib/kakao'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const isbn = searchParams.get('isbn')?.trim() ?? ''
  if (!isbn) return Response.json({ thumbnail: '' })

  const key = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
  if (!key) return Response.json({ thumbnail: '' })

  const thumbnail = await fetchKakaoCover(isbn, key)
  return Response.json({ thumbnail })
}
