'use client'

import { BookCard } from './BookCard'
import { guessKdcFromKakaoBook, normalizeIsbns } from '@/lib/books'
import type { KakaoBook } from '@/types'

interface BookSearchResultProps {
  results: KakaoBook[]
  searching: boolean
  plantedIsbns: Set<string>
  plantingIsbn: string | null
  onPlant: (book: KakaoBook, kdcCode: string) => void
}

export function BookSearchResult({
  results,
  searching,
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

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/30 p-10 text-center text-stone-500">
        검색어를 입력해보세요. 예) 한강, 데미안, 클린 코드
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {results.map((book) => {
        const isbns = normalizeIsbns(book.isbn)
        const key = isbns.join('-') || `${book.title}-${book.datetime}`
        const alreadyPlanted = isbns.some((i) => plantedIsbns.has(i))
        const kdcCode = guessKdcFromKakaoBook(book)
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
