'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { ShelfView } from '@/components/Garden/ShelfView'
import { QuoteCard } from '@/components/Quote/QuoteCard'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'
import { searchQuotes, toggleQuoteFavorite } from '@/lib/quotes'
import type { PlantWithBook, Quote, QuoteWithRefs } from '@/types'

export default function ShelfPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex-1"
          style={{ backgroundColor: '#fdf6ee' }}
        >
          <Header activeKey="shelf" />
          <main className="mx-auto w-full max-w-5xl px-4 py-10 text-center text-stone-500 sm:px-6">
            불러오는 중...
          </main>
        </div>
      }
    >
      <ShelfPageInner />
    </Suspense>
  )
}

function ShelfPageInner() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    plants,
    loading: plantsLoading,
    error: plantsError,
  } = useGarden(user?.id)
  const { books, loading: booksLoading, error: booksError } = useBook(user?.id)

  // 책장 상단 — 사용자 문장 전체 검색 (인라인 책 펼침과 무관, 유지)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<QuoteWithRefs[]>([])
  const [searchError, setSearchError] = useState<Error | null>(null)
  const [bookFilter, setBookFilter] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (!user) return
    const trimmed = debouncedQuery.trim()
    if (!trimmed) return
    let mounted = true
    searchQuotes(user.id, trimmed)
      .then((rs) => {
        if (!mounted) return
        setSearchResults(rs)
        setSearchError(null)
      })
      .catch((e) => {
        if (mounted) setSearchError(e as Error)
      })
    return () => {
      mounted = false
    }
  }, [debouncedQuery, user])

  const isSearching = debouncedQuery.trim().length > 0

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  const plantsWithBooks = useMemo<PlantWithBook[]>(() => {
    if (plants.length === 0) return []
    const booksById = new Map(books.map((b) => [b.id, b]))
    return plants
      .map((p) => {
        const book = booksById.get(p.book_id)
        return book ? { ...p, book } : null
      })
      .filter((p): p is PlantWithBook => p !== null)
  }, [plants, books])

  // 책 클릭 → 곧바로 책 상세 페이지로 (이전엔 같은 페이지에서 인라인 펼침이었음)
  function handleSelect(plant: PlantWithBook) {
    router.push(`/books/${plant.book_id}`)
  }

  async function handleToggleFavorite(quote: Quote) {
    try {
      const updated = await toggleQuoteFavorite(quote.id, !quote.is_favorite)
      setSearchResults((prev) =>
        prev.map((q) =>
          q.id === quote.id ? { ...q, is_favorite: updated.is_favorite } : q
        )
      )
    } catch {
      // 무시 — UI는 다음 fetch 때 보정됨
    }
  }

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex-1"
        style={{ backgroundColor: '#fdf6ee' }}
      >
        <Header activeKey="shelf" />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
          불러오는 중...
        </main>
      </div>
    )
  }

  const dataLoading = plantsLoading || booksLoading
  const dataError = plantsError ?? booksError

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="shelf" />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-stone-800">📚 나의 책장</h1>
          <p className="mt-1 text-sm text-stone-500">
            책을 클릭하면 그 책의 상세 페이지로 이동해요
          </p>
        </header>

        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v)
              setBookFilter(null)
            }}
            onClear={() => {
              setSearchQuery('')
              setBookFilter(null)
            }}
          />
        </div>

        {dataError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {dataError.message}
          </div>
        )}

        {isSearching ? (
          <SearchResults
            keyword={debouncedQuery.trim()}
            rawKeyword={searchQuery.trim()}
            results={searchResults}
            error={searchError}
            bookFilter={bookFilter}
            onBookFilter={setBookFilter}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : dataLoading ? (
          <ShelfSkeleton />
        ) : plantsWithBooks.length === 0 ? (
          <EmptyShelf />
        ) : (
          <ShelfView plants={plantsWithBooks} onSelect={handleSelect} />
        )}
      </main>
    </div>
  )
}

function ShelfSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-[260px] animate-pulse rounded-2xl bg-amber-100/60" />
      <div className="h-24 animate-pulse rounded-2xl bg-white/60" />
    </div>
  )
}

function EmptyShelf() {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">📚</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">
        책장이 아직 비어 있어요
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        책을 검색해 첫 책을 꽂아보세요
      </p>
      <Link
        href="/search"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
      >
        🔍 책 검색으로 가기
      </Link>
    </div>
  )
}

function SearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string
  onChange: (v: string) => void
  onClear: () => void
}) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
        aria-hidden
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="문장에서 키워드 검색 (예: 사랑, 시간, 기억...)"
        className="w-full rounded-full border border-amber-200 bg-white/80 py-3 pl-12 pr-12 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="검색어 지우기"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
        >
          ✕
        </button>
      )}
    </div>
  )
}

function SearchResults({
  keyword,
  rawKeyword,
  results,
  error,
  bookFilter,
  onBookFilter,
  onToggleFavorite,
}: {
  keyword: string
  rawKeyword: string
  results: QuoteWithRefs[]
  error: Error | null
  bookFilter: string | null
  onBookFilter: (id: string | null) => void
  onToggleFavorite: (q: Quote) => void
}) {
  // 디바운스 대기 중인 상태 표시
  const debouncing = rawKeyword !== keyword

  // 책별 개수 집계
  const bookGroups = (() => {
    const map = new Map<string, { title: string; count: number }>()
    for (const r of results) {
      if (!r.book) continue
      const ex = map.get(r.book.id)
      if (ex) ex.count++
      else map.set(r.book.id, { title: r.book.title, count: 1 })
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count)
  })()

  const filtered = bookFilter
    ? results.filter((r) => r.book_id === bookFilter)
    : results

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-amber-900/5">
        <p className="text-sm font-medium text-stone-700">
          🔍 &ldquo;{keyword}&rdquo; 검색
          {!debouncing && !error && (
            <span className="ml-2 text-xs text-stone-500">
              · 총 {results.length}개
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error.message}
        </div>
      )}

      {bookGroups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Chip active={bookFilter === null} onClick={() => onBookFilter(null)}>
            전체 ({results.length})
          </Chip>
          {bookGroups.map(([id, info]) => (
            <Chip
              key={id}
              active={bookFilter === id}
              onClick={() => onBookFilter(id)}
            >
              {info.title} ({info.count})
            </Chip>
          ))}
        </div>
      )}

      {debouncing && results.length === 0 ? (
        <p className="py-12 text-center text-sm text-stone-500">
          검색 중...
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-12 text-center">
          <div className="text-4xl">🔎</div>
          <p className="mt-2 text-sm text-stone-600">검색 결과가 없어요</p>
          <p className="mt-0.5 text-xs text-stone-400">
            다른 키워드로 시도해보세요
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              keyword={keyword}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-amber-700 text-white shadow-sm'
          : 'bg-white/70 text-stone-700 ring-1 ring-amber-200 hover:bg-amber-50'
      }`}
    >
      {children}
    </button>
  )
}
