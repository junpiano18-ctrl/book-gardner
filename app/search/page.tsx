'use client'

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { BookSearchResult } from '@/components/Book/BookSearchResult'
import { LibrarianPicks } from '@/components/Search/LibrarianPicks'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'
import { getPlantByKdc } from '@/lib/plants'
import { normalizeIsbns } from '@/lib/books'
import type { KakaoBook } from '@/types'

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
          <Header />
          <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
            불러오는 중...
          </main>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  )
}

function SearchPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { books, searchResults, searching, searchBooks, addBook, error } = useBook(user?.id)
  const { addPlant } = useGarden(user?.id)

  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [plantingIsbn, setPlantingIsbn] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  // "한 번이라도 검색했는가" — 0건일 때 안내 메시지 노출 트리거
  const [hasSearched, setHasSearched] = useState(false)
  const autoSearchedRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  // 대시보드에서 ?q= 로 넘어온 검색어는 한 번 자동 실행
  useEffect(() => {
    if (autoSearchedRef.current || !user) return
    const q = initialQuery.trim()
    if (!q) return
    autoSearchedRef.current = true
    setHasSearched(true)
    searchBooks(q)
  }, [user, initialQuery, searchBooks])

  const plantedIsbns = new Set<string>(
    books.flatMap((b) => normalizeIsbns(b.isbn))
  )

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!query.trim()) return
    setHasSearched(true)
    await searchBooks(query)
  }

  async function handlePlant(book: KakaoBook, kdcCode: string) {
    if (!user) return
    const isbns = normalizeIsbns(book.isbn)
    const primaryIsbn = isbns[isbns.length - 1] ?? ''

    const kdcPlant = getPlantByKdc(kdcCode)
    if (!kdcPlant) {
      setFlash(`KDC ${kdcCode}에 해당하는 식물이 없어요`)
      return
    }

    setPlantingIsbn(primaryIsbn)
    setFlash(null)
    try {
      const newBook = await addBook({
        user_id: user.id,
        isbn: primaryIsbn || undefined,
        title: book.title,
        author: book.authors.join(', ') || undefined,
        publisher: book.publisher || undefined,
        cover_url: book.thumbnail || undefined,
        kdc_code: kdcCode,
        status: 'reading',
        total_pages: undefined,
      })

      await addPlant({
        book_id: newBook.id,
        user_id: user.id,
        kdc_code: kdcCode,
        plant_name: kdcPlant.name,
        sci_name: kdcPlant.sci,
        family_name: kdcPlant.family,
        stage: 'seed',
        growth_point: 0,
      })

      setFlash(`🪴 "${book.title}"을(를) 정원에 심었어요`)
    } catch (e) {
      setFlash((e as Error).message ?? '심기에 실패했어요')
    } finally {
      setPlantingIsbn(null)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
          불러오는 중...
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-800">📖 책 검색</h1>
          <p className="mt-1 text-sm text-stone-500">
            카카오 책 검색에서 찾아 정원에 심어보세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="책 제목, 저자, 출판사로 검색"
            className="flex-1 rounded-full border border-stone-300 bg-white/80 px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="rounded-full bg-stone-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            검색
          </button>
        </form>

        {flash && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {flash}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error.message}
          </div>
        )}

        <LibrarianPicks
          plantedIsbns={plantedIsbns}
          plantingIsbn={plantingIsbn}
          onPlant={handlePlant}
        />

        <BookSearchResult
          results={searchResults}
          searching={searching}
          hasSearched={hasSearched}
          plantedIsbns={plantedIsbns}
          plantingIsbn={plantingIsbn}
          onPlant={handlePlant}
        />
      </main>
    </div>
  )
}
