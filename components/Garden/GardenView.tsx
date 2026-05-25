'use client'

import type { ComponentType } from 'react'
import { Daenamu } from '@/components/Plant/Daenamu'
import { Euari } from '@/components/Plant/Euari'
import { Gujulcho } from '@/components/Plant/Gujulcho'
import { Halmiggot } from '@/components/Plant/Halmiggot'
import { Jindalrae } from '@/components/Plant/Jindalrae'
import { Maehwa } from '@/components/Plant/Maehwa'
import { Neutinamu } from '@/components/Plant/Neutinamu'
import { Solikki } from '@/components/Plant/Solikki'
import { Sonamu } from '@/components/Plant/Sonamu'
import { Yeonggot } from '@/components/Plant/Yeonggot'
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

const PLANT_COMPONENTS: Partial<
  Record<string, ComponentType<{ stage: PlantStage; size?: number }>>
> = {
  '0': Solikki,
  '1': Halmiggot,
  '2': Yeonggot,
  '3': Neutinamu,
  '4': Gujulcho,
  '5': Daenamu,
  '6': Jindalrae,
  '7': Euari,
  '8': Maehwa,
  '9': Sonamu,
}

interface GardenViewProps {
  plants: PlantWithBook[]
  totalSlots?: number
  onWater?: (plant: PlantWithBook) => void
}

export function GardenView({ plants, totalSlots = 12, onWater }: GardenViewProps) {
  const slots = Array.from({ length: Math.max(totalSlots, plants.length) }, (_, i) => plants[i] ?? null)

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((plant, i) =>
        plant ? (
          <PotCard key={plant.id} plant={plant} onWater={onWater} />
        ) : (
          <EmptyPot key={`empty-${i}`} />
        )
      )}
    </div>
  )
}

function PotCard({ plant, onWater }: { plant: PlantWithBook; onWater?: (p: PlantWithBook) => void }) {
  const progress = Math.min(100, plant.growth_point % 100 || (plant.stage === 'bloom' ? 100 : 0))
  const kdcKey = (plant.kdc_code ?? '').charAt(0)
  const PlantSvg = PLANT_COMPONENTS[kdcKey]

  return (
    <div className="group relative flex flex-col items-center rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-md">
      {PlantSvg ? (
        <div className="flex h-28 w-full items-end justify-center">
          <PlantSvg stage={plant.stage} size={100} />
        </div>
      ) : (
        <>
          <div className="flex h-24 w-full items-end justify-center text-5xl">
            <span aria-label={STAGE_LABEL[plant.stage]} role="img">
              {STAGE_EMOJI[plant.stage]}
            </span>
          </div>
          <div className="mt-2 h-3 w-20 rounded-b-xl bg-gradient-to-b from-amber-700 to-amber-900" />
        </>
      )}

      <div className="mt-3 w-full text-center">
        <div className="text-sm font-semibold text-stone-800">{plant.plant_name}</div>
        <div className="mt-0.5 line-clamp-1 text-xs text-stone-500">{plant.book.title}</div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">
        {STAGE_LABEL[plant.stage]} · {progress}/100
      </div>

      {onWater && (
        <button
          onClick={() => onWater(plant)}
          className="absolute right-2 top-2 rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700 opacity-0 transition group-hover:opacity-100 hover:bg-sky-200"
          aria-label="물주기"
        >
          💧
        </button>
      )}
    </div>
  )
}

function EmptyPot() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/30 p-4 text-stone-400">
      <div className="text-3xl">🪴</div>
      <div className="mt-2 text-xs">책을 심어보세요</div>
    </div>
  )
}
