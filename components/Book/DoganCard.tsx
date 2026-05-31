'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  PlantIllustration,
  hasPlantIllustration,
} from '@/components/Plant/PlantIllustration'
import { getPlantByKdc, getPlantInfo } from '@/lib/plants'
import { getQuotesByBook } from '@/lib/quotes'
import { isValidCoverUrl, toHttpsCoverUrl } from '@/lib/books'
import type { Book, Plant, PlantInfo, Quote } from '@/types'

interface DoganCardProps {
  book: Book
  plant?: Plant
  number: number
}

const CARD_W = 200
const CARD_H = 280

export function DoganCard({ book, plant, number }: DoganCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [lastQuote, setLastQuote] = useState<Quote | null>(null)
  const [quoteCount, setQuoteCount] = useState(0)
  const [quotesLoaded, setQuotesLoaded] = useState(false)
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null)

  useEffect(() => {
    let mounted = true
    getQuotesByBook(book.id)
      .then((qs) => {
        if (!mounted) return
        setLastQuote(qs.length > 0 ? qs[qs.length - 1] : null)
        setQuoteCount(qs.length)
        setQuotesLoaded(true)
      })
      .catch(() => {
        if (mounted) setQuotesLoaded(true)
      })
    return () => {
      mounted = false
    }
  }, [book.id])

  useEffect(() => {
    let mounted = true
    getPlantInfo(book.kdc_code).then((info) => {
      if (mounted) setPlantInfo(info)
    })
    return () => {
      mounted = false
    }
  }, [book.kdc_code])

  const plantKdc = plant?.kdc_code ?? book.kdc_code
  const hasSvg = hasPlantIllustration(plantKdc)
  const kdcPlant = getPlantByKdc(book.kdc_code)
  const plantName = plant?.plant_name ?? kdcPlant?.name ?? '식물'
  const sciName = plant?.sci_name ?? kdcPlant?.sci ?? ''
  const familyName = plant?.family_name ?? kdcPlant?.family ?? ''
  const completedAt = plant?.completed_at ?? book.updated_at ?? book.created_at
  const numberLabel = `#${String(number).padStart(3, '0')}`

  function toggle() {
    setFlipped((f) => !f)
  }

  return (
    <div
      style={{ width: CARD_W, height: CARD_H, perspective: '1200px' }}
      className="cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-label={`도감 ${numberLabel} ${book.title} ${flipped ? '뒷면' : '앞면'} - 클릭으로 뒤집기`}
      aria-pressed={flipped}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      <div
        className="relative h-full w-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <Face front>
          <FrontContent
            book={book}
            plantKdc={plantKdc}
            hasSvg={hasSvg}
            plantName={plantName}
            numberLabel={numberLabel}
          />
        </Face>
        <Face>
          <BackContent
            book={book}
            plantKdc={plantKdc}
            hasSvg={hasSvg}
            plantName={plantName}
            sciName={sciName}
            familyName={familyName}
            plantInfo={plantInfo}
            completedAt={completedAt}
            lastQuote={lastQuote}
            quoteCount={quoteCount}
            quotesLoaded={quotesLoaded}
            numberLabel={numberLabel}
          />
        </Face>
      </div>
    </div>
  )
}

function Face({ front, children }: { front?: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl bg-amber-50 shadow-md ring-1 ring-amber-300/70 [backface-visibility:hidden]"
      style={{
        transform: front ? 'rotateY(0deg)' : 'rotateY(180deg)',
        backgroundImage:
          'radial-gradient(circle at 20% 0%, rgba(255,236,200,0.6), transparent 60%), radial-gradient(circle at 80% 100%, rgba(218,184,134,0.25), transparent 60%)',
      }}
    >
      <div className="absolute inset-1.5 rounded-xl ring-1 ring-amber-200/70 pointer-events-none" />
      {children}
    </div>
  )
}

function FrontContent({
  book,
  plantKdc,
  hasSvg,
  plantName,
  numberLabel,
}: {
  book: Book
  plantKdc?: string
  hasSvg: boolean
  plantName: string
  numberLabel: string
}) {
  return (
    <div className="flex h-full w-full flex-col items-center px-4 pb-3 pt-3.5">
      <div className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-amber-900">
        📖 도감 {numberLabel}
      </div>

      <div className="relative mt-3 h-[150px] w-[100px] overflow-hidden rounded-md bg-stone-100 shadow-sm ring-1 ring-stone-300/70">
        {isValidCoverUrl(book.cover_url) ? (
          <Image
            src={toHttpsCoverUrl(book.cover_url)}
            alt={book.title}
            fill
            sizes="100px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-stone-400">
            📕
          </div>
        )}

        {hasSvg && (
          <div className="absolute -bottom-2 -right-3 drop-shadow">
            <PlantIllustration kdcCode={plantKdc} stage="bloom" size={56} />
          </div>
        )}
      </div>

      <div className="mt-3 w-full flex-1">
        <h3
          className="line-clamp-2 text-center text-[13px] font-bold leading-tight text-stone-800"
          style={{ fontFamily: 'var(--font-geist-sans), serif' }}
        >
          {book.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-center text-[11px] text-stone-500">
          {book.author ?? '저자 미상'}
        </p>
        <p className="mt-1 text-center text-[10px] italic text-amber-900/70">
          🌸 {plantName}
        </p>
      </div>
    </div>
  )
}

function BackContent({
  book,
  plantKdc,
  hasSvg,
  plantName,
  sciName,
  familyName,
  plantInfo,
  completedAt,
  lastQuote,
  quoteCount,
  quotesLoaded,
  numberLabel,
}: {
  book: Book
  plantKdc?: string
  hasSvg: boolean
  plantName: string
  sciName: string
  familyName: string
  plantInfo: PlantInfo | null
  completedAt?: string
  lastQuote: Quote | null
  quoteCount: number
  quotesLoaded: boolean
  numberLabel: string
}) {
  const familyKor = plantInfo?.family_kor ?? familyName
  const familySci = plantInfo?.family_sci
  const genusKor = plantInfo?.genus_kor
  const genusSci = plantInfo?.genus_sci
  const hasForestData = !!(familySci || genusKor || genusSci)
  const hasClassification = !!(familyKor || familySci || genusKor || genusSci)

  return (
    <div className="flex h-full w-full flex-col px-3.5 pb-3 pt-3">
      <div className="flex flex-col items-center">
        {hasSvg ? (
          <PlantIllustration kdcCode={plantKdc} stage="bloom" size={56} />
        ) : (
          <div className="flex h-[56px] w-[56px] items-center justify-center text-3xl">
            🌸
          </div>
        )}
        <h3 className="mt-0.5 text-sm font-bold leading-tight text-stone-800">
          {plantName}
        </h3>
        {sciName && (
          <p className="text-[10px] italic leading-tight text-stone-500">
            {sciName}
          </p>
        )}
      </div>

      {hasClassification && (
        <div className="mt-1.5 rounded-md bg-amber-100/60 px-2 py-1 leading-tight ring-1 ring-amber-200/60">
          {(familyKor || familySci) && (
            <p className="flex items-baseline gap-1 text-[10px]">
              <span className="w-3 shrink-0 text-stone-500">과</span>
              {familyKor && (
                <span className="truncate text-stone-800">{familyKor}</span>
              )}
              {familySci && (
                <span className="truncate italic text-stone-500">{familySci}</span>
              )}
            </p>
          )}
          {(genusKor || genusSci) && (
            <p className="flex items-baseline gap-1 text-[10px]">
              <span className="w-3 shrink-0 text-stone-500">속</span>
              {genusKor && (
                <span className="truncate text-stone-800">{genusKor}</span>
              )}
              {genusSci && (
                <span className="truncate italic text-stone-500">{genusSci}</span>
              )}
            </p>
          )}
          {hasForestData && (
            <p className="mt-0.5 text-[8.5px] italic text-stone-500">
              🌿 산림청 국가표준식물목록
            </p>
          )}
        </div>
      )}

      <div className="my-1.5 border-t border-dashed border-amber-300/70" />

      <div className="flex-1 text-[10.5px] text-stone-700">
        <div className="flex items-center justify-between text-stone-500">
          <span>📅 {completedAt ? formatDate(completedAt) : '—'}</span>
          {quotesLoaded && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
              📜 {quoteCount}
            </span>
          )}
        </div>
        <div className="mt-1">
          {!quotesLoaded ? (
            <p className="text-stone-400">기록 불러오는 중...</p>
          ) : lastQuote ? (
            <blockquote className="border-l-2 border-emerald-300 pl-2 italic leading-snug text-stone-700 line-clamp-2">
              &ldquo;{lastQuote.content}&rdquo;
            </blockquote>
          ) : (
            <p className="text-stone-400">남긴 한 줄이 없어요</p>
          )}
        </div>
      </div>

      <Link
        href={`/books/${book.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 block w-full rounded-full bg-amber-900/5 px-3 py-1.5 text-center text-[11px] font-medium text-stone-700 ring-1 ring-amber-200/70 transition hover:bg-amber-100"
      >
        📜 이 책의 문장 보기 →
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-stone-400">
          {book.kdc_code}
        </span>
        <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-900">
          📖 {numberLabel}
        </span>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
