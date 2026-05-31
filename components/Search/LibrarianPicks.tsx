'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getPlantByKdc } from '@/lib/plants'
import { isValidCoverUrl, toHttpsCoverUrl } from '@/lib/books'
import type { KakaoBook } from '@/types'

interface Pick {
  recomNo: string
  isbn: string
  title: string
  author: string
  publisher: string
  coverUrl: string
  drCode: string
  drCodeName: string
  kdcCode: string
}

interface Props {
  plantedIsbns: Set<string>
  plantingIsbn: string | null
  onPlant: (book: KakaoBook, kdcCode: string) => void
}

export function LibrarianPicks({ plantedIsbns, plantingIsbn, onPlant }: Props) {
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/librarian-picks')
      .then(async (r) => {
        const data = await r.json()
        if (!mounted) return
        if (!r.ok) {
          setError(data.error ?? '사서추천 불러오기 실패')
          return
        }
        if (Array.isArray(data.picks)) setPicks(data.picks)
      })
      .catch((e) => {
        if (mounted) setError((e as Error).message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  // 인증 실패 등 에러는 조용히 숨김 (검색 기능 자체엔 영향 X)
  if (error || (!loading && picks.length === 0)) return null

  return (
    <section className="mb-6">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-stone-700">
          🏛️ 사서가 고른 오늘의 씨앗
        </h2>
        <span className="text-[11px] text-stone-500">
          국립중앙도서관 사서 추천
        </span>
      </header>

      {loading ? (
        <SkeletonStrip />
      ) : (
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {picks.map((pick) => (
            <PickCard
              key={pick.recomNo}
              pick={pick}
              alreadyPlanted={!!pick.isbn && plantedIsbns.has(pick.isbn)}
              planting={!!pick.isbn && plantingIsbn === pick.isbn}
              onPlant={() => onPlant(pickToKakao(pick), pick.kdcCode)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function PickCard({
  pick,
  alreadyPlanted,
  planting,
  onPlant,
}: {
  pick: Pick
  alreadyPlanted: boolean
  planting: boolean
  onPlant: () => void
}) {
  const [imgError, setImgError] = useState(false)
  // http:// → https:// 강제 (Mixed-content 차단 회피)
  const coverSrc =
    isValidCoverUrl(pick.coverUrl) && !imgError
      ? toHttpsCoverUrl(pick.coverUrl)
      : null
  const kdcPlant = getPlantByKdc(pick.kdcCode)

  return (
    <li
      className="flex w-[160px] shrink-0 flex-col rounded-2xl bg-amber-50 p-3 shadow-sm ring-1 ring-amber-200/70"
      style={{
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(218,184,134,0.15), transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,236,200,0.5), transparent 60%)',
      }}
    >
      <div className="relative mb-2 h-44 w-full overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-200">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={pick.title}
            fill
            sizes="160px"
            className="object-cover"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-stone-400">
            📚
          </div>
        )}
      </div>

      <div className="mb-1 flex flex-wrap items-center gap-1">
        {pick.drCodeName && (
          <span className="rounded-full bg-amber-200/70 px-1.5 py-0.5 text-[9px] font-medium text-amber-900">
            {pick.drCodeName}
          </span>
        )}
        {kdcPlant && (
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800">
            🌱 {kdcPlant.name}
          </span>
        )}
      </div>

      <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-stone-800">
        {pick.title}
      </h3>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500">
        {pick.author || '저자 미상'}
      </p>

      <div className="mt-auto pt-2">
        <button
          type="button"
          onClick={onPlant}
          disabled={alreadyPlanted || planting}
          className={`w-full rounded-full px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
            alreadyPlanted
              ? 'bg-stone-400'
              : 'bg-gradient-to-br from-emerald-500 to-sky-500 hover:brightness-105'
          }`}
        >
          {alreadyPlanted
            ? '이미 심었어요'
            : planting
              ? '심는 중...'
              : '🌱 씨앗으로 심기'}
        </button>
      </div>
    </li>
  )
}

function SkeletonStrip() {
  return (
    <ul className="-mx-1 flex gap-3 px-1 pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="w-[160px] shrink-0 animate-pulse rounded-2xl bg-amber-100/60 p-3"
        >
          <div className="mb-2 h-44 rounded-md bg-amber-200/40" />
          <div className="mb-1 h-2.5 w-10 rounded bg-amber-200/50" />
          <div className="h-3 w-full rounded bg-amber-200/50" />
          <div className="mt-1 h-2.5 w-2/3 rounded bg-amber-200/40" />
          <div className="mt-3 h-7 rounded-full bg-amber-200/40" />
        </li>
      ))}
    </ul>
  )
}

function pickToKakao(pick: Pick): KakaoBook {
  return {
    title: pick.title,
    contents: '',
    url: '',
    isbn: pick.isbn,
    datetime: '',
    authors: pick.author ? [pick.author] : [],
    publisher: pick.publisher,
    translators: [],
    price: 0,
    sale_price: 0,
    thumbnail: pick.coverUrl,
    status: '',
    kdc_code: pick.kdcCode,
  }
}
