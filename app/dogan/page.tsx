'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { DoganCard } from '@/components/Book/DoganCard'
import { useAuth } from '@/hooks/useAuth'
import { useBook } from '@/hooks/useBook'
import { useGarden } from '@/hooks/useGarden'

export default function DoganPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { books, loading: booksLoading, error: booksError } = useBook(user?.id)
  const { plants } = useGarden(user?.id)
  const [shareFlash, setShareFlash] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
        <Header activeKey="dogan" />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-stone-500 sm:px-6">
          불러오는 중...
        </main>
      </div>
    )
  }

  const completed = books.filter((b) => b.status === 'completed')
  const plantByBookId = new Map(plants.map((p) => [p.book_id, p]))

  async function handleShare() {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const title = '🌿 내 도감'
    const text =
      completed.length > 0
        ? `${user?.nickname ?? '독자'}님의 ${completed.length}권 도감을 봐주세요`
        : `${user?.nickname ?? '독자'}님의 도감을 봐주세요`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // 사용자가 취소했을 가능성 — 무시
      }
      return
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setShareFlash('링크를 복사했어요')
        setTimeout(() => setShareFlash(null), 2000)
      } catch {
        setShareFlash('공유 기능을 지원하지 않는 환경이에요')
        setTimeout(() => setShareFlash(null), 2000)
      }
    }
  }

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="dogan" />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">🌿 도감</h1>
            <p className="mt-1 text-sm text-stone-500">
              완독한 책과 그 위에서 자란 식물 도감
            </p>
          </div>
          {completed.length > 0 && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-900"
            >
              📤 도감 공유하기
            </button>
          )}
        </div>

        {shareFlash && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {shareFlash}
          </div>
        )}

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
          <>
            <div className="flex flex-wrap justify-center gap-4 sm:justify-start sm:gap-6">
              {completed.map((book, idx) => (
                <DoganCard
                  key={book.id}
                  book={book}
                  plant={plantByBookId.get(book.id)}
                  number={idx + 1}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-stone-400">
              카드를 클릭하면 식물 정보와 마지막 한 줄을 볼 수 있어요
            </p>
          </>
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
        🔍 책 검색으로 가기
      </Link>
    </div>
  )
}
