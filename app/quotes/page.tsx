'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { useAuth } from '@/hooks/useAuth'
import { getAllQuotesByUser, toggleQuoteFavorite } from '@/lib/quotes'
import { getPlantByKdc } from '@/lib/plants'
import type { QuoteWithRefs } from '@/types'

export default function QuotesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [quotes, setQuotes] = useState<QuoteWithRefs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [favOnly, setFavOnly] = useState(false)

  async function handleToggleFavorite(quote: QuoteWithRefs) {
    const next = !quote.is_favorite
    setQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, is_favorite: next } : q))
    )
    try {
      await toggleQuoteFavorite(quote.id, next)
    } catch (e) {
      setQuotes((prev) =>
        prev.map((q) => (q.id === quote.id ? { ...q, is_favorite: !next } : q))
      )
      setError(e as Error)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    let mounted = true
    getAllQuotesByUser(user.id)
      .then((qs) => {
        if (mounted) setQuotes(qs)
      })
      .catch((e) => {
        if (mounted) setError(e as Error)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [user])

  const visibleQuotes = useMemo(
    () => (favOnly ? quotes.filter((q) => q.is_favorite) : quotes),
    [quotes, favOnly]
  )

  const groups = useMemo(() => {
    const map = new Map<string, QuoteWithRefs[]>()
    for (const q of visibleQuotes) {
      const date = (q.watered_at ?? '').slice(0, 10)
      const list = map.get(date) ?? []
      list.push(q)
      map.set(date, list)
    }
    return Array.from(map.entries())
  }, [visibleQuotes])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header />
        <main className="mx-auto w-full max-w-3xl px-6 py-10 text-center text-stone-500">
          불러오는 중...
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header />

      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">📜 내 문장</h1>
            <p className="mt-1 text-sm text-stone-500">
              {loading ? '불러오는 중...' : `총 ${quotes.length}개의 한 줄을 남겼어요`}
            </p>
          </div>
          {!loading && quotes.length > 0 && (
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
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error.message}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-stone-500">불러오는 중...</p>
        ) : quotes.length === 0 ? (
          <EmptyState />
        ) : visibleQuotes.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 py-10 text-center text-sm text-stone-500">
            ⭐ 즐겨찾기한 문장이 없어요
          </p>
        ) : (
          <div className="relative space-y-10">
            <div
              aria-hidden
              className="pointer-events-none absolute left-[7px] top-2 bottom-2 w-px bg-amber-300/60"
            />
            {groups.map(([date, qs]) => (
              <section key={date} className="relative pl-8">
                <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-amber-300 bg-amber-50" />
                <h2 className="mb-3 text-sm font-semibold text-stone-700">
                  {formatDateHeader(date)}{' '}
                  <span className="ml-1 text-xs font-normal text-stone-400">
                    · {qs.length}개
                  </span>
                </h2>
                <ul className="space-y-3">
                  {qs.map((q) => (
                    <QuoteRow key={q.id} quote={q} onToggleFavorite={handleToggleFavorite} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function QuoteRow({
  quote,
  onToggleFavorite,
}: {
  quote: QuoteWithRefs
  onToggleFavorite: (q: QuoteWithRefs) => void
}) {
  const bookTitle = quote.book?.title ?? '책 정보 없음'
  const plantName =
    quote.plant?.plant_name ??
    getPlantByKdc(quote.book?.kdc_code ?? '')?.name ??
    null

  return (
    <li className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-amber-900/5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            {quote.book ? (
              <Link
                href={`/books/${quote.book.id}`}
                className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-700 transition hover:bg-stone-200"
              >
                📖 {bookTitle}
              </Link>
            ) : (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
                📖 {bookTitle}
              </span>
            )}
            {plantName && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                🌸 {plantName}
              </span>
            )}
            {quote.page_number && (
              <span className="text-stone-400">p.{quote.page_number}</span>
            )}
          </div>
          <blockquote className="mt-2 border-l-2 border-emerald-300 pl-3 text-sm italic leading-relaxed text-stone-800">
            &ldquo;{quote.content}&rdquo;
          </blockquote>
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(quote)}
          aria-label={quote.is_favorite ? '즐겨찾기 해제' : '즐겨찾기'}
          aria-pressed={!!quote.is_favorite}
          className="shrink-0 rounded-full px-2 py-1 text-base leading-none transition hover:bg-amber-50"
        >
          <span className={quote.is_favorite ? 'text-amber-500' : 'text-stone-300'}>★</span>
        </button>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">📝</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">
        아직 남긴 한 줄이 없어요
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        물주기를 하며 책에서 만난 문장을 모아보세요
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
      >
        🪴 정원으로 가기
      </Link>
    </div>
  )
}

function formatDateHeader(yyyyMmDd: string): string {
  if (!yyyyMmDd) return '날짜 미상'
  const [y, m, d] = yyyyMmDd.split('-')
  if (!y || !m || !d) return yyyyMmDd
  return `${y}.${m}.${d}`
}
