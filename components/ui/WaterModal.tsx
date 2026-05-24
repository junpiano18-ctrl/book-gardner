'use client'

import { useEffect, useState, type FormEvent } from 'react'
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
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submitting, onClose])

  const progress = plant.growth_point % 100

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
    try {
      const result = await onWater({
        plantId: plant.id,
        bookId: plant.book_id,
        content: trimmed,
        pageNumber: parsedPage,
      })

      if (!result) {
        setError('물주기에 실패했어요')
        return
      }

      if (result.plant.stage !== plant.stage) {
        setPromotion(result.plant.stage)
        setTimeout(onClose, 1800)
      } else {
        onClose()
      }
    } catch (e) {
      setError((e as Error).message ?? '물주기에 실패했어요')
    } finally {
      setSubmitting(false)
    }
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
            <div className="text-7xl leading-none" aria-hidden>
              {STAGE_EMOJI[plant.stage]}
            </div>
            <div className="mt-3 text-xl font-bold text-stone-800">
              {plant.plant_name}
            </div>
            <div className="mt-1 line-clamp-1 text-sm text-stone-500">
              📖 {plant.book.title}
            </div>
          </div>

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
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-stone-500">
              💧 한 번 물을 주면 +10pt, 100pt마다 한 단계 자라요
            </p>
          </div>

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
                placeholder="오늘 마음에 남은 한 문장을 적어주세요"
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <div className="mt-1 text-right text-[11px] text-stone-400">
                {content.length}/280
              </div>
            </div>

            <div>
              <label htmlFor="water-page" className="mb-1 block text-xs font-medium text-stone-600">
                오늘 읽은 마지막 페이지{' '}
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
                className="flex-[1.4] rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? '주는 중...' : '💧 물주기'}
              </button>
            </div>
          </form>
        </div>

        {promotion && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdf6ee]/95 px-6 text-center backdrop-blur animate-in fade-in">
            <div className="text-8xl">{STAGE_EMOJI[promotion]}</div>
            <div className="mt-4 text-2xl font-bold text-stone-800">
              축하해요! {STAGE_LABEL[promotion]} 단계예요
            </div>
            <p className="mt-2 text-sm text-stone-600">
              {plant.plant_name}이(가) 한 뼘 더 자랐어요 🌟
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
