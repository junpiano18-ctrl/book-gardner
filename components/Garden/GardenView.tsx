'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  PlantIllustration,
  hasPlantIllustration,
} from '@/components/Plant/PlantIllustration'
import { TOTAL_WATERS_TO_BLOOM, WATERING_POINTS } from '@/lib/garden'
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

interface GardenViewProps {
  plants: PlantWithBook[]
  totalSlots?: number
  onWater?: (plant: PlantWithBook) => void
  onSelect?: (plant: PlantWithBook) => void
}

export function GardenView({
  plants,
  totalSlots = 12,
  onWater,
  onSelect,
}: GardenViewProps) {
  const slots = Array.from({ length: Math.max(totalSlots, plants.length) }, (_, i) => plants[i] ?? null)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {slots.map((plant, i) =>
        plant ? (
          <PotCard key={plant.id} plant={plant} onWater={onWater} onSelect={onSelect} />
        ) : (
          <EmptyPot key={`empty-${i}`} />
        )
      )}
    </div>
  )
}

function PotCard({
  plant,
  onWater,
  onSelect,
}: {
  plant: PlantWithBook
  onWater?: (p: PlantWithBook) => void
  onSelect?: (p: PlantWithBook) => void
}) {
  const hasSvg = hasPlantIllustration(plant.kdc_code)
  const clickable = !!onSelect
  const cover = plant.book.cover_url
  const isCompleted = !!plant.completed_at
  const waters = Math.min(
    TOTAL_WATERS_TO_BLOOM,
    isCompleted
      ? TOTAL_WATERS_TO_BLOOM
      : Math.floor(plant.growth_point / WATERING_POINTS)
  )
  const progressPct = Math.min(100, plant.growth_point)

  return (
    <div
      className={`group relative flex h-[200px] flex-col overflow-hidden rounded-2xl bg-white/70 shadow-sm ring-1 ring-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-md ${
        clickable ? 'cursor-pointer' : ''
      }`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
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
      {/* 배경: 흐릿한 책 표지 */}
      {cover && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${cover})`,
            filter: 'blur(1px)',
            opacity: 0.4,
          }}
        />
      )}

      {/* 오버레이: 상단·하단만 톤 다운, 중간은 표지가 비치게 */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(253,246,238,0.5) 0%, rgba(253,246,238,0.1) 28%, rgba(253,246,238,0.15) 55%, rgba(253,246,238,0.82) 100%)',
        }}
      />

      {/* 상단: 식물명 + 진행 게이지 */}
      <div className="relative z-10 px-3 pt-2.5">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="line-clamp-1 font-medium text-stone-700">
            {plant.plant_name}
          </span>
          <span className="shrink-0 tabular-nums text-stone-500">
            {waters}/{TOTAL_WATERS_TO_BLOOM}
          </span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stone-200/70">
          <div
            className="h-full rounded-full bg-emerald-500/80 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* 식물 일러스트 (중앙) */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        {hasSvg ? (
          <PlantIllustration kdcCode={plant.kdc_code} stage={plant.stage} size={80} />
        ) : (
          <span
            className="text-5xl"
            aria-label={STAGE_LABEL[plant.stage]}
            role="img"
          >
            {STAGE_EMOJI[plant.stage]}
          </span>
        )}
      </div>

      {/* 하단: 미니 표지 + 제목 + 저자 */}
      <div className="relative z-10 flex items-center gap-2.5 px-3 pb-3 pt-1">
        <div className="h-[50px] w-9 shrink-0 overflow-hidden rounded-sm bg-stone-100 ring-1 ring-stone-300/70">
          {cover ? (
            <Image
              src={cover}
              alt={plant.book.title}
              width={36}
              height={50}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
              📕
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-xs font-medium text-stone-800">
            {plant.book.title}
          </div>
          <div className="mt-0.5 line-clamp-1 text-[10px] text-stone-500">
            {plant.book.author || '저자 미상'}
          </div>
        </div>
      </div>

      {onWater && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onWater(plant)
          }}
          className="absolute right-2 top-2 z-20 rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700 opacity-0 transition group-hover:opacity-100 hover:bg-sky-200"
          aria-label="물주기"
        >
          💧
        </button>
      )}
    </div>
  )
}

function EmptyPot() {
  const router = useRouter()

  function goToSearch() {
    router.push('/search')
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="책 검색으로 가서 새 책 심기"
      onClick={goToSearch}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToSearch()
        }
      }}
      className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/30 p-4 text-stone-400 transition hover:border-emerald-400 hover:bg-emerald-50/40 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
    >
      <div className="text-3xl transition group-hover:scale-110">🪴</div>
      <div className="mt-2 text-xs">책을 심어보세요</div>
    </div>
  )
}
