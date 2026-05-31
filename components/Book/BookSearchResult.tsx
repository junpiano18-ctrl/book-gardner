'use client'

import { BookCard } from './BookCard'
import { normalizeIsbns } from '@/lib/books'
import type { KakaoBook } from '@/types'

interface BookSearchResultProps {
  results: KakaoBook[]
  searching: boolean
  // 한 번이라도 검색을 실행했는지 — true 일 때만 "결과 없음" 안내 표시
  hasSearched: boolean
  plantedIsbns: Set<string>
  plantingIsbn: string | null
  onPlant: (book: KakaoBook, kdcCode: string) => void
}

export function BookSearchResult({
  results,
  searching,
  hasSearched,
  plantedIsbns,
  plantingIsbn,
  onPlant,
}: BookSearchResultProps) {
  if (searching) {
    return (
      <div className="rounded-2xl bg-white/60 p-10 text-center text-stone-500">
        🔎 검색 중...
      </div>
    )
  }

  // 검색 실행 전: 사서추천만 보이게 아무것도 안 그림
  if (results.length === 0 && !hasSearched) return null

  // 검색했는데 0건: 안내 메시지
  if (results.length === 0) {
    return (
      <div className="rounded-2xl bg-white/60 px-6 py-10 text-center text-sm text-stone-600 ring-1 ring-amber-900/5">
        <div className="text-2xl">🔎</div>
        <p className="mt-2 font-medium text-stone-700">
          검색 결과가 없어요
        </p>
        <p className="mt-1 text-xs text-stone-500">
          다른 키워드로 다시 찾아보세요
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {results.map((book, index) => {
        const isbns = normalizeIsbns(book.isbn)
        // NL API 결과는 ISBN 이 비어있는 경우가 많고 (음반/구간 등) 같은 제목 책이 여러
        // 판본으로 섞여 들어와 키 충돌이 자주 발생 — 항상 index 를 섞어 고유성 보장
        const isbnKey = isbns.join('-')
        const key = isbnKey ? `${isbnKey}-${index}` : `nl-${index}`
        const alreadyPlanted = isbns.some((i) => plantedIsbns.has(i))
        const kdcCode = book.kdc_code ?? '8'
        const isPlanting = plantingIsbn !== null && isbns.includes(plantingIsbn)

        return (
          <BookCard
            key={key}
            book={book}
            kdcCode={kdcCode}
            alreadyPlanted={alreadyPlanted}
            planting={isPlanting}
            onPlant={onPlant}
          />
        )
      })}
    </div>
  )
}
