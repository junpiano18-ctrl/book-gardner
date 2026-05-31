'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface ForestQuote {
  id: string
  content: string
  book_title: string | null
}

interface ForestGroup {
  label: string
  quotes: ForestQuote[]
}

type ApiResponse =
  | {
      status: 'ok'
      cached: boolean
      quote_count: number
      groups: ForestGroup[]
    }
  | {
      status: 'not_enough'
      message: string
      count: number
      min: number
    }
  | { status: 'error'; message: string }
  | { status: 'unauthorized'; message: string }

// 라벨별 안정 컬러 — Tailwind JIT 대비 리터럴 클래스
const CHIP_COLORS = [
  { chip: 'bg-emerald-100 text-emerald-900 ring-emerald-200', dot: 'bg-emerald-500' },
  { chip: 'bg-amber-100 text-amber-900 ring-amber-200', dot: 'bg-amber-500' },
  { chip: 'bg-rose-100 text-rose-900 ring-rose-200', dot: 'bg-rose-500' },
  { chip: 'bg-sky-100 text-sky-900 ring-sky-200', dot: 'bg-sky-500' },
  { chip: 'bg-violet-100 text-violet-900 ring-violet-200', dot: 'bg-violet-500' },
  { chip: 'bg-teal-100 text-teal-900 ring-teal-200', dot: 'bg-teal-500' },
  { chip: 'bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200', dot: 'bg-fuchsia-500' },
  { chip: 'bg-stone-200 text-stone-900 ring-stone-300', dot: 'bg-stone-500' },
] as const

function colorForLabel(label: string) {
  let h = 0
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) >>> 0
  }
  return CHIP_COLORS[h % CHIP_COLORS.length]
}

function sectionId(label: string) {
  return `forest-section-${encodeURIComponent(label)}`
}

export default function ForestPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  async function unfold() {
    if (!user || loading) return
    setLoading(true)
    setResult(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setResult({ status: 'unauthorized', message: '다시 로그인해주세요' })
        return
      }
      const res = await fetch('/api/sentence-forest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = (await res.json()) as ApiResponse
      setResult(data)
    } catch (e) {
      setResult({
        status: 'error',
        message: '지금은 숲을 그릴 수 없어요. 잠시 후 다시',
      })
    } finally {
      setLoading(false)
    }
  }

  function scrollToLabel(label: string) {
    const el = document.getElementById(sectionId(label))
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        <header className="mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-800">🌳 문장 숲</h1>
            <Link
              href="/quotes"
              className="ml-auto text-xs text-stone-500 hover:text-stone-700"
            >
              ← 카드함으로
            </Link>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            모아둔 문장을 의미별로 묶어 보여드려요
          </p>
        </header>

        {!result && !loading && <UnfoldCTA onClick={unfold} />}
        {loading && <LoadingState />}

        {result?.status === 'not_enough' && (
          <NotEnoughState count={result.count} min={result.min} />
        )}

        {(result?.status === 'error' ||
          result?.status === 'unauthorized') && (
          <ErrorState
            message={result.message}
            onRetry={result.status === 'error' ? unfold : undefined}
          />
        )}

        {result?.status === 'ok' && result.groups.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 py-10 text-center text-sm text-stone-500">
            🌱 의미가 묶일 만한 문장들이 아직 충분하지 않아요
          </p>
        )}

        {result?.status === 'ok' && result.groups.length > 0 && (
          <>
            <ChipBar groups={result.groups} onChipClick={scrollToLabel} />
            <p className="mb-5 text-[11px] text-stone-400">
              총 {result.quote_count}개 문장이 {result.groups.length}개의 숲으로
              {result.cached && ' (이전 분석 결과)'}
            </p>

            <div className="space-y-8">
              {result.groups.map((g) => (
                <GroupSection key={g.label} group={g} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function UnfoldCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-amber-200 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">🌲</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">
        문장 숲을 펼쳐볼까요?
      </h2>
      <p className="mt-1 max-w-xs text-sm text-stone-500">
        모아둔 한 줄 문장들을 의미·주제별로 자동으로 묶어드려요.
        <br />
        <span className="text-stone-400">
          (원문은 그대로 두고 분류만 합니다)
        </span>
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
      >
        🌿 문장 숲 펼치기
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white/40 px-6 py-16 text-center">
      <div className="animate-pulse text-5xl">🌳</div>
      <p className="mt-3 text-sm font-semibold text-stone-700">
        문장들을 살펴보는 중...
      </p>
      <p className="mt-1 text-xs text-stone-500">잠시만 기다려주세요 (10~20초)</p>
      <div className="mt-4 flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-rose-400" />
      </div>
    </div>
  )
}

function NotEnoughState({ count, min }: { count: number; min: number }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">🌱</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">
        문장이 더 모이면 숲이 자랍니다
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        지금 {count}개 · {min}개부터 분석할 수 있어요
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-rose-200 bg-rose-50/40 px-6 py-16 text-center">
      <div className="text-5xl">🍂</div>
      <p className="mt-3 text-sm text-stone-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-stone-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-900"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}

function ChipBar({
  groups,
  onChipClick,
}: {
  groups: ForestGroup[]
  onChipClick: (label: string) => void
}) {
  const listRef = useRef<HTMLUListElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      setShowLeftFade(el.scrollLeft > 2)
      setShowRightFade(max > 2 && el.scrollLeft < max - 2)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [groups.length])

  // 데스크탑 마우스 휠 → 가로 스크롤 변환 (세로 휠이 더 클 때만)
  function handleWheel(e: React.WheelEvent<HTMLUListElement>) {
    const el = e.currentTarget
    if (el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    el.scrollLeft += e.deltaY
    e.preventDefault()
  }

  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 bg-[#fdf6ee]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="relative">
        <ul
          ref={listRef}
          onWheel={handleWheel}
          // pr-8 → 마지막 칩이 살짝 잘려 보이며 "더 있다" 암시
          className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 pr-8 [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {groups.map((g) => {
            const color = colorForLabel(g.label)
            return (
              <li key={g.label} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onChipClick(g.label)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition active:scale-95 ${color.chip}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                  {g.label}
                  <span className="text-[10px] opacity-70">
                    {g.quotes.length}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* 왼쪽 페이드 — 스크롤 시작 후에만 표시 */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#fdf6ee] to-transparent transition-opacity duration-200 ${
            showLeftFade ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* 오른쪽 페이드 — 더 있을 때만 표시 */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#fdf6ee] to-transparent transition-opacity duration-200 ${
            showRightFade ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  )
}

function GroupSection({ group }: { group: ForestGroup }) {
  const color = colorForLabel(group.label)
  return (
    <section
      id={sectionId(group.label)}
      className="scroll-mt-20"
      aria-label={`${group.label} 그룹`}
    >
      <header className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color.dot}`} />
        <h2 className="text-base font-bold text-stone-800">{group.label}</h2>
        <span className="text-xs text-stone-400">
          · 문장 {group.quotes.length}개
        </span>
      </header>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {group.quotes.map((q) => (
          <ForestQuoteCard key={q.id} quote={q} />
        ))}
      </ul>
    </section>
  )
}

function ForestQuoteCard({ quote }: { quote: ForestQuote }) {
  return (
    <li
      className="rounded-2xl bg-amber-50 px-5 py-4 shadow-sm ring-1 ring-amber-200/70"
      style={{
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(218,184,134,0.12), transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,236,200,0.45), transparent 60%)',
      }}
    >
      <div className="mb-2 line-clamp-1 text-xs font-medium text-stone-600">
        📖 {quote.book_title ?? '책 정보 없음'}
      </div>
      <blockquote
        className="border-l-2 border-amber-400 pl-3 text-sm italic leading-relaxed text-stone-800"
        style={{
          fontFamily: '"Nanum Myeongjo", var(--font-geist-sans), serif',
        }}
      >
        {quote.content}
      </blockquote>
    </li>
  )
}
