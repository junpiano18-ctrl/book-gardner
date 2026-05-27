'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/Header'
import { PlantIllustration, hasPlantIllustration } from '@/components/Plant/PlantIllustration'
import { WaterModal } from '@/components/ui/WaterModal'
import { useAuth } from '@/hooks/useAuth'
import { getBookById } from '@/lib/books'
import { getPlantByBookId, waterPlant as waterPlantLib } from '@/lib/garden'
import { addQuote, getQuotesByBook, toggleQuoteFavorite } from '@/lib/quotes'
import { getPlantByKdc, getPlantInfo } from '@/lib/plants'
import type { Book, Plant, PlantInfo, PlantStage, PlantWithBook, Quote } from '@/types'

type SortMode = 'page' | 'recent' | 'oldest'

const STAGE_LABEL: Record<PlantStage, string> = {
  seed: '씨앗',
  sprout: '새싹',
  growing: '성장',
  bloom: '개화',
}

const STAGE_EMOJI: Record<PlantStage, string> = {
  seed: '🌰',
  sprout: '🌱',
  growing: '🌿',
  bloom: '🌸',
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [book, setBook] = useState<Book | null>(null)
  const [plant, setPlant] = useState<Plant | null>(null)
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [sort, setSort] = useState<SortMode>('page')
  const [modalOpen, setModalOpen] = useState(false)
  const [favOnly, setFavOnly] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    let mounted = true
    setLoading(true)
    Promise.all([
      getBookById(id),
      getPlantByBookId(id),
      getQuotesByBook(id),
    ])
      .then(([b, p, qs]) => {
        if (!mounted) return
        setBook(b)
        setPlant(p)
        setQuotes(qs)
        if (b) {
          getPlantInfo(b.kdc_code).then((info) => {
            if (mounted) setPlantInfo(info)
          })
        }
      })
      .catch((e) => {
        if (mounted) setError(e as Error)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [id, user])

  const sortedQuotes = useMemo(() => {
    const arr = favOnly ? quotes.filter((q) => q.is_favorite) : [...quotes]
    if (sort === 'page') {
      arr.sort((a, b) => {
        const ap = a.page_number ?? Number.POSITIVE_INFINITY
        const bp = b.page_number ?? Number.POSITIVE_INFINITY
        if (ap !== bp) return ap - bp
        return a.watered_at.localeCompare(b.watered_at)
      })
    } else if (sort === 'recent') {
      arr.sort((a, b) => b.watered_at.localeCompare(a.watered_at))
    } else {
      arr.sort((a, b) => a.watered_at.localeCompare(b.watered_at))
    }
    return arr
  }, [quotes, sort, favOnly])

  const plantWithBook = useMemo<PlantWithBook | null>(() => {
    if (!plant || !book) return null
    return { ...plant, book }
  }, [plant, book])

  async function handleWater(input: {
    plantId: string
    bookId: string
    content: string
    pageNumber?: number
  }): Promise<{ plant: Plant; quote: Quote } | null> {
    if (!user || !plant) return null
    try {
      if (plant.completed_at) {
        const quote = await addQuote({ ...input, userId: user.id })
        setQuotes((prev) => [...prev, quote])
        return { plant, quote }
      }
      const result = await waterPlantLib({ ...input, userId: user.id })
      setPlant(result.plant)
      setQuotes((prev) => [...prev, result.quote])
      return result
    } catch (e) {
      setError(e as Error)
      return null
    }
  }

  async function handleToggleFavorite(quote: Quote) {
    const next = !quote.is_favorite
    setQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, is_favorite: next } : q))
    )
    try {
      await toggleQuoteFavorite(quote.id, next)
    } catch (e) {
      setQuotes((prev) =>
        prev.map((q) => (q.id === quote.id ? { ...q, is_favorite: !next } : q))
      )
      setError(e as Error)
    }
  }

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

  return (
    <div className="min-h-screen flex-1" style={{ backgroundColor: '#fdf6ee' }}>
      <Header activeKey="dogan" />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div className="mb-4">
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-stone-800"
          >
            ← 도감으로 돌아가기
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error.message}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-stone-500">불러오는 중...</p>
        ) : !book ? (
          <NotFound />
        ) : (
          <>
            <BookHeader
              book={book}
              plant={plant}
              plantInfo={plantInfo}
              quoteCount={quotes.length}
              onAddQuote={plant ? () => setModalOpen(true) : undefined}
            />

            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-stone-800">
                  📜 이 책의 문장 {quotes.length > 0 && <span className="text-stone-400">({quotes.length})</span>}
                </h2>
                {quotes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFavOnly((v) => !v)}
                      aria-pressed={favOnly}
                      className={`rounded-full px-2.5 py-1 text-xs transition ${
                        favOnly
                          ? 'bg-amber-200 text-amber-900 ring-1 ring-amber-300'
                          : 'bg-stone-200/70 text-stone-600 hover:text-stone-800'
                      }`}
                    >
                      ⭐ 즐겨찾기만
                    </button>
                    <SortToggle sort={sort} onChange={setSort} />
                  </div>
                )}
              </div>

              {quotes.length === 0 ? (
                <EmptyQuotes onAddQuote={plant ? () => setModalOpen(true) : undefined} />
              ) : sortedQuotes.length === 0 ? (
                <p className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 py-10 text-center text-sm text-stone-500">
                  즐겨찾기한 문장이 없어요
                </p>
              ) : (
                <ul className="space-y-3">
                  {sortedQuotes.map((q) => (
                    <QuoteRow key={q.id} quote={q} onToggleFavorite={handleToggleFavorite} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {modalOpen && plantWithBook && (
        <WaterModal
          plant={plantWithBook}
          onClose={() => setModalOpen(false)}
          onWater={handleWater}
        />
      )}
    </div>
  )
}

function BookHeader({
  book,
  plant,
  plantInfo,
  quoteCount,
  onAddQuote,
}: {
  book: Book
  plant: Plant | null
  plantInfo: PlantInfo | null
  quoteCount: number
  onAddQuote?: () => void
}) {
  const kdcPlant = plant ?? null
  const fallbackPlant = !kdcPlant ? getPlantByKdc(book.kdc_code) : null
  const plantName = kdcPlant?.plant_name ?? fallbackPlant?.name ?? '식물'
  const sciName = kdcPlant?.sci_name ?? fallbackPlant?.sci ?? ''
  const stage = plant?.stage
  const completedAt = plant?.completed_at
  const hasSvg = hasPlantIllustration(book.kdc_code)

  const familyKor = plantInfo?.family_kor
  const familySci = plantInfo?.family_sci
  const genusKor = plantInfo?.genus_kor
  const genusSci = plantInfo?.genus_sci
  const hasForestData = !!(familySci || genusKor || genusSci)
  const hasClassification = !!(familyKor || familySci || genusKor || genusSci)

  return (
    <section className="overflow-hidden rounded-3xl bg-white/80 shadow-sm ring-1 ring-amber-900/5">
      <div className="flex flex-col gap-6 p-6 sm:flex-row">
        <div className="relative h-48 w-32 shrink-0 self-center overflow-hidden rounded-lg bg-stone-100 shadow ring-1 ring-stone-200 sm:self-start">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-stone-400">
              📕
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-xl font-bold leading-snug text-stone-800">{book.title}</h1>
            {onAddQuote && (
              <button
                type="button"
                onClick={onAddQuote}
                className="shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                + 문장 추가
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {book.author ?? '저자 미상'}
            {book.publisher ? ` · ${book.publisher}` : ''}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
              KDC {book.kdc_code}
            </span>
            {plantName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
                🌸 {plantName}
              </span>
            )}
            {completedAt ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
                ✅ 완독
              </span>
            ) : (
              stage && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">
                  {STAGE_EMOJI[stage]} {STAGE_LABEL[stage]}
                </span>
              )
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-stone-700">
              📜 문장 {quoteCount}개
            </span>
          </div>

          {sciName && (
            <p className="mt-2 text-[11px] italic text-stone-500">{sciName}</p>
          )}

          {hasClassification && (
            <div className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 ring-1 ring-amber-200/60">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900">
                🌿 식물 분류
              </div>
              <dl className="mt-1.5 grid grid-cols-[2rem_1fr] gap-x-3 gap-y-1 text-[12px]">
                {(familyKor || familySci) && (
                  <>
                    <dt className="text-stone-500">과</dt>
                    <dd className="text-stone-800">
                      {familyKor}
                      {familySci && (
                        <span className="ml-1.5 italic text-stone-500">
                          {familySci}
                        </span>
                      )}
                    </dd>
                  </>
                )}
                {(genusKor || genusSci) && (
                  <>
                    <dt className="text-stone-500">속</dt>
                    <dd className="text-stone-800">
                      {genusKor}
                      {genusSci && (
                        <span className="ml-1.5 italic text-stone-500">
                          {genusSci}
                        </span>
                      )}
                    </dd>
                  </>
                )}
              </dl>
              {hasForestData && (
                <p className="mt-2 text-[10px] italic text-stone-500">
                  출처: 산림청 국가표준식물목록 (공공데이터포털)
                </p>
              )}
            </div>
          )}

          {plant && (
            <div className="mt-4 flex items-center gap-3">
              {hasSvg ? (
                <PlantIllustration kdcCode={book.kdc_code} stage={plant.stage} size={48} />
              ) : (
                <span className="text-3xl">{STAGE_EMOJI[plant.stage]}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between text-[11px] text-stone-500">
                  <span>{STAGE_LABEL[plant.stage]}</span>
                  <span>{plant.growth_point % 100} / 100</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${plant.stage === 'bloom' ? 100 : plant.growth_point % 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function SortToggle({
  sort,
  onChange,
}: {
  sort: SortMode
  onChange: (s: SortMode) => void
}) {
  const items: Array<{ key: SortMode; label: string }> = [
    { key: 'page', label: '페이지순' },
    { key: 'recent', label: '최신순' },
    { key: 'oldest', label: '오래된순' },
  ]

  return (
    <div className="inline-flex rounded-full bg-stone-200/70 p-1 text-xs">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`rounded-full px-2.5 py-1 transition ${
            sort === it.key
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-800'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

function QuoteRow({
  quote,
  onToggleFavorite,
}: {
  quote: Quote
  onToggleFavorite: (q: Quote) => void
}) {
  return (
    <li className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-amber-900/5">
      <div className="flex items-start gap-2">
        <blockquote className="flex-1 border-l-2 border-emerald-300 pl-3 text-sm italic leading-relaxed text-stone-800">
          &ldquo;{quote.content}&rdquo;
        </blockquote>
        <button
          type="button"
          onClick={() => onToggleFavorite(quote)}
          aria-label={quote.is_favorite ? '즐겨찾기 해제' : '즐겨찾기'}
          aria-pressed={!!quote.is_favorite}
          className="shrink-0 rounded-full px-2 py-1 text-base leading-none transition hover:bg-amber-50"
        >
          <span className={quote.is_favorite ? 'text-amber-500' : 'text-stone-300'}>★</span>
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-400">
        {quote.page_number && <span>p.{quote.page_number}</span>}
        {quote.page_number && <span>·</span>}
        <span>{formatDate(quote.watered_at)}</span>
      </div>
    </li>
  )
}

function EmptyQuotes({ onAddQuote }: { onAddQuote?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-12 text-center">
      <div className="text-4xl">📝</div>
      <p className="mt-3 text-sm text-stone-600">아직 이 책에서 남긴 문장이 없어요</p>
      <p className="mt-1 text-xs text-stone-500">
        {onAddQuote ? '아래 버튼으로 첫 문장을 남겨보세요' : '정원에서 화분에 물을 주며 한 줄을 적어보세요'}
      </p>
      {onAddQuote && (
        <button
          type="button"
          onClick={onAddQuote}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
        >
          + 첫 문장 남기기
        </button>
      )}
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/40 px-6 py-16 text-center">
      <div className="text-5xl">🤔</div>
      <h2 className="mt-3 text-lg font-semibold text-stone-700">책을 찾을 수 없어요</h2>
      <p className="mt-1 text-sm text-stone-500">삭제되었거나 접근 권한이 없는 책일 수 있어요</p>
      <Link
        href="/library"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-900"
      >
        도감으로 돌아가기
      </Link>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
