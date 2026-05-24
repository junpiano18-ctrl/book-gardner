'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Book, Plant, Quote } from '@/types'
import { getQuotesByBook } from '@/lib/quotes'
import { getPlantByKdc } from '@/lib/plants'

interface LibraryCardProps {
  book: Book
  plant?: Plant
}

export function LibraryCard({ book, plant }: LibraryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const kdcPlant = plant ?? null
  const fallbackPlant = !kdcPlant ? getPlantByKdc(book.kdc_code) : null
  const plantName = kdcPlant?.plant_name ?? fallbackPlant?.name ?? '식물'

  const completedDate =
    kdcPlant?.completed_at ?? book.updated_at ?? book.created_at
  const completedLabel = formatDate(completedDate)

  async function toggleExpand() {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (quotes !== null) return

    setLoadingQuotes(true)
    setQuoteError(null)
    try {
      const data = await getQuotesByBook(book.id)
      setQuotes(data)
    } catch (e) {
      setQuoteError((e as Error).message ?? '문장을 불러오지 못했어요')
    } finally {
      setLoadingQuotes(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl bg-white/80 shadow-sm ring-1 ring-amber-200/60 transition hover:shadow-md">
      <div className="relative h-64 w-full bg-gradient-to-b from-amber-50 to-amber-100">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-contain p-6"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl text-amber-300">
            📕
          </div>
        )}

        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-100/95 px-2.5 py-1 text-xs font-medium text-rose-700 shadow-sm">
          🌸 완독
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-stone-800">
            {book.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-stone-500">
            {book.author ?? '저자 미상'}
            {book.publisher ? ` · ${book.publisher}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
            🌸 {plantName}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
            KDC {book.kdc_code}
          </span>
          {completedLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
              📅 {completedLabel}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleExpand}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white/70 px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50"
        >
          <span>📝 남긴 한 줄 모아보기{quotes ? ` (${quotes.length})` : ''}</span>
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {expanded && (
          <div className="rounded-xl bg-amber-50/60 px-4 py-3 ring-1 ring-amber-100">
            {loadingQuotes && (
              <p className="py-3 text-center text-xs text-stone-500">불러오는 중...</p>
            )}
            {quoteError && (
              <p className="py-3 text-center text-xs text-red-600">{quoteError}</p>
            )}
            {!loadingQuotes && !quoteError && quotes && quotes.length === 0 && (
              <p className="py-3 text-center text-xs text-stone-500">
                아직 남긴 한 줄이 없어요
              </p>
            )}
            {!loadingQuotes && !quoteError && quotes && quotes.length > 0 && (
              <ul className="space-y-2">
                {quotes.map((q) => (
                  <li
                    key={q.id}
                    className="border-l-2 border-emerald-300 pl-3 text-sm text-stone-700"
                  >
                    <p className="leading-relaxed">&ldquo;{q.content}&rdquo;</p>
                    <p className="mt-1 text-[11px] text-stone-400">
                      {q.page_number ? `p.${q.page_number} · ` : ''}
                      {formatDate(q.watered_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
