import { supabase } from './supabase'
import type { Book, Plant, PlantStage, Quote } from '@/types'

// ============================================================
// 성장 임계값 — DB water_plant() 트리거와 반드시 일치해야 함
// 물주기 1회 = +10pt · 10회(100pt)에 완독
// 단계: seed(0회) → sprout(1-3회) → growing(4-6회) → bloom(7-9회) → 10회에 완독
// growth_point: seed[0,10) sprout[10,40) growing[40,70) bloom[70,100]
// ============================================================
export const WATERING_POINTS = 10
export const POINTS_TO_COMPLETE = 100
export const TOTAL_WATERS_TO_BLOOM = POINTS_TO_COMPLETE / WATERING_POINTS // 표시용 "X/10"

export const STAGE_THRESHOLDS: Record<
  PlantStage,
  { start: number; end: number }
> = {
  seed: { start: 0, end: 10 },
  sprout: { start: 10, end: 40 },
  growing: { start: 40, end: 70 },
  bloom: { start: 70, end: 100 },
}

// 현재 단계 내 진행률 (0~100)
export function stageProgressPercent(
  stage: PlantStage,
  growthPoint: number
): number {
  const { start, end } = STAGE_THRESHOLDS[stage]
  if (stage === 'bloom' || end <= start) return 100
  const ratio = (growthPoint - start) / (end - start)
  return Math.min(100, Math.max(0, Math.round(ratio * 100)))
}

// 다음 단계까지 남은 물주기 횟수 (최소 1)
export function watersToNextStage(
  stage: PlantStage,
  growthPoint: number
): number {
  if (stage === 'bloom') return 0
  const remainingPts = STAGE_THRESHOLDS[stage].end - growthPoint
  return Math.max(1, Math.ceil(remainingPts / WATERING_POINTS))
}

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

  const { data: plant, error: readError } = await supabase
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .single()

  if (readError) throw readError

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

export async function getPlantByBookId(bookId: string): Promise<Plant | null> {
  const { data, error } = await supabase
    .from('plants')
    .select('*')
    .eq('book_id', bookId)
    .maybeSingle()

  if (error) throw error
  return (data as Plant | null) ?? null
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

// ============================================================
// 완독 처리 — Supabase RPC `mark_book_completed` 호출.
// 물주기(waterPlant) 와 완전히 분리된 별도 함수.
// RPC 가 plants.completed_at + books.status='completed' 를 한 트랜잭션으로
// 원자적으로 갱신. 클라이언트에서 두 번 UPDATE 하지 않음 (정합성 보장).
// ============================================================

export interface MarkBookCompletedInput {
  plantId: string
  bookId: string
}

export interface MarkBookCompletedResult {
  plant: Plant
  book: Book
}

export async function markBookCompleted(
  input: MarkBookCompletedInput
): Promise<MarkBookCompletedResult> {
  const { plantId, bookId } = input

  const { error: rpcError } = await supabase.rpc('mark_book_completed', {
    p_plant_id: plantId,
    p_book_id: bookId,
  })
  if (rpcError) throw rpcError

  // RPC 성공 — 갱신된 plant 와 book 재조회
  const [plantRes, bookRes] = await Promise.all([
    supabase.from('plants').select('*').eq('id', plantId).single(),
    supabase.from('books').select('*').eq('id', bookId).single(),
  ])
  if (plantRes.error) throw plantRes.error
  if (bookRes.error) throw bookRes.error

  return {
    plant: plantRes.data as Plant,
    book: bookRes.data as Book,
  }
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

export async function deletePlantByBookId(bookId: string): Promise<void> {
  const { error } = await supabase.from('plants').delete().eq('book_id', bookId)
  if (error) throw error
}
