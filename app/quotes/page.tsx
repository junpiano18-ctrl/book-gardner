'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { QuoteCard } from '@/components/Quote/QuoteCard'
import { useAuth } from '@/hooks/useAuth'
import { getAllQuotesByUser, toggleQuoteFavorite } from '@/lib/quotes'
import type { Quote, QuoteWithRefs } from '@/types'

export default function QuotesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [allQuotes, setAllQuotes] = useState<QuoteWithRefs[]>([])
  const [allLoaded, setAllLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [favOnly, setFavOnly] = useState(false)
  const [query, setQuery] = useState('')

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

  // 클라이언트 필터: 단어 포함 (대소문자 무시) + 즐겨찾기 토글
  const visible = useMemo(() => {
    const trimmed = query.trim()
    let list = allQuotes
    if (trimmed) {
      const lower = trimmed.toLowerCase()
      list = list.filter((q) => q.content.toLowerCase().includes(lower))
    }
    if (favOnly) list = list.filter((q) => q.is_favorite)
    return list
  }, [allQuotes, query, favOnly])

  async function handleToggleFavorite(quote: Quote) {
    const next = !quote.is_favorite
    setAllQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, is_favorite: next } : q))
    )
    try {
      await toggleQuoteFavorite(quote.id, next)
    } catch (e) {
      setAllQuotes((prev) =>
        prev.map((q) =>
          q.id === quote.id ? { ...q, is_favorite: !next } : q
        )
      )
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

  const trimmedQuery = query.trim()
  const isSearchingMode = trimmedQuery.length > 0

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="quotes" />

      <main className="mx-auto w-full max-w-4xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <header className="mb-4">
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

        {/* AI 문장 숲 입구 — 카드 목록 위 가로 배너 */}
        {allLoaded && allQuotes.length > 0 && (
          <ForestBanner quoteCount={allQuotes.length} />
        )}

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
            <span className="ml-1.5 text-stone-400">
              · {visible.length}개
            </span>
          </div>
        ) : (
          allLoaded &&
          allQuotes.length > 0 && (
            <div className="mb-4 flex items-center justify-between text-xs text-stone-500">
              <span>
                {favOnly ? '⭐ 즐겨찾기' : '전체'} · {visible.length}개
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
        ) : allQuotes.length === 0 ? (
          <EmptyCardBox />
        ) : visible.length === 0 ? (
          isSearchingMode ? (
            <EmptySearchResult keyword={trimmedQuery} />
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 py-10 text-center text-sm text-stone-500">
              ⭐ 즐겨찾기한 문장이 없어요
            </p>
          )
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                keyword={isSearchingMode ? trimmedQuery : ''}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

// AI 문장 숲 입구 배너 — 깊은 숲 톤 + warm glow.
// 카드함 진입자가 자연스럽게 발견하도록 카드 목록 바로 위에 노출.
function ForestBanner({ quoteCount }: { quoteCount: number }) {
  return (
    <Link
      href="/forest"
      aria-label="AI 문장 숲 열기"
      className="group relative mb-5 block overflow-hidden rounded-2xl shadow-[0_10px_30px_-14px_rgba(20,40,30,0.55)] transition active:scale-[0.995]"
      style={{
        background:
          'linear-gradient(135deg, #0e1a36 0%, #14302a 50%, #2c1f12 100%)',
      }}
    >
      {/* 우측 warm glow — 따뜻한 호박색 빛이 숲 너머에서 새어 나오는 느낌 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 100% 50%, rgba(251,191,36,0.22), transparent 55%)',
        }}
      />
      {/* 좌하단 짙은 글로우 — 깊이감 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 0% 100%, rgba(16,185,129,0.12), transparent 50%)',
        }}
      />
      {/* 미세한 빛 입자 */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[18%] top-[22%] text-[10px]"
        style={{ color: 'rgba(251,224,158,0.65)' }}
      >
        ✦
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-[34%] top-[68%] text-[8px]"
        style={{ color: 'rgba(251,224,158,0.45)' }}
      >
        ✦
      </span>

      <div className="relative flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5">
        {/* 좌측 — 숲 입구 아이콘 */}
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl sm:h-14 sm:w-14 sm:text-3xl"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(251,191,36,0.28), rgba(20,48,42,0) 70%)',
            filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.25))',
          }}
        >
          🌳
        </div>

        {/* 가운데 — 카피 */}
        <div className="min-w-0 flex-1">
          <h2
            className="text-base font-bold sm:text-lg"
            style={{
              color: '#f6efdb',
              textShadow: '0 1px 4px rgba(0,0,0,0.45)',
              fontFamily: '"Nanum Myeongjo", var(--font-geist-sans), serif',
            }}
          >
            문장이 모여 숲이 된다
          </h2>
          <p
            className="mt-0.5 line-clamp-2 text-[11px] leading-snug sm:text-[12px]"
            style={{ color: '#cfc6a8' }}
          >
            흩어둔 문장을 의미로 묶어, 그 사이로 난 길을 보여드려요
          </p>
        </div>

        {/* 우측 — 동적 카운트 + 화살표 */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums sm:text-xs"
            style={{
              backgroundColor: 'rgba(251,191,36,0.18)',
              color: '#fde7a1',
              boxShadow: 'inset 0 0 0 1px rgba(251,191,36,0.35)',
            }}
          >
            {quoteCount}개 문장
          </span>
          <span
            aria-hidden
            className="text-base transition-transform group-hover:translate-x-0.5"
            style={{ color: '#fde7a1' }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
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
