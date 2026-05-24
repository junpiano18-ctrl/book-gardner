import { supabase } from './supabase'
import type { Quote } from '@/types'

export async function getQuotesByBook(bookId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('book_id', bookId)
    .order('watered_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Quote[]
}
