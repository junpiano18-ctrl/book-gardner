'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { ShelfView } from '@/components/Garden/ShelfView'
import { WaterModal } from '@/components/ui/WaterModal'
import { PlantIllustration } from '@/components/Plant/PlantIllustration'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'
import {
  getQuotesByBook,
  searchQuotes,
  toggleQuoteFavorite,
} from '@/lib/quotes'
import type { PlantStage, PlantWithBook, Quote, QuoteWithRefs } from '@/types'

const STAGE_LABEL: Record<PlantStage, string> = {
  seed: '씨앗',
  sprout: '새싹',
  growing: '성장',
  bloom: '개화',
}

export default function ShelfPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex-1"
          style={{ backgroundColor: '#fdf6ee' }}
        >
          <Header activeKey="shelf" />
          <main className="mx-auto w-full max-w-5xl px-6 py-10 text-center text-stone-500">
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
  const searchParams = useSearchParams()
  const queryBookId = searchParams.get('bookId')

  const { user, loading: authLoading } = useAuth()
  const {
    plants,
    loading: plantsLoading,
    error: plantsError,
    waterPlant,
  } = useGarden(user?.id)
  const { books, loading: booksLoading, error: booksError } = useBook(user?.id)

  const [userBookId, setUserBookId] = useState<string | null>(queryBookId)
  const [quotesByBook, setQuotesByBook] = useState<Record<string, Quote[]>>({})
  const [waterModalPlant, setWaterModalPlant] = useState<PlantWithBook | null>(null)
  const loadedRef = useRef<Set<string>>(new Set())

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<QuoteWithRefs[]>([])
  const [searchError, setSearchError] = useState<Error | null>(null)
  const [bookFilter, setBookFilter] = useState<string | null>(null)

  // 디바운스 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // 디바운스된 쿼리로 실제 검색 — setState는 모두 async 콜백 안에서만
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

  // 유효한 선택 ID를 derive — 사용자가 고른 값이 plants에 없으면 첫 책으로 폴백
  const selectedBookId = useMemo(() => {
    if (plantsWithBooks.length === 0) return null
    if (userBookId && plantsWithBooks.some((p) => p.book_id === userBookId)) {
      return userBookId
    }
    return plantsWithBooks[0].book_id
  }, [plantsWithBooks, userBookId])

  // 선택된 책의 quote를 한 번만 fetch
  useEffect(() => {
    if (!selectedBookId) return
    if (loadedRef.current.has(selectedBookId)) return
    loadedRef.current.add(selectedBookId)
    let mounted = true
    getQuotesByBook(selectedBookId)
      .then((qs) => {
        if (!mounted) return
        setQuotesByBook((prev) => ({ ...prev, [selectedBookId]: qs }))
      })
      .catch(() => {
        loadedRef.current.delete(selectedBookId)
      })
    return () => {
      mounted = false
    }
  }, [selectedBookId])

  function handleSelect(plant: PlantWithBook) {
    setUserBookId(plant.book_id)
    router.replace(`/shelf?bookId=${plant.book_id}`, { scroll: false })
  }

  async function handleToggleFavorite(quote: Quote) {
    try {
      const updated = await toggleQuoteFavorite(quote.id, !quote.is_favorite)
      setQuotesByBook((prev) => ({
        ...prev,
        [quote.book_id]: (prev[quote.book_id] ?? []).map((q) =>
          q.id === quote.id ? updated : q
        ),
      }))
      setSearchResults((prev) =>
        prev.map((q) =>
          q.id === quote.id ? { ...q, is_favorite: updated.is_favorite } : q
        )
      )
    } catch {
      // 무시 — UI는 다음 fetch 때 보정됨
    }
  }

  const selected = useMemo(
    () => plantsWithBooks.find((p) => p.book_id === selectedBookId) ?? null,
    [plantsWithBooks, selectedBookId]
  )
  const quotes = selectedBookId ? quotesByBook[selectedBookId] : undefined

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex-1"
        style={{ backgroundColor: '#fdf6ee' }}
      >
        <Header activeKey="shelf" />
        <main className="mx-auto w-full max-w-3xl px-6 py-10 text-center text-stone-500">
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

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-stone-800">📚 나의 책장</h1>
          <p className="mt-1 text-sm text-stone-500">
            책을 클릭하면 그 책에 남긴 문장이 펼쳐져요
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
          <>
            <ShelfView
              plants={plantsWithBooks}
              selectedId={selectedBookId}
              onSelect={handleSelect}
            />

            <div className="mt-8">
              {selected ? (
                <SelectionPanel
                  plant={selected}
                  quotes={quotes}
                  onWater={() => setWaterModalPlant(selected)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-10 text-center text-sm text-stone-500">
                  위에서 책을 골라보세요
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <WaterModal
        plant={waterModalPlant}
        onClose={() => setWaterModalPlant(null)}
        onWater={waterPlant}
      />
    </div>
  )
}

function SelectionPanel({
  plant,
  quotes,
  onWater,
  onToggleFavorite,
}: {
  plant: PlantWithBook
  quotes: Quote[] | undefined
  onWater: () => void
  onToggleFavorite: (q: Quote) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <PlantIllustration kdcCode={plant.kdc_code} stage={plant.stage} size={56} />
        <div>
          <h2 className="text-lg font-bold text-stone-800">{plant.book.title}</h2>
          <p className="text-xs text-stone-500">
            {plant.book.author ?? '저자 미상'} · 🌸 {plant.plant_name}
            {quotes && quotes.length > 0 && ` · 📜 ${quotes.length}개의 문장`}
          </p>
        </div>
      </div>

      <QuoteSlider quotes={quotes} onToggleFavorite={onToggleFavorite} />

      <ProgressDock plant={plant} onWater={onWater} />
    </div>
  )
}

function QuoteSlider({
  quotes,
  onToggleFavorite,
}: {
  quotes: Quote[] | undefined
  onToggleFavorite: (q: Quote) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'prev' | 'next') {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-quote-card]')
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' })
  }

  if (quotes === undefined) {
    return (
      <div className="rounded-2xl bg-white/60 px-6 py-10 text-center text-sm text-stone-500">
        문장을 불러오는 중...
      </div>
    )
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-10 text-center text-sm text-stone-500">
        아직 이 책에 남긴 문장이 없어요. 💧 물주기로 첫 문장을 남겨보세요
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll('prev')}
        aria-label="이전 문장"
        className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-stone-700 shadow ring-1 ring-stone-200 transition hover:bg-white"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => scroll('next')}
        aria-label="다음 문장"
        className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 translate-x-1 items-center justify-center rounded-full bg-white/90 text-lg text-stone-700 shadow ring-1 ring-stone-200 transition hover:bg-white"
      >
        ›
      </button>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-10 pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {quotes.map((q) => (
          <QuoteCard key={q.id} quote={q} onToggleFavorite={onToggleFavorite} />
        ))}
      </div>
    </div>
  )
}

function QuoteCard({
  quote,
  onToggleFavorite,
}: {
  quote: Quote
  onToggleFavorite: (q: Quote) => void
}) {
  return (
    <article
      data-quote-card
      className="relative shrink-0 snap-center rounded-2xl bg-amber-50 px-7 py-6 shadow-md ring-1 ring-amber-200/80"
      style={{
        width: 'min(320px, 80vw)',
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(218,184,134,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,236,200,0.5), transparent 60%)',
      }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-xl ring-1 ring-amber-300/40" />

      <button
        type="button"
        onClick={() => onToggleFavorite(quote)}
        aria-label={quote.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        aria-pressed={!!quote.is_favorite}
        className="absolute right-3 top-3 z-10 text-lg transition hover:scale-110"
      >
        {quote.is_favorite ? '⭐' : '☆'}
      </button>

      <div className="font-serif text-5xl leading-none text-amber-700/50">❝</div>
      <p
        className="mt-2 text-base italic leading-relaxed text-stone-800"
        style={{ fontFamily: '"Nanum Myeongjo", var(--font-geist-sans), serif' }}
      >
        {quote.content}
      </p>
      <div className="mt-2 flex justify-end font-serif text-5xl leading-none text-amber-700/50">
        ❞
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
        <span>{quote.page_number ? `p.${quote.page_number}` : ''}</span>
        <span>{formatDate(quote.watered_at)}</span>
      </div>
    </article>
  )
}

function ProgressDock({
  plant,
  onWater,
}: {
  plant: PlantWithBook
  onWater: () => void
}) {
  const progress = plant.growth_point % 100
  const isCompleted = !!plant.completed_at

  return (
    <div className="rounded-2xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-amber-900/5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-700">
          {STAGE_LABEL[plant.stage]} · 총 {plant.growth_point}pt
          {isCompleted && (
            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700">
              완독
            </span>
          )}
        </span>
        <span className="text-stone-500">{progress} / 100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all"
          style={{ width: `${isCompleted ? 100 : progress}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onWater}
        className="mt-4 w-full rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99]"
      >
        💧 {isCompleted ? '도감에 한 줄 더하기' : '물주기'}
      </button>
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

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
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
            <SearchResultCard
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

function SearchResultCard({
  quote,
  keyword,
  onToggleFavorite,
}: {
  quote: QuoteWithRefs
  keyword: string
  onToggleFavorite: (q: Quote) => void
}) {
  return (
    <li
      className="rounded-2xl bg-amber-50 px-5 py-4 shadow-sm ring-1 ring-amber-200/70"
      style={{
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(218,184,134,0.12), transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,236,200,0.45), transparent 60%)',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="line-clamp-1 font-medium text-stone-700">
          📖 {quote.book?.title ?? '책 정보 없음'}
        </span>
        <span className="shrink-0 text-stone-400">
          {formatDate(quote.watered_at)}
        </span>
      </div>

      <blockquote
        className="border-l-2 border-amber-400 pl-3 text-sm italic leading-relaxed text-stone-800"
        style={{ fontFamily: '"Nanum Myeongjo", var(--font-geist-sans), serif' }}
      >
        <HighlightedText text={quote.content} keyword={keyword} />
      </blockquote>

      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
        <button
          type="button"
          onClick={() => onToggleFavorite(quote)}
          aria-label={quote.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          aria-pressed={!!quote.is_favorite}
          className="text-base transition hover:scale-110"
        >
          {quote.is_favorite ? '⭐' : '☆'}
        </button>
        {quote.page_number && <span>p.{quote.page_number}</span>}
      </div>
    </li>
  )
}

function HighlightedText({
  text,
  keyword,
}: {
  text: string
  keyword: string
}) {
  const trimmed = keyword.trim()
  if (!trimmed) return <>{text}</>
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  const lowerKey = trimmed.toLowerCase()
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lowerKey ? (
          <mark
            key={i}
            className="rounded bg-yellow-200 px-0.5 text-stone-900"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
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
