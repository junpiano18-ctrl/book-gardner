'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GardenView } from '@/components/Garden/GardenView'
import { ShelfView } from '@/components/Garden/ShelfView'
import { Header } from '@/components/ui/Header'
import { WaterModal } from '@/components/ui/WaterModal'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'
import type { PlantWithBook } from '@/types'

type ViewMode = 'garden' | 'shelf'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default function GardenPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    plants,
    loading: plantsLoading,
    error: plantsError,
    waterPlant,
  } = useGarden(user?.id)
  const { books, loading: booksLoading, error: booksError } = useBook(user?.id)

  const [view, setView] = useState<ViewMode>('garden')
  const [selectedPlant, setSelectedPlant] = useState<PlantWithBook | null>(null)
  const [weekAgo] = useState(() => Date.now() - WEEK_MS)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  const plantsWithBooks = useMemo<PlantWithBook[]>(() => {
    if (plants.length === 0) return []
    const booksById = new Map(books.map((b) => [b.id, b]))
    return plants
      .map((p) => {
        const book = booksById.get(p.book_id)
        return book ? { ...p, book } : null
      })
      .filter((p): p is PlantWithBook => p !== null)
  }, [plants, books])

  // 모달에 표시 중인 식물도 hook의 최신 상태로 동기화 (물주기 직후 진행률 반영)
  const selectedPlantFresh = useMemo(() => {
    if (!selectedPlant) return null
    return plantsWithBooks.find((p) => p.id === selectedPlant.id) ?? selectedPlant
  }, [selectedPlant, plantsWithBooks])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header activeKey="garden" />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
          불러오는 중...
        </main>
      </div>
    )
  }

  const dataLoading = plantsLoading || booksLoading
  const dataError = plantsError ?? booksError

  const totalPoints = plantsWithBooks.reduce((sum, p) => sum + p.growth_point, 0)
  const bloomCount = plantsWithBooks.filter((p) => p.stage === 'bloom').length
  const weeklyWaterings = plantsWithBooks.filter(
    (p) => p.last_watered_at && new Date(p.last_watered_at).getTime() >= weekAgo
  ).length

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header
        activeKey="garden"
        actions={<ViewToggle view={view} onChange={setView} />}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:flex-row lg:gap-8 lg:pb-8">
        <section className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-800">
              {view === 'garden' ? '🪴 내 정원' : '📚 나의 책장'}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {view === 'garden'
                ? '읽는 만큼 자라는 식물을 가꿔보세요'
                : '책등의 두께와 색이 책을 말해줍니다'}
            </p>
          </div>

          {dataError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {dataError.message}
            </div>
          )}

          {dataLoading ? (
            <SkeletonGrid />
          ) : plantsWithBooks.length === 0 ? (
            <EmptyGarden />
          ) : view === 'garden' ? (
            <GardenView
              plants={plantsWithBooks}
              onWater={setSelectedPlant}
              onSelect={(plant) => router.push(`/shelf?bookId=${plant.book_id}`)}
            />
          ) : (
            <ShelfView
              plants={plantsWithBooks}
              onSelect={(plant) => router.push(`/shelf?bookId=${plant.book_id}`)}
            />
          )}
        </section>

        <Sidebar
          weeklyWaterings={weeklyWaterings}
          totalPoints={totalPoints}
          bloomCount={bloomCount}
          plants={plantsWithBooks}
        />
      </main>

      <WaterModal
        plant={selectedPlantFresh}
        onClose={() => setSelectedPlant(null)}
        onWater={waterPlant}
      />
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div className="inline-flex rounded-full bg-stone-200/70 p-1 text-sm">
      <button
        onClick={() => onChange('garden')}
        className={`rounded-full px-3 py-1.5 transition ${
          view === 'garden'
            ? 'bg-white text-stone-900 shadow-sm'
            : 'text-stone-600 hover:text-stone-800'
        }`}
      >
        🪴 정원
      </button>
      <button
        onClick={() => onChange('shelf')}
        className={`rounded-full px-3 py-1.5 transition ${
          view === 'shelf'
            ? 'bg-white text-stone-900 shadow-sm'
            : 'text-stone-600 hover:text-stone-800'
        }`}
      >
        📚 책장
      </button>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-amber-900/5"
        >
          <div className="h-24 w-16 animate-pulse rounded-lg bg-stone-200" />
          <div className="mt-4 h-3 w-20 animate-pulse rounded bg-stone-200" />
          <div className="mt-2 h-2.5 w-28 animate-pulse rounded bg-stone-200/80" />
          <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-stone-200" />
        </div>
      ))}
    </div>
  )
}

function EmptyGarden() {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">🪴</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">
        아직 심은 책이 없어요
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        읽고 싶은 책을 찾아 첫 화분을 만들어보세요
      </p>
      <Link
        href="/search"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
      >
        🔎 책 검색으로 가기
      </Link>
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
    .sort((a, b) =>
      (b.last_watered_at ?? '').localeCompare(a.last_watered_at ?? '')
    )
    .slice(0, 3)

  return (
    <aside className="w-full shrink-0 space-y-5 lg:w-72">
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
                <span className="flex-1 truncate text-stone-700">
                  {p.book.title}
                </span>
                <span className="text-[11px] text-stone-400">+10pt</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
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
