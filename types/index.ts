export type BookStatus = 'wish' | 'reading' | 'completed'
export type PlantStage = 'seed' | 'sprout' | 'growing' | 'bloom'

export interface User {
  id: string
  nickname: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  user_id: string
  isbn?: string
  title: string
  author?: string
  publisher?: string
  cover_url?: string
  kdc_code: string
  status: BookStatus
  total_pages?: number
  created_at: string
  updated_at: string
}

export interface Plant {
  id: string
  book_id: string
  user_id: string
  kdc_code: string
  plant_name: string
  sci_name?: string
  family_name?: string
  stage: PlantStage
  growth_point: number
  last_watered_at?: string
  completed_at?: string
  created_at: string
}

export interface Quote {
  id: string
  user_id: string
  book_id: string
  plant_id: string
  content: string
  page_number?: number
  watered_at: string
  is_favorite?: boolean
}

export interface KdcPlant {
  name: string
  sci: string
  family: string
  // 정원 구역 헤더 / 책 상세에서 "왜 이 식물인지" 설명. 한 줄 의미.
  meaning: string
}

export type PlantWithBook = Plant & { book: Book }

export type QuoteWithRefs = Quote & {
  book: Book | null
  plant: Plant | null
}

export interface PlantInfo {
  kdc_code: string
  plant_name: string
  sci_name: string
  family_kor?: string
  family_sci?: string
  genus_kor?: string
  genus_sci?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface KakaoBook {
  title: string
  contents: string
  url: string
  isbn: string
  datetime: string
  authors: string[]
  publisher: string
  translators: string[]
  price: number
  sale_price: number
  thumbnail: string
  status: string
  kdc_code?: string
}