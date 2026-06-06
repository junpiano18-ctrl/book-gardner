'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { getQuotesByBook } from '@/lib/quotes'
import {
  WATERING_POINTS,
  stageProgressPercent,
  watersToNextStage,
} from '@/lib/garden'
import type { Plant, PlantStage, PlantWithBook, Quote } from '@/types'

const STAGE_EMOJI: Record<PlantStage, string> = {
  seed: '🌰',
  sprout: '🌱',
  growing: '🌿',
  bloom: '🌸',
}

const STAGE_LABEL: Record<PlantStage, string> = {
  seed: '씨앗',
  sprout: '새싹',
  growing: '성장',
  bloom: '개화',
}

const BLOOM_MESSAGE = '🌸 개화 단계예요! 물주기를 한 번 더 하면 완독 처리됩니다'

const ENCOURAGEMENT: Record<Exclude<PlantStage, 'bloom'>, {
  far: string
  mid: string
  close: string
  last: string
}> = {
  seed: {
    far: '씨앗이 땅속에서 꿈틀대고 있어요 🌰',
    mid: '곧 첫 잎이 나올 거예요, 조금만 더!',
    close: '새싹이 거의 다 왔어요!',
    last: '내일이면 새 잎을 볼 수 있어요 🌱',
  },
  sprout: {
    far: '작은 잎들이 햇빛을 찾고 있어요',
    mid: '잎이 조금씩 넓어지고 있어요',
    close: '쑥쑥 자라날 준비가 됐어요!',
    last: '다음엔 훌쩍 커있을 거예요 🌿',
  },
  growing: {
    far: '꽃봉오리가 맺힐 날을 기다리고 있어요',
    mid: '줄기가 튼튼해지고 있어요',
    close: '꽃봉오리가 보이기 시작했어요!',
    last: '다음 물주기에 꽃이 피어요! 🌸',
  },
}

function Sparkle({
  pos,
  delay,
  size = 'text-lg',
}: {
  pos: string
  delay: number
  size?: string
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute text-amber-400 ${size} ${pos}`}
      style={{
        animation: 'sparkle-burst 900ms ease-out forwards',
        animationDelay: `${delay}ms`,
      }}
    >
      ✨
    </span>
  )
}

function getEncouragement(stage: PlantStage, growthPoint: number): string {
  if (stage === 'bloom') return BLOOM_MESSAGE
  const remaining = watersToNextStage(stage, growthPoint)
  const set = ENCOURAGEMENT[stage]
  // 단계당 3~4회 물주기 기준: 4↑ far, 3 mid, 2 close, 1 last
  if (remaining >= 4) return set.far
  if (remaining === 3) return set.mid
  if (remaining === 2) return set.close
  return set.last
}

export interface WaterModalProps {
  plant: PlantWithBook | null
  onClose: () => void
  onWater: (input: {
    plantId: string
    bookId: string
    content: string
    pageNumber?: number
  }) => Promise<{ plant: Plant; quote: Quote } | null>
}

export function WaterModal({ plant, onClose, onWater }: WaterModalProps) {
  if (!plant) return null
  return <WaterModalContent key={plant.id} plant={plant} onClose={onClose} onWater={onWater} />
}

interface ContentProps {
  plant: PlantWithBook
  onClose: () => void
  onWater: WaterModalProps['onWater']
}

function WaterModalContent({ plant, onClose, onWater }: ContentProps) {
  const [content, setContent] = useState('')
  const [pageInput, setPageInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promotion, setPromotion] = useState<PlantStage | null>(null)
  const [completed, setCompleted] = useState(false)
  const [entered, setEntered] = useState(false)

  // 애니메이션 상태
  const [animKey, setAnimKey] = useState(0)  // 같은 애니메이션 재실행을 위한 키
  const [dropping, setDropping] = useState(false)
  const [bouncing, setBouncing] = useState(false)
  const [pointFloat, setPointFloat] = useState(false)
  const [sparkling, setSparkling] = useState(false)
  const animTimers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  function scheduleAnim(fn: () => void, delay: number) {
    const id = setTimeout(fn, delay)
    animTimers.current.push(id)
  }

  useEffect(() => {
    return () => {
      animTimers.current.forEach(clearTimeout)
      animTimers.current = []
    }
  }, [])

  const isDogamMode = !!plant.completed_at
  const [quoteCount, setQuoteCount] = useState<number | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (!isDogamMode) return
    let mounted = true
    getQuotesByBook(plant.book_id)
      .then((qs) => {
        if (mounted) setQuoteCount(qs.length)
      })
      .catch(() => {
        if (mounted) setQuoteCount(0)
      })
    return () => {
      mounted = false
    }
  }, [isDogamMode, plant.book_id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submitting, onClose])

  const progress = stageProgressPercent(plant.stage, plant.growth_point)
  const encouragement = getEncouragement(plant.stage, plant.growth_point)
  const remaining = watersToNextStage(plant.stage, plant.growth_point)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      setError('한 줄 문장을 적어주세요')
      return
    }
    const parsedPage = pageInput ? Number(pageInput) : undefined
    if (parsedPage !== undefined && (!Number.isFinite(parsedPage) || parsedPage < 1)) {
      setError('페이지 번호가 올바르지 않아요')
      return
    }

    setSubmitting(true)
    setError(null)

    // 0ms: 물방울 낙하 시작 (서버 호출과 병렬, 최소 550ms 보장)
    setAnimKey((k) => k + 1)
    setDropping(true)

    let result: Awaited<ReturnType<typeof onWater>> | null = null
    try {
      const [r] = await Promise.all([
        onWater({
          plantId: plant.id,
          bookId: plant.book_id,
          content: trimmed,
          pageNumber: parsedPage,
        }),
        new Promise((resolve) => setTimeout(resolve, 550)),
      ])
      result = r
    } catch (e) {
      setDropping(false)
      setError((e as Error).message ?? '물주기에 실패했어요')
      setSubmitting(false)
      return
    }

    if (!result) {
      setDropping(false)
      setError('물주기에 실패했어요')
      setSubmitting(false)
      return
    }

    const newPlant = result.plant
    const justCompleted = !plant.completed_at && !!newPlant.completed_at
    const stageChanged = !isDogamMode && newPlant.stage !== plant.stage

    // 물방울 착지 → 식물 통통 + 게이지 차오름 + +10pt 떠오름
    setDropping(false)
    setBouncing(true)
    setPointFloat(true)

    // 600ms: 통통 종료
    scheduleAnim(() => setBouncing(false), 600)
    // 900ms: +10pt 소멸
    scheduleAnim(() => setPointFloat(false), 900)

    if (isDogamMode) {
      setQuoteCount((c) => (c == null ? 1 : c + 1))
      setContent('')
      setPageInput('')
      // 도감 모드는 모달 유지. submitting 해제만.
      scheduleAnim(() => setSubmitting(false), 700)
      return
    }

    // 단계 상승 또는 완독: 스파클 폭발 후 축하 화면
    if (stageChanged || justCompleted) {
      scheduleAnim(() => setSparkling(true), 300)
      scheduleAnim(() => {
        setSparkling(false)
        if (justCompleted) {
          setCompleted(true)
        } else {
          setPromotion(newPlant.stage)
          scheduleAnim(onClose, 1800)
        }
        setSubmitting(false)
      }, 1000)
      return
    }

    // 일반 물주기: 애니메이션 후 닫기
    scheduleAnim(() => {
      onClose()
      setSubmitting(false)
    }, 1100)
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => {
          if (!submitting) onClose()
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${plant.plant_name} 물주기`}
        className={`absolute bottom-0 left-1/2 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          entered ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ backgroundColor: '#fdf6ee' }}
      >
        <div className="px-6 pb-7 pt-3">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-stone-300" />

          <div className="mb-5 flex flex-col items-center text-center">
            <div className="relative h-24 w-24">
              {/* 물방울 낙하 */}
              {dropping && (
                <span
                  key={`drop-${animKey}`}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 text-3xl"
                  style={{ animation: 'water-drop 700ms ease-in forwards' }}
                >
                  💧
                </span>
              )}

              {/* +10pt 떠오름 */}
              {pointFloat && (
                <span
                  key={`pt-${animKey}`}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 -top-1 text-sm font-bold text-emerald-600"
                  style={{ animation: 'float-up 900ms ease-out forwards' }}
                >
                  +{WATERING_POINTS}pt
                </span>
              )}

              {/* 식물 본체 + 통통 튐 */}
              <div
                key={`plant-${animKey}-${bouncing ? 1 : 0}`}
                className="flex h-full w-full items-center justify-center text-7xl leading-none"
                style={
                  bouncing
                    ? { animation: 'plant-bounce 600ms cubic-bezier(.34,1.56,.64,1)' }
                    : undefined
                }
                aria-hidden
              >
                {STAGE_EMOJI[plant.stage]}
              </div>

              {/* 물방울이 닿을 때의 잔물결 */}
              {bouncing && (
                <span
                  key={`ripple-${animKey}`}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[80%] h-6 w-12 rounded-full border-2 border-sky-300/60"
                  style={{ animation: 'ripple-ring 700ms ease-out forwards' }}
                />
              )}

              {/* 단계 상승 / 완독 시 스파클 폭발 */}
              {sparkling && (
                <>
                  <Sparkle pos="-top-2 left-2" delay={0} />
                  <Sparkle pos="-top-1 right-2" delay={90} />
                  <Sparkle pos="top-6 -left-3" delay={150} />
                  <Sparkle pos="top-6 -right-3" delay={210} />
                  <Sparkle pos="bottom-1 left-1/2 -translate-x-1/2" delay={300} />
                </>
              )}
            </div>

            <div className="mt-3 text-xl font-bold text-stone-800">
              {plant.plant_name}
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-stone-500">
              📖 {plant.book.title}
            </div>
          </div>

          {isDogamMode ? (
            <div className="mb-5 rounded-2xl bg-amber-50/70 px-4 py-3 ring-1 ring-amber-200">
              <p className="text-sm font-medium text-amber-900">
                📖 완독한 책의 도감에 한 줄 더하기
              </p>
              <p className="mt-1 text-[11px] text-amber-700/80">
                {quoteCount == null
                  ? '이 책에 남긴 문장을 세고 있어요...'
                  : `이 책에 남긴 ${quoteCount + 1}번째 기록이에요`}
              </p>
              <Link
                href={`/books/${plant.book_id}`}
                onClick={onClose}
                className="mt-2 inline-block text-[11px] font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
              >
                이 책의 모든 문장 보기 →
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-700">
                    {STAGE_LABEL[plant.stage]}
                  </span>
                  <span className="text-stone-500">
                    {progress} / 100 · 총 {plant.growth_point}pt
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-[width] duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mb-5 rounded-2xl bg-emerald-50/70 px-4 py-3 ring-1 ring-emerald-100">
                <p className="text-sm font-medium text-emerald-900">
                  {encouragement}
                </p>
                {plant.stage !== 'bloom' && (
                  <p className="mt-1 text-[11px] text-emerald-700/80">
                    다음 단계까지 💧 {remaining}회 남았어요
                  </p>
                )}
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="water-content" className="mb-1 block text-xs font-medium text-stone-600">
                오늘의 한 줄 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="water-content"
                required
                autoFocus
                rows={3}
                maxLength={280}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  isDogamMode
                    ? '다시 읽으며 만난 한 문장을 적어주세요'
                    : '오늘 마음에 남은 한 문장을 적어주세요'
                }
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <div className="mt-1 text-right text-[11px] text-stone-400">
                {content.length}/280
              </div>
            </div>

            <div>
              <label htmlFor="water-page" className="mb-1 block text-xs font-medium text-stone-600">
                문장이 적힌 페이지{' '}
                <span className="text-stone-400">(선택)</span>
              </label>
              <input
                id="water-page"
                type="number"
                min={1}
                inputMode="numeric"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder="예: 128"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-full border border-stone-300 bg-white/70 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className={`flex-[1.4] rounded-full px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                  isDogamMode
                    ? 'bg-gradient-to-br from-amber-500 to-rose-500'
                    : 'bg-gradient-to-br from-sky-500 to-emerald-500'
                }`}
              >
                {submitting
                  ? '기록 중...'
                  : isDogamMode
                    ? '✍️ 문장 더 남기기'
                    : '🌱 문장 적고 물주기'}
              </button>
            </div>
          </form>
        </div>

        {promotion && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdf6ee]/95 px-6 text-center backdrop-blur animate-in fade-in">
            <div className="relative">
              <div className="text-8xl">{STAGE_EMOJI[promotion]}</div>
              <Sparkle pos="-top-2 -left-4" delay={0} size="text-2xl" />
              <Sparkle pos="-top-4 right-0" delay={120} size="text-2xl" />
              <Sparkle pos="top-1/2 -left-8" delay={240} size="text-xl" />
              <Sparkle pos="top-1/2 -right-8" delay={360} size="text-xl" />
              <Sparkle pos="-bottom-2 left-1/2 -translate-x-1/2" delay={480} size="text-2xl" />
            </div>
            <div className="mt-4 text-2xl font-bold text-stone-800">
              축하해요! {STAGE_LABEL[promotion]} 단계예요
            </div>
            <p className="mt-2 text-sm text-stone-600">
              {plant.plant_name}이(가) 한 뼘 더 자랐어요 🌟
            </p>
          </div>
        )}

        {completed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdf6ee]/95 px-6 text-center backdrop-blur animate-in fade-in">
            <div className="relative">
              <div className="text-8xl">📖</div>
              <Sparkle pos="-top-2 -left-4" delay={0} size="text-2xl" />
              <Sparkle pos="-top-4 right-0" delay={120} size="text-2xl" />
              <Sparkle pos="top-1/2 -left-8" delay={240} size="text-xl" />
              <Sparkle pos="top-1/2 -right-8" delay={360} size="text-xl" />
              <Sparkle pos="-bottom-2 left-1/2 -translate-x-1/2" delay={480} size="text-2xl" />
            </div>
            <div className="mt-4 text-2xl font-bold text-stone-800">
              완독 축하해요!
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-stone-600">
              『{plant.book.title}』을(를) 도감에 기록했어요
            </p>
            <p className="mt-1 text-xs text-stone-500">
              🌸 {plant.plant_name}이(가) 활짝 폈어요
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-300 bg-white/70 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                닫기
              </button>
              <Link
                href="/library"
                className="rounded-full bg-gradient-to-br from-amber-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                📖 도감 보러 가기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
