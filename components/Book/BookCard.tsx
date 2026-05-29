'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { KakaoBook } from '@/types'
import { getPlantByKdc } from '@/lib/plants'
import { getKdcColor } from '@/lib/kdc-colors'

interface BookCardProps {
  book: KakaoBook
  kdcCode: string
  alreadyPlanted: boolean
  planting: boolean
  onPlant: (book: KakaoBook, kdcCode: string) => void
}

// NL API 가 표지 없을 때 빈 공백 또는 'http://.../cover.nl.go.kr/' 처럼
// 슬래시로 끝나는 의미 없는 URL 을 내려보내는 경우를 걸러냄
function isValidCoverUrl(url: string | undefined | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.endsWith('cover.nl.go.kr/')) return false
  if (trimmed.endsWith('/')) return false
  return true
}

// 제목 첫 단어의 앞 2~3 글자만 추려서 표지 폴백에 표시
function titlePrefix(title: string): string {
  const firstWord = title.trim().split(/[\s:·,—\-/]+/)[0] ?? ''
  if (firstWord.length <= 3) return firstWord
  return firstWord.slice(0, 3)
}

export function BookCard({ book, kdcCode, alreadyPlanted, planting, onPlant }: BookCardProps) {
  const kdcPlant = getPlantByKdc(kdcCode)
  const [imageError, setImageError] = useState(false)
  const useFallback = !isValidCoverUrl(book.thumbnail) || imageError

  return (
    <article className="flex gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-amber-900/5">
      <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-200">
        {useFallback ? (
          <CoverFallback title={book.title} kdcCode={kdcCode} />
        ) : (
          <Image
            src={book.thumbnail}
            alt={book.title}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
            onError={() => setImageError(true)}
          />
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

function CoverFallback({ title, kdcCode }: { title: string; kdcCode: string }) {
  const color = getKdcColor(kdcCode)
  const prefix = titlePrefix(title)

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-between px-2 py-3 text-white"
      style={{ backgroundColor: color }}
    >
      <div className="text-xl opacity-70" aria-hidden>
        📕
      </div>
      <div className="line-clamp-2 break-keep text-center font-serif text-lg font-semibold leading-tight">
        {prefix}
      </div>
      <div className="text-[9px] tracking-wider opacity-70">표지 없음</div>
    </div>
  )
}
