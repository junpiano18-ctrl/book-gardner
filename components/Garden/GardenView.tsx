'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlantIllustration,
  hasPlantIllustration,
} from '@/components/Plant/PlantIllustration'
import { TOTAL_WATERS_TO_BLOOM, WATERING_POINTS } from '@/lib/garden'
import { KDC_PLANT_MAP } from '@/lib/plants'
import type { KdcPlant, PlantStage, PlantWithBook } from '@/types'

// ============================================================
// 온실 서가 (Greenhouse Library)
//
// - 위: 온실 유리 천장 헤더 (격자 패턴)
// - 아래: KDC 분야별 "선반" 구역 세로 스택
//   · 각 구역 = 분야 라벨 + 권수 + 화분 격자(grid)
//   · 모바일 3열 → 데스크탑 6열까지 자동 확장
// - 시간대: 낮/밤 두 모드
//   · 밤은 어두운 남색 배경 + 화분 주변 따뜻한 노란 글로우 (가독성 우선)
// - 화분 클릭 시 onSelect 호출 (기존 동작 유지)
// ============================================================

const STAGE_EMOJI: Record<PlantStage, string> = {
  seed: '🌰',
  sprout: '🌱',
  growing: '🌿',
  bloom: '🌸',
}

const STAGE_LABEL: Record<PlantStage, string> = {
  seed: '씨앗',
  sprout: '새싹',
  growing: '성장',
  bloom: '개화',
}

// ============================================================
// KDC 분야 → 구역 정의
//   책이 한 KDC 코드로 들어오면 첫 자리로 구역에 매핑
// ============================================================
interface SectionDef {
  id: string
  emoji: string
  name: string
  kdcCodes: readonly string[]
}

const SECTIONS: readonly SectionDef[] = [
  { id: 'lit', emoji: '📖', name: '문학', kdcCodes: ['8'] },
  { id: 'phi', emoji: '🤔', name: '철학·종교', kdcCodes: ['1', '2'] },
  { id: 'soc', emoji: '🏛️', name: '사회·역사', kdcCodes: ['3', '9'] },
  { id: 'sci', emoji: '🔬', name: '자연과학', kdcCodes: ['4'] },
  { id: 'tech', emoji: '🛠️', name: '기술', kdcCodes: ['5'] },
  { id: 'art', emoji: '🎨', name: '예술', kdcCodes: ['6'] },
  { id: 'lang', emoji: '🗣️', name: '언어', kdcCodes: ['7'] },
  { id: 'misc', emoji: '📚', name: '총류', kdcCodes: ['0'] },
] as const

const MISC_SECTION = SECTIONS[SECTIONS.length - 1]

function getSectionForKdc(kdc: string | null | undefined): SectionDef {
  const first = (kdc ?? '').charAt(0)
  return SECTIONS.find((s) => s.kdcCodes.includes(first)) ?? MISC_SECTION
}

// ============================================================

interface GardenViewProps {
  plants: PlantWithBook[]
  onSelect?: (p: PlantWithBook) => void
  // 호환성 — 새 디자인에선 사용 안 함 (물주기는 /shelf 에서)
  onWater?: (p: PlantWithBook) => void
}

export function GardenView({ plants, onSelect }: GardenViewProps) {
  const router = useRouter()

  // SSR 안전: 시간대는 마운트 후 결정 (서버는 'day' 기본)
  const [isNight, setIsNight] = useState(false)
  useEffect(() => {
    const h = new Date().getHours()
    setIsNight(h < 6 || h >= 19)
  }, [])

  // 진행 중인 화분만 — 완독은 도감으로
  const active = useMemo(() => plants.filter((p) => !p.completed_at), [plants])

  // 분야별 그룹핑 + 책 있는 구역만, 정의 순서대로
  const populated = useMemo(() => {
    const buckets = new Map<string, PlantWithBook[]>()
    for (const s of SECTIONS) buckets.set(s.id, [])
    for (const p of active) {
      const sect = getSectionForKdc(p.kdc_code)
      buckets.get(sect.id)!.push(p)
    }
    return SECTIONS.map((section) => ({
      section,
      plants: buckets.get(section.id) ?? [],
    })).filter((g) => g.plants.length > 0)
  }, [active])

  const isEmpty = active.length === 0

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-[0_10px_30px_-12px_rgba(40,60,40,0.45)] transition-colors"
      style={{
        background: isNight
          ? 'linear-gradient(180deg, #0e1a36 0%, #16224a 45%, #1c2b58 100%)'
          : 'linear-gradient(180deg, #fbf3dc 0%, #f5e9c0 55%, #ecdaa0 100%)',
        minHeight: 420,
      }}
    >
      {/* 우상단 — 작은 시간대 표식만 (천장 빗금 띠는 제거) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 z-[2] text-[10px] font-medium sm:right-5 sm:top-4"
        style={{ color: isNight ? '#cfd8f0' : '#8a6e3a' }}
      >
        <span className="mr-1">{isNight ? '🌙' : '☀️'}</span>
        {isNight ? '저녁의 온실' : '낮의 온실'}
      </div>

      {/* 본문 — 천장 제거에 맞춰 상단 패딩 정상화 */}
      <div className="relative z-[1] px-3 pb-6 pt-4 sm:px-5 sm:pt-5">
        {isEmpty ? (
          <EmptyGreenhouse
            isNight={isNight}
            onPlant={() => router.push('/search')}
          />
        ) : (
          <div className="space-y-5">
            {populated.map(({ section, plants: sectPlants }) => (
              <ShelfSection
                key={section.id}
                section={section}
                plants={sectPlants}
                isNight={isNight}
                onSelect={onSelect}
              />
            ))}
            <PlantMoreCTA
              isNight={isNight}
              onClick={() => router.push('/search')}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 구역 헤더 — 분야명 + 권수 + 대표 식물(이름·의미)
// 한 KDC 만 묶인 구역: 식물명 — 의미 한 줄
// 두 KDC 묶인 구역(철학·종교, 사회·역사): 식물 이름만 나란히
// ============================================================
function SectionHeader({
  section,
  bookCount,
  isNight,
}: {
  section: SectionDef
  bookCount: number
  isNight: boolean
}) {
  const sectPlants: KdcPlant[] = section.kdcCodes
    .map((k) => KDC_PLANT_MAP[k])
    .filter((p): p is KdcPlant => !!p)
  const single = sectPlants.length === 1
  const titleColor = isNight ? '#f1ead8' : '#5c4a26'
  const subColor = isNight ? '#d4cab0' : '#7a6238'
  const meaningColor = isNight ? '#c9bda0' : '#8a7048'

  return (
    <header className="px-3 pt-3 sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <h3
          className="flex items-center gap-1.5 text-sm font-bold sm:text-base"
          style={{ color: titleColor }}
        >
          <span aria-hidden>{section.emoji}</span>
          <span>{section.name}</span>
        </h3>
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: meaningColor }}
        >
          {bookCount}권
        </span>
      </div>

      {sectPlants.length > 0 && (
        <p
          className="mt-0.5 line-clamp-2 text-[11px] leading-snug sm:text-[12px]"
          style={{ color: subColor }}
        >
          {single ? (
            <>
              <span className="font-semibold">{sectPlants[0].name}</span>
              <span style={{ color: meaningColor }}>
                {' — '}
                {sectPlants[0].meaning}
              </span>
            </>
          ) : (
            <span className="font-semibold">
              {sectPlants.map((p) => p.name).join(' · ')}
            </span>
          )}
        </p>
      )}
    </header>
  )
}

// ============================================================
// 분야 선반 — 라벨 헤더 + 화분 격자 + 나무 선반 바닥
// ============================================================
function ShelfSection({
  section,
  plants,
  isNight,
  onSelect,
}: {
  section: SectionDef
  plants: PlantWithBook[]
  isNight: boolean
  onSelect?: (p: PlantWithBook) => void
}) {
  return (
    <section
      className="rounded-xl"
      style={{
        backgroundColor: isNight
          ? 'rgba(22,32,68,0.55)'
          : 'rgba(255,251,234,0.55)',
        boxShadow: isNight
          ? 'inset 0 0 0 1px rgba(160,180,230,0.14), 0 0 22px rgba(255,180,80,0.05)'
          : 'inset 0 0 0 1px rgba(160,140,90,0.18)',
      }}
    >
      {/* 분야 라벨 + 대표 식물 (이름·의미) */}
      <SectionHeader
        section={section}
        bookCount={plants.length}
        isNight={isNight}
      />

      {/* 화분 격자 — 칸 너비 타이트하게: 모바일 3열, sm 5, md 7, lg 8 */}
      <ul className="grid grid-cols-3 gap-1.5 px-2 pb-1 pt-2 sm:grid-cols-5 sm:gap-2 sm:px-3 md:grid-cols-7 lg:grid-cols-8">
        {plants.map((p) => (
          <PotTile key={p.id} plant={p} isNight={isNight} onSelect={onSelect} />
        ))}
      </ul>

      {/* 나무 선반 바닥 */}
      <div
        className="mt-1 h-2 rounded-b-xl"
        style={{
          background: isNight
            ? 'linear-gradient(180deg, #3a2c1a 0%, #251a0e 100%)'
            : 'linear-gradient(180deg, #8b6f4e 0%, #6b4f2e 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      />
    </section>
  )
}

// ============================================================
// 화분 타일 — 격자 칸 안에서 안 겹치게
// ============================================================
function PotTile({
  plant,
  isNight,
  onSelect,
}: {
  plant: PlantWithBook
  isNight: boolean
  onSelect?: (p: PlantWithBook) => void
}) {
  const hasSvg = hasPlantIllustration(plant.kdc_code)
  const waters = Math.min(
    TOTAL_WATERS_TO_BLOOM,
    Math.floor(plant.growth_point / WATERING_POINTS)
  )
  const clickable = !!onSelect

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={() => onSelect?.(plant)}
        disabled={!clickable}
        aria-label={`${plant.book.title} 상세 열기 · ${STAGE_LABEL[plant.stage]} · ${waters}/${TOTAL_WATERS_TO_BLOOM}회`}
        className={`group relative flex w-full flex-col items-center rounded-xl px-0.5 pt-2 pb-1.5 transition active:scale-[0.97] disabled:cursor-default sm:px-1 sm:pt-2.5 ${
          clickable ? 'cursor-pointer' : ''
        }`}
        style={{
          backgroundColor: isNight
            ? 'rgba(40,30,15,0.32)'
            : 'rgba(255,255,255,0.45)',
          boxShadow: isNight
            ? // 밤: 따뜻한 노란 글로우 + 안쪽 골든 링
              '0 0 18px 2px rgba(255, 180, 80, 0.18), inset 0 0 0 1px rgba(255,200,120,0.18)'
            : 'inset 0 0 0 1px rgba(160,140,90,0.18)',
        }}
      >
        {/* 식물 일러스트 — 격자 칸 안에 안정적으로 */}
        <div className="flex h-16 items-end sm:h-20">
          {hasSvg ? (
            <PlantIllustration
              kdcCode={plant.kdc_code}
              stage={plant.stage}
              size={64}
            />
          ) : (
            <div
              className="text-4xl leading-none"
              aria-label={STAGE_LABEL[plant.stage]}
              role="img"
            >
              {STAGE_EMOJI[plant.stage]}
            </div>
          )}
        </div>

        {/* 진행도 점 (10단계) — 칸 너비 좁아도 안 넘치게 gap 축소 */}
        <div className="mt-1 flex max-w-full items-center gap-[2px]">
          {Array.from({ length: TOTAL_WATERS_TO_BLOOM }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="h-1 w-1 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  i < waters
                    ? isNight
                      ? '#fbbf24' // 밤: 따뜻한 호박색
                      : '#10b981' // 낮: 산뜻한 에메랄드
                    : isNight
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(0,0,0,0.15)',
              }}
            />
          ))}
        </div>

        {/* 책 제목 — 최대 2줄. min-height 로 카드 높이 정렬 보장.
            line-clamp-2 가 2줄 넘으면 자동 … 처리 */}
        <div
          className="mt-1.5 w-full break-keep text-center text-[11px] font-medium leading-tight sm:text-[12px]"
          style={{
            color: isNight ? '#f6efdb' : '#3a2e18',
            textShadow: isNight ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
            // line-clamp: 2 — Tailwind 의 line-clamp-2 와 동일
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            // 2줄 높이 확보 (11px * 1.25 leading * 2) — 1줄 짜리도 같은 높이
            minHeight: '2.5em',
          }}
          title={plant.book.title}
        >
          {plant.book.title}
        </div>
      </button>
    </li>
  )
}

// ============================================================
// 빈 온실 상태 — 책 0권일 때
// ============================================================
function EmptyGreenhouse({
  isNight,
  onPlant,
}: {
  isNight: boolean
  onPlant: () => void
}) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl py-14 text-center"
      style={{
        backgroundColor: isNight
          ? 'rgba(22,32,68,0.5)'
          : 'rgba(255,251,234,0.65)',
        boxShadow: isNight
          ? 'inset 0 0 0 1px rgba(160,180,230,0.14)'
          : 'inset 0 0 0 1px rgba(160,140,90,0.18)',
      }}
    >
      <div className="text-5xl">🪴</div>
      <p
        className="mt-3 text-sm font-medium sm:text-base"
        style={{ color: isNight ? '#f1ead8' : '#5c4a26' }}
      >
        아직 비어 있는 온실
      </p>
      <p
        className="mt-1 text-xs"
        style={{ color: isNight ? '#b9ad8e' : '#8a7048' }}
      >
        첫 번째 씨앗을 심어보세요
      </p>
      <button
        type="button"
        onClick={onPlant}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
      >
        🌱 책 심으러 가기
      </button>
    </div>
  )
}

// ============================================================
// 하단 — 더 심기 CTA
// ============================================================
function PlantMoreCTA({
  isNight,
  onClick,
}: {
  isNight: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-medium transition ${
        isNight
          ? 'border-amber-300/30 text-amber-200/85 hover:bg-amber-400/5'
          : 'border-amber-400/40 text-amber-800/80 hover:bg-amber-100/40'
      }`}
    >
      <span aria-hidden>+</span>
      <span>새 책 심기</span>
    </button>
  )
}
