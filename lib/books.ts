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

export function normalizeIsbns(isbn?: string): string[] {
  if (!isbn) return []
  return isbn.split(/\s+/).filter(Boolean)
}

const KDC_KEYWORD_RULES: Array<[RegExp, string]> = [
  [/(컴퓨터|프로그래밍|개발|코딩|소프트웨어|자바스크립트|파이썬|리액트|총류)/i, '0'],
  [/(철학|존재|윤리|논리|사상)/, '1'],
  [/(종교|기독교|불교|성경|불경|이슬람)/, '2'],
  [/(사회|정치|경제|경영|마케팅|법학|행정)/, '3'],
  [/(자연과학|물리|화학|생물|수학|천문)/, '4'],
  [/(기술|공학|의학|건강|요리|농업)/, '5'],
  [/(예술|미술|음악|영화|디자인|사진)/, '6'],
  [/(언어|영어|국어|문법|회화)/, '7'],
  [/(소설|시집|에세이|문학|희곡)/, '8'],
  [/(역사|지리|여행|전기)/, '9'],
]

export function guessKdcFromKakaoBook(book: KakaoBook): string {
  const haystack = `${book.title} ${book.contents} ${book.publisher}`
  for (const [pattern, code] of KDC_KEYWORD_RULES) {
    if (pattern.test(haystack)) return code
  }
  return '8'
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
