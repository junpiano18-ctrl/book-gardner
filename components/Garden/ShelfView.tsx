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

// 톤다운한 책등 색상 — KDC별 매핑 (6색 팔레트 순환)
const KDC_SPINE_COLOR: Record<string, string> = {
  '0': '#6a6a8a',
  '1': '#8a6a7a',
  '2': '#5a7a6a',
  '3': '#a07850',
  '4': '#7a8a5a',
  '5': '#8a5a4a',
  '6': '#8a6a7a',
  '7': '#5a7a6a',
  '8': '#a07850',
  '9': '#7a8a5a',
}

const DEFAULT_SPINE_COLOR = '#6a6a8a'

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
  selectedId?: string | null
  onSelect?: (plant: PlantWithBook) => void
}

export function ShelfView({
  plants,
  booksPerShelf = 8,
  selectedId,
  onSelect,
}: ShelfViewProps) {
  const shelves: PlantWithBook[][] = []
  for (let i = 0; i < plants.length; i += booksPerShelf) {
    shelves.push(plants.slice(i, i + booksPerShelf))
  }
  if (shelves.length === 0) shelves.push([])

  return (
    <div className="space-y-2 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-200/60 p-4 ring-1 ring-amber-900/10 sm:p-6">
      {shelves.map((row, idx) => (
        <Shelf key={idx} books={row} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

function Shelf({
  books,
  selectedId,
  onSelect,
}: {
  books: PlantWithBook[]
  selectedId?: string | null
  onSelect?: (plant: PlantWithBook) => void
}) {
  return (
    <div className="relative">
      <div className="flex min-h-[220px] items-end justify-start gap-2 overflow-x-auto px-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [scrollbar-width:none] sm:overflow-visible">
        {books.length === 0 ? (
          <div className="flex h-44 w-full items-center justify-center text-sm text-stone-500">
            아직 심은 책이 없어요
          </div>
        ) : (
          books.map((plant) => (
            <BookSpine
              key={plant.id}
              plant={plant}
              selected={selectedId === plant.book_id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
      <div className="h-3 rounded-sm bg-gradient-to-b from-amber-900 to-amber-950 shadow-inner" />
    </div>
  )
}

function BookSpine({
  plant,
  selected,
  onSelect,
}: {
  plant: PlantWithBook
  selected: boolean
  onSelect?: (plant: PlantWithBook) => void
}) {
  const width = spineWidth(plant.book.total_pages)
  const kdcKey = (plant.book.kdc_code ?? '0').charAt(0)
  const color = KDC_SPINE_COLOR[kdcKey] ?? DEFAULT_SPINE_COLOR
  const clickable = !!onSelect

  return (
    <div
      className={`group relative flex shrink-0 flex-col items-center ${clickable ? 'cursor-pointer' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? selected : undefined}
      onClick={clickable ? () => onSelect!(plant) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect!(plant)
              }
            }
          : undefined
      }
    >
      <div
        className="-mb-1 text-2xl"
        aria-label={STAGE_LABEL[plant.stage]}
        role="img"
      >
        {STAGE_EMOJI[plant.stage]}
      </div>

      <div
        className={`relative flex h-44 cursor-pointer items-center justify-center rounded-t-sm shadow-md transition ${
          selected
            ? '-translate-y-2 ring-2 ring-amber-700 shadow-lg'
            : 'ring-1 ring-black/10 group-hover:-translate-y-1'
        }`}
        style={{ width, backgroundColor: color }}
      >
        <span
          className="select-none whitespace-nowrap font-serif text-[11px] font-medium tracking-wide text-white/95"
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
