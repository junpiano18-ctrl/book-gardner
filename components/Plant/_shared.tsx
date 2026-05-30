import type { PlantStage } from '@/types'

export interface PlantSvgProps {
  stage: PlantStage
  size?: number
  className?: string
}

// KDC 별 화분 베이스 색상
const POT_BASE_BY_KDC: Record<string, string> = {
  '0': '#a8a8a0', // 솔이끼 - 회색
  '1': '#b87850', // 할미꽃 - 적갈색 (기본 톤)
  '2': '#7a9aa8', // 연꽃   - 청자색
  '3': '#8a6a4a', // 느티나무 - 짙은 갈색
  '4': '#c8a888', // 구절초 - 베이지
  '5': '#7a9a8a', // 대나무 - 청록
  '6': '#c89898', // 진달래 - 분홍 토기
  '7': '#e8e0d4', // 으아리 - 흰색
  '8': '#a87858', // 매화   - 따뜻한 갈색
  '9': '#8a7050', // 소나무 - 진한 황토
}

const DEFAULT_POT_BASE = '#c97c5d'

// hex 를 amount(-1..1)만큼 밝게/어둡게
function shadeHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const num = parseInt(clean, 16)
  if (Number.isNaN(num)) return hex
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff
  if (amount >= 0) {
    r = Math.round(r + (255 - r) * amount)
    g = Math.round(g + (255 - g) * amount)
    b = Math.round(b + (255 - b) * amount)
  } else {
    const f = 1 + amount
    r = Math.round(r * f)
    g = Math.round(g * f)
    b = Math.round(b * f)
  }
  return (
    '#' +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
      .join('')
  )
}

function derivePotColors(base: string) {
  return {
    body: base,
    shade: shadeHex(base, -0.2),
    highlight: shadeHex(base, 0.25),
    rimShade: shadeHex(base, -0.4),
    soil: '#3e2818',
    soilSpeck: '#5a3923',
  }
}

// 기존 export 호환 (기본 색상)
export const POT_COLOR = derivePotColors(DEFAULT_POT_BASE)

export function Pot({ kdcCode }: { kdcCode?: string } = {}) {
  const base =
    (kdcCode && POT_BASE_BY_KDC[kdcCode.charAt(0)]) || DEFAULT_POT_BASE
  const c = derivePotColors(base)
  return (
    <g>
      <ellipse cx="60" cy="135" rx="36" ry="3" fill="#000" opacity="0.08" />
      <path d="M 30 102 L 90 102 L 82 132 L 38 132 Z" fill={c.body} />
      <path
        d="M 33 104 L 36 130 L 39 130 L 36 104 Z"
        fill={c.highlight}
        opacity="0.55"
      />
      <ellipse cx="60" cy="102" rx="30" ry="5.5" fill={c.shade} />
      <ellipse cx="60" cy="102" rx="27" ry="4.2" fill={c.rimShade} />
      <ellipse cx="60" cy="101.5" rx="25" ry="3.4" fill={c.soil} />
      <circle cx="50" cy="101" r="0.9" fill={c.soilSpeck} opacity="0.7" />
      <circle cx="66" cy="102" r="0.7" fill={c.soilSpeck} opacity="0.7" />
      <circle cx="58" cy="102.5" r="0.6" fill={c.soilSpeck} opacity="0.7" />
    </g>
  )
}

// 갓 심은 자리 — 봉긋한 흙 위로 막 터지려는 작은 새싹 점
export function Seed() {
  return (
    <g>
      {/* 흙 봉긋 (살짝 솟은) */}
      <ellipse cx="60" cy="100" rx="9" ry="3" fill="#3e2818" />
      <ellipse cx="60" cy="99" rx="6.5" ry="1.8" fill="#5a3923" opacity="0.7" />
      {/* 작은 연두 새싹 점 (터지려는 느낌) */}
      <ellipse cx="60" cy="96.5" rx="1.6" ry="2.2" fill="#7eb050" />
      <ellipse cx="59.4" cy="95.5" rx="0.8" ry="1.2" fill="#a8dc85" opacity="0.85" />
      {/* 아주 작은 떡잎 갈라짐 (좌우 살짝) */}
      <ellipse cx="58.4" cy="96.6" rx="1.1" ry="0.7" fill="#7eb050" opacity="0.75" transform="rotate(-22 58.4 96.6)" />
      <ellipse cx="61.6" cy="96.6" rx="1.1" ry="0.7" fill="#7eb050" opacity="0.75" transform="rotate(22 61.6 96.6)" />
    </g>
  )
}
