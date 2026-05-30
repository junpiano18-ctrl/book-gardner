'use client'

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { QuoteCard } from '@/components/Quote/QuoteCard'
import { ShelfView } from '@/components/Garden/ShelfView'
import {
  PlantIllustration,
  hasPlantIllustration,
} from '@/components/Plant/PlantIllustration'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'
import {
  getAllQuotesByUser,
  searchQuotes,
  toggleQuoteFavorite,
} from '@/lib/quotes'
import type { PlantWithBook, Quote, QuoteWithRefs } from '@/types'

const PREVIEW_LIMIT = 6
const RECENT_QUOTE_LIMIT = 4

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { plants, loading: plantsLoading } = useGarden(user?.id)
  const { books, loading: booksLoading } = useBook(user?.id)

  // 문장 검색
  const [quoteQuery, setQuoteQuery] = useState('')
  const [debouncedQuoteQuery, setDebouncedQuoteQuery] = useState('')
  const [quoteResults, setQuoteResults] = useState<QuoteWithRefs[]>([])
  const [quoteSearching, setQuoteSearching] = useState(false)
  const [quoteError, setQuoteError] = useState<Error | null>(null)

  // 최근 문장 (검색어 없을 때 미리보기)
  const [recentQuotes, setRecentQuotes] = useState<QuoteWithRefs[]>([])
  const [recentLoaded, setRecentLoaded] = useState(false)

  // 책 찾아 심기 (보조)
  const [bookQuery, setBookQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  // 디바운스 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuoteQuery(quoteQuery), 300)
    return () => clearTimeout(t)
  }, [quoteQuery])

  // 최근 문장 fetch (한 번)
  useEffect(() => {
    if (!user) return
    let mounted = true
    getAllQuotesByUser(user.id)
      .then((qs) => {
        if (!mounted) return
        setRecentQuotes(qs.slice(0, RECENT_QUOTE_LIMIT))
      })
      .catch(() => {
        // 무시 — 메인 검색에 영향 없음
      })
      .finally(() => {
        if (mounted) setRecentLoaded(true)
      })
    return () => {
      mounted = false
    }
  }, [user])

  // 키워드 검색 (debounced)
  useEffect(() => {
    if (!user) return
    const trimmed = debouncedQuoteQuery.trim()
    if (!trimmed) {
      setQuoteResults([])
      setQuoteSearching(false)
      setQuoteError(null)
      return
    }
    let mounted = true
    setQuoteSearching(true)
    searchQuotes(user.id, trimmed)
      .then((rs) => {
        if (!mounted) return
        setQuoteResults(rs)
        setQuoteError(null)
      })
      .catch((e) => {
        if (mounted) setQuoteError(e as Error)
      })
      .finally(() => {
        if (mounted) setQuoteSearching(false)
      })
    return () => {
      mounted = false
    }
  }, [debouncedQuoteQuery, user])

  // 즐겨찾기 토글 — recent + results 동시 반영
  async function handleToggleFavorite(quote: Quote) {
    const next = !quote.is_favorite
    const apply = (q: QuoteWithRefs) =>
      q.id === quote.id ? { ...q, is_favorite: next } : q
    setQuoteResults((prev) => prev.map(apply))
    setRecentQuotes((prev) => prev.map(apply))
    try {
      await toggleQuoteFavorite(quote.id, next)
    } catch (e) {
      const revert = (q: QuoteWithRefs) =>
        q.id === quote.id ? { ...q, is_favorite: !next } : q
      setQuoteResults((prev) => prev.map(revert))
      setRecentQuotes((prev) => prev.map(revert))
      setQuoteError(e as Error)
    }
  }

  function handleBookSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = bookQuery.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  // 정원/책장 미리보기
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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header activeKey="home" />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
          불러오는 중...
        </main>
      </div>
    )
  }

  const previewLoading = plantsLoading || booksLoading
  const preview = plantsWithBooks.slice(0, PREVIEW_LIMIT)
  const trimmedQuery = debouncedQuoteQuery.trim()
  const isSearching = trimmedQuery.length > 0
  const debouncing = quoteQuery.trim() !== trimmedQuery

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="home" />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {/* (A) 메인 — 내 문장 검색 */}
        <section className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
            📜 내 문장에서 찾기
          </h1>
          <p className="mt-2 text-sm text-stone-500 sm:text-base">
            모아둔 문장을 키워드로 다시 만나요
          </p>

          <div className="relative mt-6 w-full max-w-[560px]">
            <span
              aria-hidden
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-stone-400"
            >
              🔍
            </span>
            <input
              type="search"
              value={quoteQuery}
              onChange={(e) => setQuoteQuery(e.target.value)}
              placeholder="유클리드, 사랑, 시간..."
              aria-label="내 문장 키워드 검색"
              className="h-14 w-full rounded-full border-2 border-amber-300 bg-white pl-12 pr-12 text-base text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
            {quoteQuery && (
              <button
                type="button"
                onClick={() => setQuoteQuery('')}
                aria-label="검색어 지우기"
                className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* 결과 또는 최근 문장 */}
        <section className="mt-6">
          {quoteError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {quoteError.message}
            </div>
          )}

          {isSearching ? (
            <SearchBlock
              keyword={trimmedQuery}
              results={quoteResults}
              loading={debouncing || quoteSearching}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <RecentBlock
              quotes={recentQuotes}
              loaded={recentLoaded}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </section>

        {/* (B) 보조 — 새 책 찾아 심기 */}
        <section className="mt-12 rounded-2xl bg-white/60 p-4 ring-1 ring-amber-900/5 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-stone-700">
              📚 새 책 찾아 심기
            </h2>
            <Link
              href="/search"
              className="text-xs text-stone-500 transition hover:text-stone-700"
            >
              전체 검색 →
            </Link>
          </div>
          <form onSubmit={handleBookSearch} className="mt-3 flex gap-2">
            <input
              type="search"
              value={bookQuery}
              onChange={(e) => setBookQuery(e.target.value)}
              placeholder="책 제목, 저자"
              aria-label="책 검색"
              className="h-10 flex-1 rounded-full border border-stone-300 bg-white px-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full bg-stone-800 px-4 text-sm font-medium text-white transition hover:bg-stone-900"
            >
              찾기
            </button>
          </form>
        </section>

        {/* (C) 정원/책장 미리보기 — 보조 위계 */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <PreviewSection
            title="🌱 내 정원"
            subtitle="자라는 중인 식물들"
            href="/garden"
            loading={previewLoading}
            isEmpty={preview.length === 0}
            emptyText="아직 심은 책이 없어요"
          >
            <div className="grid grid-cols-3 gap-3">
              {preview.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => router.push(`/shelf?bookId=${p.book_id}`)}
                  className="flex min-h-[88px] flex-col items-center rounded-xl bg-white/70 p-2 ring-1 ring-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {hasPlantIllustration(p.kdc_code) ? (
                    <PlantIllustration
                      kdcCode={p.kdc_code}
                      stage={p.stage}
                      size={56}
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center text-3xl">
                      🌸
                    </div>
                  )}
                  <span className="mt-1 line-clamp-1 w-full text-center text-[11px] text-stone-600">
                    {p.plant_name}
                  </span>
                </button>
              ))}
            </div>
          </PreviewSection>

          <PreviewSection
            title="📚 내 책장"
            subtitle="꽂아둔 책들"
            href="/shelf"
            loading={previewLoading}
            isEmpty={preview.length === 0}
            emptyText="아직 꽂은 책이 없어요"
          >
            <ShelfView
              plants={preview}
              booksPerShelf={PREVIEW_LIMIT}
              onSelect={(plant) => router.push(`/shelf?bookId=${plant.book_id}`)}
            />
          </PreviewSection>
        </div>
      </main>
    </div>
  )
}

function SearchBlock({
  keyword,
  results,
  loading,
  onToggleFavorite,
}: {
  keyword: string
  results: QuoteWithRefs[]
  loading: boolean
  onToggleFavorite: (q: Quote) => void
}) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between text-xs text-stone-500">
        <span>
          🔍 &ldquo;{keyword}&rdquo;
          {!loading && (
            <span className="ml-1.5 text-stone-400">· {results.length}개</span>
          )}
        </span>
      </div>
      {loading ? (
        <p className="py-10 text-center text-sm text-stone-500">검색 중...</p>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-10 text-center">
          <div className="text-3xl">🔎</div>
          <p className="mt-2 text-sm text-stone-700">
            아직 &ldquo;{keyword}&rdquo;가 들어간 문장이 없어요
          </p>
          <p className="mt-1 text-xs text-stone-500">
            다른 키워드로 다시 시도해보세요
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              keyword={keyword}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </ul>
      )}
    </>
  )
}

function RecentBlock({
  quotes,
  loaded,
  onToggleFavorite,
}: {
  quotes: QuoteWithRefs[]
  loaded: boolean
  onToggleFavorite: (q: Quote) => void
}) {
  if (!loaded) {
    return (
      <p className="py-10 text-center text-sm text-stone-400">
        문장을 불러오는 중...
      </p>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-12 text-center">
        <div className="text-4xl">📝</div>
        <p className="mt-3 text-sm text-stone-600">아직 모아둔 문장이 없어요</p>
        <p className="mt-1 text-xs text-stone-500">
          정원에서 화분에 물을 주며 첫 문장을 남겨보세요
        </p>
        <Link
          href="/garden"
          className="mt-4 inline-flex rounded-full bg-stone-800 px-4 py-2 text-xs font-medium text-white transition hover:bg-stone-900"
        >
          🪴 정원으로 가기
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-stone-500">
        <span>📜 최근 문장</span>
        <Link href="/quotes" className="transition hover:text-stone-700">
          전체보기 →
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {quotes.map((q) => (
          <QuoteCard
            key={q.id}
            quote={q}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ul>
    </div>
  )
}

function PreviewSection({
  title,
  subtitle,
  href,
  loading,
  isEmpty,
  emptyText,
  children,
}: {
  title: string
  subtitle: string
  href: string
  loading: boolean
  isEmpty: boolean
  emptyText: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-amber-900/5 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
          <p className="truncate text-xs text-stone-500">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-200"
        >
          전체보기 →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl bg-white/40 px-4 py-10 text-sm text-stone-400">
          불러오는 중...
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 bg-white/40 px-4 py-8 text-center text-sm text-stone-500">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
