'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { QuoteCard } from '@/components/Quote/QuoteCard'
import { useAuth } from '@/hooks/useAuth'
import {
  getAllQuotesByUser,
  searchQuotes,
  toggleQuoteFavorite,
} from '@/lib/quotes'
import type { Quote, QuoteWithRefs } from '@/types'

export default function QuotesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [allQuotes, setAllQuotes] = useState<QuoteWithRefs[]>([])
  const [allLoaded, setAllLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [favOnly, setFavOnly] = useState(false)

  // 검색 상태
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<QuoteWithRefs[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  // 전체 fetch (한 번)
  useEffect(() => {
    if (!user) return
    let mounted = true
    getAllQuotesByUser(user.id)
      .then((qs) => {
        if (mounted) setAllQuotes(qs)
      })
      .catch((e) => {
        if (mounted) setError(e as Error)
      })
      .finally(() => {
        if (mounted) setAllLoaded(true)
      })
    return () => {
      mounted = false
    }
  }, [user])

  // 디바운스 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // 키워드 검색
  useEffect(() => {
    if (!user) return
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setSearchResults([])
      setSearching(false)
      return
    }
    let mounted = true
    setSearching(true)
    searchQuotes(user.id, trimmed)
      .then((rs) => {
        if (mounted) setSearchResults(rs)
      })
      .catch((e) => {
        if (mounted) setError(e as Error)
      })
      .finally(() => {
        if (mounted) setSearching(false)
      })
    return () => {
      mounted = false
    }
  }, [debouncedQuery, user])

  // 즐겨찾기 토글 — allQuotes + searchResults 양쪽 동기화
  async function handleToggleFavorite(quote: Quote) {
    const next = !quote.is_favorite
    const apply = (q: QuoteWithRefs) =>
      q.id === quote.id ? { ...q, is_favorite: next } : q
    setAllQuotes((prev) => prev.map(apply))
    setSearchResults((prev) => prev.map(apply))
    try {
      await toggleQuoteFavorite(quote.id, next)
    } catch (e) {
      const revert = (q: QuoteWithRefs) =>
        q.id === quote.id ? { ...q, is_favorite: !next } : q
      setAllQuotes((prev) => prev.map(revert))
      setSearchResults((prev) => prev.map(revert))
      setError(e as Error)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header activeKey="quotes" />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
          불러오는 중...
        </main>
      </div>
    )
  }

  const trimmedQuery = debouncedQuery.trim()
  const isSearchingMode = trimmedQuery.length > 0
  const debouncing = query.trim() !== trimmedQuery

  // 즐겨찾기 토글이 적용된 표시 목록 (검색 모드 아닐 때만)
  const browseList = favOnly
    ? allQuotes.filter((q) => q.is_favorite)
    : allQuotes

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="quotes" />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-stone-800">📇 내 문장</h1>
          <p className="mt-1 text-sm text-stone-500">
            키워드로 흩어진 생각을 다시 모아보세요
            {allLoaded && allQuotes.length > 0 && (
              <span className="ml-1.5 text-stone-400">
                · 총 {allQuotes.length}개
              </span>
            )}
          </p>
        </header>

        {/* 검색창 */}
        <div className="relative mb-5">
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          >
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="문장이나 키워드로 검색..."
            aria-label="문장 검색"
            className="w-full rounded-full border border-amber-200 bg-white/80 py-3 pl-11 pr-11 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* 검색 모드 상태바 또는 즐겨찾기 토글 */}
        {isSearchingMode ? (
          <div className="mb-4 text-xs text-stone-500">
            🔍 &ldquo;{trimmedQuery}&rdquo;
            {!debouncing && !searching && (
              <span className="ml-1.5 text-stone-400">
                · {searchResults.length}개
              </span>
            )}
          </div>
        ) : (
          allLoaded &&
          allQuotes.length > 0 && (
            <div className="mb-4 flex items-center justify-between text-xs text-stone-500">
              <span>
                {favOnly ? '⭐ 즐겨찾기' : '전체'} · {browseList.length}개
              </span>
              <button
                type="button"
                onClick={() => setFavOnly((v) => !v)}
                aria-pressed={favOnly}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  favOnly
                    ? 'bg-amber-200 text-amber-900 ring-1 ring-amber-300'
                    : 'bg-stone-200/70 text-stone-600 hover:text-stone-800'
                }`}
              >
                ⭐ 즐겨찾기만
              </button>
            </div>
          )
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error.message}
          </div>
        )}

        {/* 본문 */}
        {!allLoaded ? (
          <p className="py-16 text-center text-sm text-stone-500">
            불러오는 중...
          </p>
        ) : isSearchingMode ? (
          debouncing || searching ? (
            <p className="py-10 text-center text-sm text-stone-500">검색 중...</p>
          ) : searchResults.length === 0 ? (
            <EmptySearchResult keyword={trimmedQuery} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {searchResults.map((q) => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  keyword={trimmedQuery}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </ul>
          )
        ) : allQuotes.length === 0 ? (
          <EmptyCardBox />
        ) : browseList.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 py-10 text-center text-sm text-stone-500">
            ⭐ 즐겨찾기한 문장이 없어요
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {browseList.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function EmptySearchResult({ keyword }: { keyword: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-12 text-center">
      <div className="text-3xl">🔎</div>
      <p className="mt-2 text-sm text-stone-700">
        &ldquo;{keyword}&rdquo; 들어간 문장이 아직 없어요
      </p>
      <p className="mt-1 text-xs text-stone-500">
        다른 키워드로 다시 시도해보세요
      </p>
    </div>
  )
}

function EmptyCardBox() {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">📇</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">
        아직 카드함이 비어 있어요
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        정원에서 화분에 물을 주며 첫 문장을 모아보세요
      </p>
      <Link
        href="/garden"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
      >
        🪴 정원으로 가기
      </Link>
    </div>
  )
}
