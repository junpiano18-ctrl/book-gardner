import { supabase } from './supabase'
import type { Book, BookStatus, KakaoBook } from '@/types'

const KAKAO_BOOK_SEARCH_URL = 'https://dapi.kakao.com/v3/search/book'

export async function searchKakaoBooks(query: string): Promise<KakaoBook[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const key = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
  if (!key) throw new Error('NEXT_PUBLIC_KAKAO_REST_API_KEY is not set')

  const url = `${KAKAO_BOOK_SEARCH_URL}?query=${encodeURIComponent(trimmed)}`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
  })

  if (!res.ok) throw new Error(`Kakao book search failed: ${res.status}`)

  const json = (await res.json()) as { documents: KakaoBook[] }
  return json.documents ?? []
}

export async function getBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Book[]
}

export async function createBook(
  book: Omit<Book, 'id' | 'created_at' | 'updated_at'>
): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert(book)
    .select()
    .single()

  if (error) throw error
  return data as Book
}

export async function updateBookStatus(
  id: string,
  status: BookStatus
): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Book
}
