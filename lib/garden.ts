import { supabase } from './supabase'
import type { Plant, Quote } from '@/types'

export interface WaterPlantInput {
  userId: string
  bookId: string
  plantId: string
  content: string
  pageNumber?: number
}

export interface WaterPlantResult {
  plant: Plant
  quote: Quote
}

export async function waterPlant(input: WaterPlantInput): Promise<WaterPlantResult> {
  const { userId, bookId, plantId, content, pageNumber } = input

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      user_id: userId,
      book_id: bookId,
      plant_id: plantId,
      content,
      page_number: pageNumber,
      watered_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (quoteError) throw quoteError

  const { data: plant, error: rpcError } = await supabase.rpc('water_plant', {
    p_plant_id: plantId,
  })

  if (rpcError) throw rpcError

  return { plant: plant as Plant, quote: quote as Quote }
}

export async function getPlants(userId: string): Promise<Plant[]> {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Plant[]
}

export async function createPlant(
  plant: Omit<Plant, 'id' | 'created_at'>
): Promise<Plant> {
  const { data, error } = await supabase
    .from('plants')
    .insert(plant)
    .select()
    .single()

  if (error) throw error
  return data as Plant
}

export async function updatePlant(
  id: string,
  updates: Partial<Omit<Plant, 'id' | 'user_id' | 'book_id' | 'created_at'>>
): Promise<Plant> {
  const { data, error } = await supabase
    .from('plants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Plant
}
