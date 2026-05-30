'use client'

import type { Quote, QuoteWithRefs } from '@/types'

export interface QuoteCardProps {
  quote: QuoteWithRefs
  keyword?: string
  onToggleFavorite: (q: Quote) => void
}

export function QuoteCard({
  quote,
  keyword = '',
  onToggleFavorite,
}: QuoteCardProps) {
  return (
    <li
      className="rounded-2xl bg-amber-50 px-5 py-4 shadow-sm ring-1 ring-amber-200/70"
      style={{
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(218,184,134,0.12), transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,236,200,0.45), transparent 60%)',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="line-clamp-1 font-medium text-stone-700">
          📖 {quote.book?.title ?? '책 정보 없음'}
        </span>
        <span className="shrink-0 text-stone-400">
          {formatDate(quote.watered_at)}
        </span>
      </div>

      <blockquote
        className="border-l-2 border-amber-400 pl-3 text-sm italic leading-relaxed text-stone-800"
        style={{ fontFamily: '"Nanum Myeongjo", var(--font-geist-sans), serif' }}
      >
        <HighlightedText text={quote.content} keyword={keyword} />
      </blockquote>

      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
        <button
          type="button"
          onClick={() => onToggleFavorite(quote)}
          aria-label={quote.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          aria-pressed={!!quote.is_favorite}
          className="text-base transition hover:scale-110"
        >
          {quote.is_favorite ? '⭐' : '☆'}
        </button>
        {quote.page_number && <span>p.{quote.page_number}</span>}
      </div>
    </li>
  )
}

export function HighlightedText({
  text,
  keyword,
}: {
  text: string
  keyword: string
}) {
  const trimmed = keyword.trim()
  if (!trimmed) return <>{text}</>
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  const lowerKey = trimmed.toLowerCase()
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lowerKey ? (
          <mark
            key={i}
            className="rounded bg-yellow-200 px-0.5 text-stone-900"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
