'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { ShelfView } from '@/components/Garden/ShelfView'
import {
  PlantIllustration,
  hasPlantIllustration,
} from '@/components/Plant/PlantIllustration'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'
import type { PlantWithBook } from '@/types'

const PREVIEW_LIMIT = 6

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { plants, loading: plantsLoading } = useGarden(user?.id)
  const { books, loading: booksLoading } = useBook(user?.id)
  const [query, setQuery] = useState('')

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

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header activeKey="home" />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
          불러오는 중...
        </main>
      </div>
    )
  }

  const dataLoading = plantsLoading || booksLoading
  const preview = plantsWithBooks.slice(0, PREVIEW_LIMIT)

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="home" />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {/* 히어로 */}
        <section className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-emerald-700">
            안녕하세요, {user.nickname}님
          </p>
          <h1 className="mt-2 text-2xl font-bold text-stone-800 sm:text-3xl">
            오늘도 한 줄, 그리고 한 뼘
          </h1>
          <p className="mt-2 text-sm text-stone-500">어떤 책을 심어볼까요?</p>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex w-full max-w-[520px] items-center gap-2"
          >
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="책 제목, 저자로 검색"
              aria-label="책 검색"
              className="h-12 flex-1 rounded-full border-2 border-emerald-400 bg-white px-5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              검색
            </button>
          </form>
        </section>

        {/* 2단 섹션 */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <PreviewSection
            title="🌱 내 정원"
            subtitle="자라는 중인 식물들"
            href="/garden"
            loading={dataLoading}
            isEmpty={preview.length === 0}
            emptyText="아직 심은 책이 없어요"
          >
            <div className="grid grid-cols-3 gap-3">
              {preview.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => router.push(`/shelf?bookId=${p.book_id}`)}
                  className="flex min-h-[88px] flex-col items-center rounded-xl bg-white/70 p-2 ring-1 ring-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {hasPlantIllustration(p.kdc_code) ? (
                    <PlantIllustration
                      kdcCode={p.kdc_code}
                      stage={p.stage}
                      size={56}
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center text-3xl">
                      🌸
                    </div>
                  )}
                  <span className="mt-1 line-clamp-1 w-full text-center text-[11px] text-stone-600">
                    {p.plant_name}
                  </span>
                </button>
              ))}
            </div>
          </PreviewSection>

          <PreviewSection
            title="📚 내 책장"
            subtitle="꽂아둔 책들"
            href="/shelf"
            loading={dataLoading}
            isEmpty={preview.length === 0}
            emptyText="아직 꽂은 책이 없어요"
          >
            <ShelfView
              plants={preview}
              booksPerShelf={PREVIEW_LIMIT}
              onSelect={(plant) => router.push(`/shelf?bookId=${plant.book_id}`)}
            />
          </PreviewSection>
        </div>
      </main>
    </div>
  )
}

function PreviewSection({
  title,
  subtitle,
  href,
  loading,
  isEmpty,
  emptyText,
  children,
}: {
  title: string
  subtitle: string
  href: string
  loading: boolean
  isEmpty: boolean
  emptyText: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-amber-900/5 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
          <p className="truncate text-xs text-stone-500">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-200"
        >
          전체보기 →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl bg-white/40 px-4 py-10 text-sm text-stone-400">
          불러오는 중...
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 bg-white/40 px-4 py-8 text-center text-sm text-stone-500">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </section>
  )
}
