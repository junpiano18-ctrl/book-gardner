'use client'

import { useState } from 'react'
import { GardenView } from '@/components/Garden/GardenView'
import { ShelfView } from '@/components/Garden/ShelfView'
import { Header } from '@/components/ui/Header'
import { useGarden } from '@/hooks/useGarden'
import type { PlantWithBook } from '@/types'

type ViewMode = 'garden' | 'shelf'

const MOCK_PLANTS: PlantWithBook[] = [
  {
    id: 'p1',
    book_id: 'b1',
    user_id: 'u',
    kdc_code: '813',
    plant_name: '매화',
    sci_name: 'Prunus mume',
    family_name: '장미과',
    stage: 'bloom',
    growth_point: 120,
    last_watered_at: '2026-05-22T09:00:00Z',
    completed_at: undefined,
    created_at: '2026-04-01T09:00:00Z',
    book: {
      id: 'b1',
      user_id: 'u',
      title: '소년이 온다',
      author: '한강',
      publisher: '창비',
      kdc_code: '813',
      status: 'reading',
      total_pages: 220,
      created_at: '2026-04-01T09:00:00Z',
      updated_at: '2026-05-22T09:00:00Z',
    },
  },
  {
    id: 'p2',
    book_id: 'b2',
    user_id: 'u',
    kdc_code: '491',
    plant_name: '구절초',
    sci_name: 'Dendranthema zawadskii',
    family_name: '국화과',
    stage: 'growing',
    growth_point: 80,
    last_watered_at: '2026-05-20T08:00:00Z',
    created_at: '2026-04-10T09:00:00Z',
    book: {
      id: 'b2',
      user_id: 'u',
      title: '우리 몸은 작은 우주다',
      author: '이왕재',
      publisher: '청림',
      kdc_code: '491',
      status: 'reading',
      total_pages: 360,
      created_at: '2026-04-10T09:00:00Z',
      updated_at: '2026-05-20T09:00:00Z',
    },
  },
  {
    id: 'p3',
    book_id: 'b3',
    user_id: 'u',
    kdc_code: '199',
    plant_name: '할미꽃',
    sci_name: 'Pulsatilla koreana',
    family_name: '미나리아재비과',
    stage: 'sprout',
    growth_point: 40,
    last_watered_at: '2026-05-19T08:00:00Z',
    created_at: '2026-05-01T09:00:00Z',
    book: {
      id: 'b3',
      user_id: 'u',
      title: '소크라테스 익스프레스',
      author: '에릭 와이너',
      publisher: '어크로스',
      kdc_code: '199',
      status: 'reading',
      total_pages: 480,
      created_at: '2026-05-01T09:00:00Z',
      updated_at: '2026-05-19T09:00:00Z',
    },
  },
  {
    id: 'p4',
    book_id: 'b4',
    user_id: 'u',
    kdc_code: '004',
    plant_name: '솔이끼',
    sci_name: 'Polytrichum commune',
    family_name: '솔이끼과',
    stage: 'seed',
    growth_point: 0,
    created_at: '2026-05-20T09:00:00Z',
    book: {
      id: 'b4',
      user_id: 'u',
      title: '컴퓨터 과학이 여는 세계',
      author: '이광근',
      publisher: '인사이트',
      kdc_code: '004',
      status: 'reading',
      total_pages: 280,
      created_at: '2026-05-20T09:00:00Z',
      updated_at: '2026-05-20T09:00:00Z',
    },
  },
  {
    id: 'p5',
    book_id: 'b5',
    user_id: 'u',
    kdc_code: '658',
    plant_name: '대나무',
    sci_name: 'Phyllostachys bambusoides',
    family_name: '벼과',
    stage: 'growing',
    growth_point: 60,
    created_at: '2026-05-05T09:00:00Z',
    book: {
      id: 'b5',
      user_id: 'u',
      title: '하이 아웃풋 매니지먼트',
      author: '앤드루 그로브',
      publisher: '청림',
      kdc_code: '658',
      status: 'reading',
      total_pages: 320,
      created_at: '2026-05-05T09:00:00Z',
      updated_at: '2026-05-21T09:00:00Z',
    },
  },
  {
    id: 'p6',
    book_id: 'b6',
    user_id: 'u',
    kdc_code: '911',
    plant_name: '소나무',
    sci_name: 'Pinus densiflora',
    family_name: '소나무과',
    stage: 'sprout',
    growth_point: 20,
    created_at: '2026-05-15T09:00:00Z',
    book: {
      id: 'b6',
      user_id: 'u',
      title: '하얼빈',
      author: '김훈',
      publisher: '문학동네',
      kdc_code: '911',
      status: 'reading',
      total_pages: 304,
      created_at: '2026-05-15T09:00:00Z',
      updated_at: '2026-05-15T09:00:00Z',
    },
  },
]

export default function HomePage() {
  const [view, setView] = useState<ViewMode>('garden')

  useGarden(undefined)
  const plants = MOCK_PLANTS

  const totalPoints = plants.reduce((sum, p) => sum + p.growth_point, 0)
  const bloomCount = plants.filter((p) => p.stage === 'bloom').length

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="garden" actions={<ViewToggle view={view} onChange={setView} />} />

      <main className="mx-auto flex w-full max-w-7xl gap-8 px-6 py-8">
        <section className="flex-1 min-w-0">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">
                {view === 'garden' ? '🪴 내 정원' : '📚 나의 책장'}
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                {view === 'garden'
                  ? '읽는 만큼 자라는 식물을 가꿔보세요'
                  : '책등의 두께와 색이 책을 말해줍니다'}
              </p>
            </div>
          </div>

          {view === 'garden' ? (
            <GardenView plants={plants} />
          ) : (
            <ShelfView plants={plants} />
          )}
        </section>

        <Sidebar
          weeklyWaterings={4}
          totalPoints={totalPoints}
          bloomCount={bloomCount}
          plants={plants}
        />
      </main>
    </div>
  )
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-full bg-stone-200/70 p-1 text-sm">
      <button
        onClick={() => onChange('garden')}
        className={`rounded-full px-3 py-1.5 transition ${
          view === 'garden' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-800'
        }`}
      >
        🪴 정원
      </button>
      <button
        onClick={() => onChange('shelf')}
        className={`rounded-full px-3 py-1.5 transition ${
          view === 'shelf' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-800'
        }`}
      >
        📚 책장
      </button>
    </div>
  )
}

function Sidebar({
  weeklyWaterings,
  totalPoints,
  bloomCount,
  plants,
}: {
  weeklyWaterings: number
  totalPoints: number
  bloomCount: number
  plants: PlantWithBook[]
}) {
  const recent = [...plants]
    .filter((p) => p.last_watered_at)
    .sort((a, b) => (b.last_watered_at ?? '').localeCompare(a.last_watered_at ?? ''))
    .slice(0, 3)

  return (
    <aside className="hidden w-72 shrink-0 space-y-5 lg:block">
      <Card title="이번주 통계">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="물주기" value={`${weeklyWaterings}회`} />
          <Stat label="총 포인트" value={`${totalPoints}`} />
          <Stat label="개화" value={`${bloomCount}`} />
        </div>
      </Card>

      <Card title="최근 활동">
        {recent.length === 0 ? (
          <p className="text-xs text-stone-500">아직 활동이 없어요</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span>💧</span>
                <span className="flex-1 truncate text-stone-700">{p.book.title}</span>
                <span className="text-[11px] text-stone-400">+10pt</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <button className="w-full rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 px-4 py-4 text-base font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.99]">
        💧 오늘의 물주기
      </button>
    </aside>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-amber-900/5">
      <h3 className="mb-3 text-sm font-semibold text-stone-700">{title}</h3>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-stone-100 px-2 py-2">
      <div className="text-base font-bold text-stone-800">{value}</div>
      <div className="mt-0.5 text-[11px] text-stone-500">{label}</div>
    </div>
  )
}
