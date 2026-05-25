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
import type { PlantStage } from '@/types'

interface PlantDef {
  name: string
  kdc: string
  Component: ComponentType<{ stage: PlantStage; size?: number }>
}

const PLANTS: PlantDef[] = [
  { name: '솔이끼', kdc: '0', Component: Solikki },
  { name: '할미꽃', kdc: '1', Component: Halmiggot },
  { name: '연꽃', kdc: '2', Component: Yeonggot },
  { name: '느티나무', kdc: '3', Component: Neutinamu },
  { name: '구절초', kdc: '4', Component: Gujulcho },
  { name: '대나무', kdc: '5', Component: Daenamu },
  { name: '진달래', kdc: '6', Component: Jindalrae },
  { name: '으아리', kdc: '7', Component: Euari },
  { name: '매화', kdc: '8', Component: Maehwa },
  { name: '소나무', kdc: '9', Component: Sonamu },
]

const STAGES: { stage: PlantStage; label: string }[] = [
  { stage: 'seed', label: 'seed' },
  { stage: 'sprout', label: 'sprout' },
  { stage: 'growing', label: 'growing' },
  { stage: 'bloom', label: 'bloom' },
]

export default function PlantTestPage() {
  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800">🌱 KDC 식물 도감</h1>
          <p className="mt-1 text-sm text-stone-500">
            10종 × 4단계 미리보기 (seed / sprout / growing / bloom)
          </p>
        </div>

        <div className="space-y-8">
          {PLANTS.map(({ name, kdc, Component }) => (
            <section
              key={kdc}
              className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-amber-900/5"
            >
              <header className="mb-3 flex items-baseline gap-2">
                <h2 className="text-base font-bold text-stone-800">{name}</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">
                  KDC {kdc}
                </span>
              </header>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STAGES.map(({ stage, label }) => (
                  <div
                    key={stage}
                    className="flex flex-col items-center rounded-xl bg-stone-50/80 px-3 py-4"
                  >
                    <Component stage={stage} size={120} />
                    <div className="mt-2 text-xs font-medium text-stone-600">{label}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
