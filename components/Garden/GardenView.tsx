'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlantIllustration,
  hasPlantIllustration,
} from '@/components/Plant/PlantIllustration'
import { TOTAL_WATERS_TO_BLOOM, WATERING_POINTS } from '@/lib/garden'
import type { PlantStage, PlantWithBook } from '@/types'

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
// 시간대별 하늘 팔레트
// ============================================================
type SkyTheme = 'dawn' | 'day' | 'sunset' | 'night'

const SKY_BG: Record<SkyTheme, string> = {
  dawn:
    'linear-gradient(to bottom, #fbcfa3 0%, #f4b08a 18%, #e8b2b8 38%, #c8d4e0 70%, #b8d0e0 100%)',
  day: 'linear-gradient(to bottom, #6cb6e8 0%, #92cbee 40%, #c0e0f3 100%)',
  sunset:
    'linear-gradient(to bottom, #ff8e5a 0%, #ec7a8a 28%, #a87aa6 56%, #6c5b8c 100%)',
  night: 'linear-gradient(to bottom, #0c1730 0%, #1a2348 45%, #2a3358 100%)',
}

// 하늘 영역이 0~38% 로 좁아진 만큼 해/달 위치 재조정
// dawn/sunset 은 산 능선 근처(지평선)에 낮게 걸리도록
const CELESTIAL: Record<
  SkyTheme,
  { color: string; glow: string; x: string; y: string }
> = {
  dawn: { color: '#ffd28a', glow: '255,210,138', x: '20%', y: '32%' },
  day: { color: '#ffe8a0', glow: '255,232,160', x: '78%', y: '10%' },
  sunset: { color: '#ffd0a0', glow: '255,200,160', x: '82%', y: '32%' },
  night: { color: '#e8e0c4', glow: '232,224,196', x: '76%', y: '10%' },
}

const STAR_POSITIONS = [
  { x: 8, y: 8, s: 2, d: 0 },
  { x: 18, y: 22, s: 1, d: 1.2 },
  { x: 32, y: 12, s: 2, d: 0.4 },
  { x: 45, y: 6, s: 1, d: 1.8 },
  { x: 58, y: 28, s: 1, d: 2.4 },
  { x: 64, y: 6, s: 2, d: 0.8 },
  { x: 88, y: 30, s: 1, d: 1.6 },
  { x: 12, y: 34, s: 1, d: 2.0 },
  { x: 92, y: 12, s: 1, d: 0.6 },
  { x: 50, y: 18, s: 1, d: 1.0 },
  { x: 38, y: 32, s: 1, d: 2.2 },
  { x: 72, y: 22, s: 2, d: 1.4 },
] as const

function getSkyTheme(hour: number): SkyTheme {
  if (hour >= 5 && hour < 10) return 'dawn'
  if (hour >= 10 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'sunset'
  return 'night'
}

// ============================================================
// 화분 슬롯 — 앞→뒤로 갈수록 y↓ scale↓ (공기 원근법)
// ============================================================
type Slot = { x: number; y: number; scale: number }

// 5층 부감 뷰: 하늘 좁고 바닥 넓음 (ground 영역 55-100%)
// 17개 슬롯 4행: 앞→뒤로 y↓ scale↓
const BASE_SLOTS: Slot[] = [
  // 앞줄 — scale 1.0 (가장 큼)
  { x: 12, y: 93, scale: 1.0 },
  { x: 30, y: 95, scale: 1.0 },
  { x: 50, y: 93, scale: 1.0 },
  { x: 70, y: 95, scale: 1.0 },
  { x: 88, y: 93, scale: 0.95 },
  // 둘째 줄 — scale 0.82
  { x: 18, y: 84, scale: 0.82 },
  { x: 38, y: 86, scale: 0.82 },
  { x: 58, y: 84, scale: 0.82 },
  { x: 80, y: 86, scale: 0.8 },
  // 셋째 줄 — scale 0.66
  { x: 24, y: 75, scale: 0.66 },
  { x: 44, y: 77, scale: 0.66 },
  { x: 64, y: 75, scale: 0.66 },
  { x: 82, y: 77, scale: 0.64 },
  // 뒷줄 — scale 0.52 (산 발치)
  { x: 30, y: 66, scale: 0.52 },
  { x: 50, y: 67, scale: 0.52 },
  { x: 70, y: 66, scale: 0.52 },
  { x: 84, y: 67, scale: 0.5 },
]

function getSlot(index: number): Slot {
  if (index < BASE_SLOTS.length) return BASE_SLOTS[index]
  // 슬롯 초과 시: 더 뒤쪽으로 스태거 배치 (스케일 점점 작게)
  const cycle = Math.floor(index / BASE_SLOTS.length)
  const base = BASE_SLOTS[index % BASE_SLOTS.length]
  const xJitter = ((cycle * 7) % 18) - 9
  return {
    x: Math.max(6, Math.min(94, base.x + xJitter)),
    y: Math.max(30, base.y - cycle * 4),
    scale: Math.max(0.45, base.scale - cycle * 0.08),
  }
}

// ============================================================

interface GardenViewProps {
  plants: PlantWithBook[]
  onSelect?: (p: PlantWithBook) => void
  // 호환성: 새 디자인에선 사용 안 함. 물주기는 /shelf 진입 후.
  onWater?: (p: PlantWithBook) => void
}

export function GardenView({ plants, onSelect }: GardenViewProps) {
  const router = useRouter()

  // SSR 안전: 마운트 후 시간대 결정 (서버는 'day' 디폴트)
  const [theme, setTheme] = useState<SkyTheme>('day')
  useEffect(() => {
    setTheme(getSkyTheme(new Date().getHours()))
  }, [])

  // 진행 중인 화분만 — 완독은 도감으로
  const active = useMemo(
    () => plants.filter((p) => !p.completed_at),
    [plants]
  )

  // book_id 기준 안정 정렬 → 슬롯 고정 (매번 안 바뀜)
  const assignments = useMemo(() => {
    const sorted = [...active].sort((a, b) =>
      a.book_id.localeCompare(b.book_id)
    )
    return sorted.map((plant, i) => ({ plant, slot: getSlot(i) }))
  }, [active])

  const celestial = CELESTIAL[theme]
  const isNight = theme === 'night'

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-[0_10px_30px_-12px_rgba(40,60,40,0.45)]"
      style={{
        height: 'min(72vh, 620px)',
        minHeight: 420,
        background: SKY_BG[theme],
      }}
    >
      {/* 별 (밤에만, 부드럽게 깜박임) */}
      {isNight && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {STAR_POSITIONS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.s,
                height: s.s,
                animation: `garden-star-twinkle 3.5s ease-in-out ${s.d}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* 해 / 달 */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-14 w-14 rounded-full sm:h-16 sm:w-16"
        style={{
          left: celestial.x,
          top: celestial.y,
          backgroundColor: celestial.color,
          boxShadow: `0 0 40px rgba(${celestial.glow}, ${isNight ? 0.45 : 0.55})`,
          opacity: 0.95,
        }}
      />

      {/* 산·언덕 SVG (뒤→앞 3단) — 좁은 띠로 압축 (38~60%)
          5층 부감 뷰에 맞춰 하늘과 잔디 사이 가는 능선 */}
      <svg
        aria-hidden
        className="absolute inset-x-0 w-full"
        style={{ top: '38%', height: '22%' }}
        viewBox="0 0 800 480"
        preserveAspectRatio="none"
      >
        {/* 먼 산 — 흐릿 청회색 */}
        <path
          d="M 0 240 L 60 180 L 130 220 L 210 160 L 280 200 L 360 150 L 440 210 L 520 170 L 600 200 L 700 160 L 800 200 L 800 480 L 0 480 Z"
          fill={isNight ? '#3a4860' : '#7a8aa0'}
          opacity={isNight ? 0.55 : 0.42}
        />
        {/* 중간 언덕 */}
        <path
          d="M 0 310 L 90 270 L 200 310 L 320 260 L 440 310 L 560 280 L 680 310 L 800 290 L 800 480 L 0 480 Z"
          fill={isNight ? '#2a4a3c' : '#6a8a6a'}
          opacity="0.72"
        />
        {/* 중간 언덕 작은 나무들 */}
        <g opacity={isNight ? 0.6 : 0.78}>
          <ellipse
            cx="180"
            cy="296"
            rx="6"
            ry="11"
            fill={isNight ? '#1a3328' : '#3e6a3e'}
          />
          <ellipse
            cx="350"
            cy="286"
            rx="5"
            ry="10"
            fill={isNight ? '#1a3328' : '#3e6a3e'}
          />
          <ellipse
            cx="540"
            cy="296"
            rx="6"
            ry="11"
            fill={isNight ? '#1a3328' : '#3e6a3e'}
          />
        </g>
        {/* 가까운 언덕 — 또렷한 짙은 초록 */}
        <path
          d="M 0 380 L 120 350 L 250 380 L 380 350 L 520 380 L 660 360 L 800 380 L 800 480 L 0 480 Z"
          fill={isNight ? '#1f3a2a' : '#4a7a4a'}
          opacity="0.92"
        />
      </svg>

      {/* 잔디 → 흙 (5층 부감: 바닥이 화면 절반) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: '45%',
          background: isNight
            ? 'linear-gradient(to bottom, rgba(40,72,52,0) 0%, rgba(40,72,52,0.7) 18%, rgba(34,58,42,0.92) 55%, rgba(30,22,14,1) 100%)'
            : 'linear-gradient(to bottom, rgba(110,156,92,0) 0%, rgba(110,156,92,0.7) 15%, rgba(90,134,72,0.92) 45%, rgba(122,90,58,0.96) 78%, rgba(74,58,42,1) 100%)',
        }}
      />

      {/* 자연 디테일 (3-5개, 너무 산만하지 않게) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span
          className="absolute text-sm"
          style={{ left: '4%', top: '96%' }}
        >
          🌾
        </span>
        <span
          className="absolute text-base"
          style={{ left: '94%', top: '94%' }}
        >
          🪨
        </span>
        <span
          className="absolute text-sm"
          style={{ left: '40%', top: '97%' }}
        >
          🌿
        </span>
        {!isNight && (
          <span
            className="absolute text-lg"
            style={{
              left: '55%',
              top: '28%',
              animation: 'garden-butterfly 6s ease-in-out infinite',
            }}
          >
            🦋
          </span>
        )}
      </div>

      {/* 화분 */}
      {assignments.map(({ plant, slot }) => (
        <Pot
          key={plant.id}
          plant={plant}
          slot={slot}
          onSelect={onSelect}
        />
      ))}

      {/* 빈 정원 안내 */}
      {active.length === 0 && (
        <div
          className="absolute inset-x-0 z-10 flex flex-col items-center px-6 text-center"
          style={{ top: '44%' }}
        >
          <p className="text-base font-medium text-stone-700 drop-shadow-sm sm:text-lg">
            🌱 씨앗을 한 톨 심어보세요
          </p>
          <p className="mt-1 text-xs text-stone-600/80 sm:text-sm">
            첫 책을 심으면 여기에 자라요
          </p>
        </div>
      )}

      {/* + 책 심기 (항상 우하단) */}
      <button
        type="button"
        onClick={() => router.push('/search')}
        className="absolute bottom-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-full bg-stone-900/85 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur transition hover:bg-stone-900 sm:bottom-4 sm:right-4"
      >
        + 책 심기
      </button>
    </div>
  )
}

function Pot({
  plant,
  slot,
  onSelect,
}: {
  plant: PlantWithBook
  slot: Slot
  onSelect?: (p: PlantWithBook) => void
}) {
  const size = Math.round(100 * slot.scale)
  const hasSvg = hasPlantIllustration(plant.kdc_code)
  const waters = Math.min(
    TOTAL_WATERS_TO_BLOOM,
    Math.floor(plant.growth_point / WATERING_POINTS)
  )
  // 앞에 있을수록(y큼) z-index 높게 → 자연스러운 가림
  const zIndex = Math.round(slot.y)

  return (
    <div
      className="group absolute cursor-pointer outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1"
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        transform: 'translate(-50%, -100%)',
        zIndex,
      }}
      role="button"
      tabIndex={0}
      aria-label={`${plant.book.title} 화분 열기`}
      onClick={() => onSelect?.(plant)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(plant)
        }
      }}
    >
      {/* 호버 진행도 (데스크탑) */}
      <div
        className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-stone-900/90 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
        style={{ top: -24 }}
      >
        💧 {waters}/{TOTAL_WATERS_TO_BLOOM} · {STAGE_LABEL[plant.stage]}
      </div>

      {/* 그림자 (화분 아래 타원) */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-black/30"
        style={{
          width: size * 0.62,
          height: 6 + 4 * slot.scale,
          bottom: -2,
          filter: 'blur(2.5px)',
        }}
      />

      {/* 식물 SVG */}
      {hasSvg ? (
        <PlantIllustration
          kdcCode={plant.kdc_code}
          stage={plant.stage}
          size={size}
        />
      ) : (
        <div
          style={{ fontSize: size * 0.65, lineHeight: 1 }}
          aria-label={STAGE_LABEL[plant.stage]}
          role="img"
        >
          {STAGE_EMOJI[plant.stage]}
        </div>
      )}

      {/* 책 제목 라벨 (항상 표시, 반투명 pill) */}
      <div
        className="absolute left-1/2 mt-1 max-w-[140px] -translate-x-1/2 truncate rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium text-stone-700 ring-1 ring-black/5 backdrop-blur whitespace-nowrap"
        style={{ top: '100%' }}
      >
        {plant.book.title}
      </div>
    </div>
  )
}
