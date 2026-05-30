'use client'

import { getKdcColor } from '@/lib/kdc-colors'
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

const MIN_SPINE_W = 22
const MAX_SPINE_W = 68
const REFERENCE_PAGES = 500

const MIN_SPINE_H = 95
const MAX_SPINE_H = 130
const PER_CHAR_H = 13 // upright 세로쓰기에서 글자 한 칸의 세로 높이 추정 (font-size 11 + leading)
const SPINE_TEXT_PAD = 12 // 상하 양각/음각 띠 회피용 패딩

function spineWidth(totalPages: number | undefined): number {
  if (!totalPages || totalPages <= 0) return MIN_SPINE_W + 8
  const ratio = Math.min(1, totalPages / REFERENCE_PAGES)
  return Math.round(MIN_SPINE_W + (MAX_SPINE_W - MIN_SPINE_W) * ratio)
}

function visibleLen(s: string): number {
  // 코드 포인트 단위로 세서 emoji/한자 등 surrogate pair 안전
  return [...s.trim()].length
}

// 제목 글자 수에 비례한 책등 높이 (95~130px)
//  - 4자 이하: 최소 95px
//  - 그 이상: 글자당 +13px, 최대 130px 까지
function spineHeight(title: string): number {
  const len = visibleLen(title)
  return Math.min(MAX_SPINE_H, MIN_SPINE_H + Math.max(0, len - 4) * PER_CHAR_H)
}

// 책등 높이에 맞춰 표시 가능한 글자 수로 자르고 필요 시 ellipsis
function truncateTitleForSpine(title: string, height: number): string {
  const trimmed = title.trim()
  const chars = [...trimmed]
  const maxChars = Math.max(3, Math.floor((height - SPINE_TEXT_PAD) / PER_CHAR_H))
  if (chars.length <= maxChars) return trimmed
  return chars.slice(0, Math.max(1, maxChars - 1)).join('') + '…'
}

interface ShelfViewProps {
  plants: PlantWithBook[]
  booksPerShelf?: number
  selectedId?: string | null
  onSelect?: (plant: PlantWithBook) => void
}

// 책을 균등하게 여러 책장에 분배 — 마지막 줄에 책이 적게 남지 않도록
function distributeShelves<T>(items: T[], maxPerShelf: number): T[][] {
  if (items.length === 0) return [[]]
  const shelfCount = Math.ceil(items.length / maxPerShelf)
  const perShelf = Math.ceil(items.length / shelfCount)
  const shelves: T[][] = []
  for (let i = 0; i < items.length; i += perShelf) {
    shelves.push(items.slice(i, i + perShelf))
  }
  return shelves
}

export function ShelfView({
  plants,
  booksPerShelf = 14,
  selectedId,
  onSelect,
}: ShelfViewProps) {
  const shelves = distributeShelves(plants, booksPerShelf)

  return (
    <div
      className="space-y-2 rounded-2xl p-4 ring-1 ring-amber-900/15 shadow-[0_8px_24px_-8px_rgba(80,50,20,0.35)] sm:p-6"
      style={{ background: 'linear-gradient(to bottom, #c8a06a 0%, #a87850 100%)' }}
    >
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
      <div className="flex min-h-[160px] items-end justify-start gap-1 overflow-x-auto px-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [scrollbar-width:none] sm:justify-between sm:overflow-visible">
        {books.length === 0 ? (
          <div className="flex h-32 w-full items-center justify-center text-sm text-stone-700/70">
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
      <div
        className="h-4 rounded-sm shadow-[inset_0_2px_3px_rgba(0,0,0,0.35),inset_0_-1px_0_rgba(255,255,255,0.08)]"
        style={{ background: 'linear-gradient(to bottom, #5a3a1a 0%, #3e2818 100%)' }}
      />
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
  const height = spineHeight(plant.book.title)
  const displayTitle = truncateTitleForSpine(plant.book.title, height)
  const color = getKdcColor(plant.book.kdc_code)
  const clickable = !!onSelect

  // 책등 입체감: 좌측 하이라이트 + 우측 그림자 + 드롭 섀도우 + 외곽 ring
  // (Tailwind v4 의 ring 도 box-shadow 라 inline 으로 함께 조합)
  const ring = selected
    ? '0 0 0 2px #b45309' // amber-700
    : '0 0 0 1px rgba(0,0,0,0.12)'
  const drop = selected
    ? '0 6px 12px rgba(0,0,0,0.32)'
    : '0 3px 6px rgba(0,0,0,0.28)'
  const spineShadow = [
    ring,
    'inset 1.5px 0 0 rgba(255,255,255,0.28)',
    'inset -1.5px 0 0 rgba(0,0,0,0.35)',
    drop,
  ].join(', ')

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
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-t-sm transition ${
          selected ? '-translate-y-2' : 'group-hover:-translate-y-1'
        }`}
        style={{
          width,
          height,
          backgroundColor: color,
          boxShadow: spineShadow,
        }}
      >
        {/* 상단 양각 띠 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[6px] h-px bg-white/45"
        />
        {/* 하단 음각 띠 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[6px] h-px bg-black/45"
        />
        <span
          className="select-none whitespace-nowrap font-serif text-[11px] font-medium leading-[13px] text-white/95"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          {displayTitle}
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
