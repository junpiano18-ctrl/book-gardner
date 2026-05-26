import { supabase } from './supabase'
import type { Quote, QuoteWithRefs } from '@/types'

export async function getQuotesByBook(bookId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('book_id', bookId)
    .order('watered_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Quote[]
}

export async function getAllQuotesByUser(userId: string): Promise<QuoteWithRefs[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, book:books(*), plant:plants(*)')
    .eq('user_id', userId)
    .order('watered_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as QuoteWithRefs[]
}

export async function searchQuotes(
  userId: string,
  keyword: string
): Promise<QuoteWithRefs[]> {
  const trimmed = keyword.trim()
  if (!trimmed) return []

  const { data, error } = await supabase
    .from('quotes')
    .select('*, book:books(*), plant:plants(*)')
    .eq('user_id', userId)
    .ilike('content', `%${trimmed}%`)
    .order('watered_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as QuoteWithRefs[]
}

export interface AddQuoteInput {
  userId: string
  bookId: string
  plantId: string
  content: string
  pageNumber?: number
}

export async function addQuote(input: AddQuoteInput): Promise<Quote> {
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      user_id: input.userId,
      book_id: input.bookId,
      plant_id: input.plantId,
      content: input.content,
      page_number: input.pageNumber,
      watered_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as Quote
}

export async function toggleQuoteFavorite(id: string, isFavorite: boolean): Promise<Quote> {
  const { data, error } = await supabase
    .from('quotes')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Quote
}
