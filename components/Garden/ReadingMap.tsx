'use client'

import { useMemo } from 'react'
import type { Book } from '@/types'

// KDC 0~9 라벨
const KDC_LABEL: Record<string, string> = {
  '0': '총류',
  '1': '철학',
  '2': '종교',
  '3': '사회과학',
  '4': '자연과학',
  '5': '기술',
  '6': '예술',
  '7': '언어',
  '8': '문학',
  '9': '역사',
}

const KDC_KEYS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

interface ReadingMapProps {
  books: Book[]
}

export function ReadingMap({ books }: ReadingMapProps) {
  const stats = useMemo(() => {
    const total = books.length
    const completed = books.filter((b) => b.status === 'completed').length
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const thisMonth = books.filter((b) => {
      if (!b.created_at) return false
      const d = new Date(b.created_at)
      return d.getFullYear() === y && d.getMonth() === m
    }).length

    const counts: Record<string, number> = {}
    for (const k of KDC_KEYS) counts[k] = 0
    for (const b of books) {
      const k = b.kdc_code?.charAt(0) ?? ''
      if (k in counts) counts[k]++
    }
    const maxCount = Math.max(1, ...Object.values(counts))

    // 가장 많이 읽은 분야 (권수 0이면 null)
    let topKey: string | null = null
    let topCount = 0
    for (const k of KDC_KEYS) {
      if (counts[k] > topCount) {
        topKey = k
        topCount = counts[k]
      }
    }

    return { total, completed, thisMonth, counts, maxCount, topKey }
  }, [books])

  return (
    <section className="rounded-2xl bg-amber-50/70 p-4 shadow-sm ring-1 ring-amber-200/60 sm:p-5">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-stone-800">
          🗺️ 나의 독서 지형도
        </h2>
        {stats.topKey && (
          <p className="text-xs text-amber-900/80">
            <span className="font-semibold">{KDC_LABEL[stats.topKey]}</span>
            을(를) 가장 많이 읽고 있어요
          </p>
        )}
      </header>

      {/* 미니 스탯 3개 */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="총 권수" value={stats.total} />
        <Stat label="이번 달" value={stats.thisMonth} />
        <Stat label="완독" value={stats.completed} />
      </div>

      {/* KDC 분포 막대 */}
      <ul className="space-y-1.5">
        {KDC_KEYS.map((k) => {
          const count = stats.counts[k]
          const isEmpty = count === 0
          const pct = (count / stats.maxCount) * 100
          return (
            <li
              key={k}
              className={`flex items-center gap-2 text-xs transition ${
                isEmpty ? 'opacity-40' : ''
              }`}
            >
              <span className="w-14 shrink-0 truncate text-stone-600 sm:w-16">
                <span className="mr-1 text-[10px] text-stone-400 tabular-nums">
                  {k}
                </span>
                {KDC_LABEL[k]}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-amber-100/70 ring-1 ring-amber-200/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
              <span className="w-9 shrink-0 text-right tabular-nums text-stone-700">
                {count}권
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/75 px-2 py-2 text-center ring-1 ring-amber-100">
      <div className="text-base font-bold text-stone-800 tabular-nums sm:text-lg">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-stone-500">{label}</div>
    </div>
  )
}
