'use client'

import Image from 'next/image'
import type { KakaoBook } from '@/types'
import { getPlantByKdc } from '@/lib/plants'

interface BookCardProps {
  book: KakaoBook
  kdcCode: string
  alreadyPlanted: boolean
  planting: boolean
  onPlant: (book: KakaoBook, kdcCode: string) => void
}

export function BookCard({ book, kdcCode, alreadyPlanted, planting, onPlant }: BookCardProps) {
  const kdcPlant = getPlantByKdc(kdcCode)

  return (
    <article className="flex gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-amber-900/5">
      <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-200">
        {book.thumbnail ? (
          <Image
            src={book.thumbnail}
            alt={book.title}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-stone-400">
            📕
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-base font-semibold text-stone-800">{book.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-stone-600">
          {book.authors?.length ? book.authors.join(', ') : '저자 미상'}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{book.publisher || '출판사 미상'}</p>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
            KDC {kdcCode}
          </span>
          {kdcPlant && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
              🌱 {kdcPlant.name}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {alreadyPlanted ? (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-full bg-stone-200 px-4 py-2 text-sm font-medium text-stone-500"
            >
              이미 심었어요
            </button>
          ) : (
            <button
              onClick={() => onPlant(book, kdcCode)}
              disabled={planting}
              className="w-full rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              {planting ? '심는 중...' : '🪴 정원에 심기'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
