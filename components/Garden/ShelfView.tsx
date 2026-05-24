'use client'

import type { PlantStage, PlantWithBook } from '@/types'

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

const KDC_SPINE_COLOR: Record<string, string> = {
  '0': 'bg-slate-500',
  '1': 'bg-violet-600',
  '2': 'bg-amber-500',
  '3': 'bg-sky-600',
  '4': 'bg-emerald-600',
  '5': 'bg-red-600',
  '6': 'bg-pink-500',
  '7': 'bg-orange-500',
  '8': 'bg-rose-700',
  '9': 'bg-stone-600',
}

const MIN_SPINE_W = 28
const MAX_SPINE_W = 64
const REFERENCE_PAGES = 600

function spineWidth(totalPages: number | undefined): number {
  if (!totalPages || totalPages <= 0) return MIN_SPINE_W + 8
  const ratio = Math.min(1, totalPages / REFERENCE_PAGES)
  return Math.round(MIN_SPINE_W + (MAX_SPINE_W - MIN_SPINE_W) * ratio)
}

interface ShelfViewProps {
  plants: PlantWithBook[]
  booksPerShelf?: number
}

export function ShelfView({ plants, booksPerShelf = 8 }: ShelfViewProps) {
  const shelves: PlantWithBook[][] = []
  for (let i = 0; i < plants.length; i += booksPerShelf) {
    shelves.push(plants.slice(i, i + booksPerShelf))
  }
  if (shelves.length === 0) shelves.push([])

  return (
    <div className="space-y-2 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-200/60 p-6 ring-1 ring-amber-900/10">
      {shelves.map((row, idx) => (
        <Shelf key={idx} books={row} />
      ))}
    </div>
  )
}

function Shelf({ books }: { books: PlantWithBook[] }) {
  return (
    <div className="relative">
      <div className="flex min-h-[220px] items-end justify-start gap-2 px-3">
        {books.length === 0 ? (
          <div className="flex h-44 w-full items-center justify-center text-sm text-stone-500">
            아직 심은 책이 없어요
          </div>
        ) : (
          books.map((plant) => <BookSpine key={plant.id} plant={plant} />)
        )}
      </div>
      <div className="h-3 rounded-sm bg-gradient-to-b from-amber-900 to-amber-950 shadow-inner" />
    </div>
  )
}

function BookSpine({ plant }: { plant: PlantWithBook }) {
  const width = spineWidth(plant.book.total_pages)
  const kdcKey = (plant.book.kdc_code ?? '0').charAt(0)
  const color = KDC_SPINE_COLOR[kdcKey] ?? 'bg-stone-500'

  return (
    <div className="group relative flex flex-col items-center">
      <div
        className="-mb-1 text-2xl"
        aria-label={STAGE_LABEL[plant.stage]}
        role="img"
      >
        {STAGE_EMOJI[plant.stage]}
      </div>

      <div
        className={`relative flex h-44 cursor-pointer items-center justify-center rounded-t-sm shadow-md ring-1 ring-black/10 transition group-hover:-translate-y-1 ${color}`}
        style={{ width }}
      >
        <span
          className="select-none whitespace-nowrap text-[11px] font-medium tracking-wide text-white/95"
          style={{ writingMode: 'vertical-rl' }}
        >
          {plant.book.title}
        </span>
      </div>

      <div className="pointer-events-none absolute -top-2 left-1/2 z-10 w-44 -translate-x-1/2 -translate-y-full rounded-md bg-stone-900/95 px-3 py-2 text-left text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        <div className="font-semibold">{plant.book.title}</div>
        {plant.book.author && <div className="mt-0.5 text-stone-300">{plant.book.author}</div>}
        <div className="mt-1 text-emerald-300">
          {STAGE_EMOJI[plant.stage]} {STAGE_LABEL[plant.stage]} · {plant.growth_point}pt
        </div>
      </div>
    </div>
  )
}
