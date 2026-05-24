'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { LibraryCard } from '@/components/Book/LibraryCard'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'

export default function LibraryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { books, loading: booksLoading, error: booksError } = useBook(user?.id)
  const { plants } = useGarden(user?.id)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header activeKey="library" />
        <main className="mx-auto w-full max-w-3xl px-6 py-10 text-center text-stone-500">
          불러오는 중...
        </main>
      </div>
    )
  }

  const completed = books.filter((b) => b.status === 'completed')
  const plantByBookId = new Map(plants.map((p) => [p.book_id, p]))

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="library" />

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-800">📚 완독 서재</h1>
          <p className="mt-1 text-sm text-stone-500">
            완독한 책과 그 위에서 자란 식물 도감
          </p>
        </div>

        {booksError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {booksError.message}
          </div>
        )}

        {booksLoading ? (
          <p className="py-16 text-center text-sm text-stone-500">불러오는 중...</p>
        ) : completed.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {completed.map((book) => (
              <LibraryCard
                key={book.id}
                book={book}
                plant={plantByBookId.get(book.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">🌱</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">
        아직 완독한 책이 없어요
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        한 권을 끝까지 키우면 이 도감에 꽃이 핍니다
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
