import type { PlantStage } from '@/types'

interface HalmiggotProps {
  stage: PlantStage
  size?: number
  className?: string
}

const COLOR = {
  potBody: '#c97c5d',
  potShade: '#a86a4a',
  potHighlight: '#e89476',
  rimShade: '#7a4a2f',
  soil: '#3e2818',
  soilSpeck: '#5a3923',
  seed: '#7a4a23',
  seedHighlight: '#a87447',
  stem: '#4d8a3a',
  stemLight: '#7bb061',
  leaf: '#6db84a',
  leafHighlight: '#a8dc85',
  flowerBack: '#a987c9',
  flowerFront: '#c8b4e0',
  flowerHighlight: '#ede0f5',
  flowerCenter: '#f4d03f',
  flowerCenterHi: '#fef5c4',
  fuzz: '#9bb78a',
}

export function Halmiggot({ stage, size = 140, className }: HalmiggotProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`할미꽃 ${stage} 단계`}
    >
      {stage !== 'seed' && <Plant stage={stage} />}
      <Pot />
      {stage === 'seed' && <Seed />}
    </svg>
  )
}

function Pot() {
  return (
    <g>
      {/* ground shadow */}
      <ellipse cx="60" cy="135" rx="36" ry="3" fill="#000" opacity="0.08" />

      {/* pot body (trapezoid) */}
      <path
        d="M 30 102 L 90 102 L 82 132 L 38 132 Z"
        fill={COLOR.potBody}
      />

      {/* body highlight */}
      <path
        d="M 33 104 L 36 130 L 39 130 L 36 104 Z"
        fill={COLOR.potHighlight}
        opacity="0.55"
      />

      {/* pot rim */}
      <ellipse cx="60" cy="102" rx="30" ry="5.5" fill={COLOR.potShade} />

      {/* rim inner shadow */}
      <ellipse cx="60" cy="102" rx="27" ry="4.2" fill={COLOR.rimShade} />

      {/* soil */}
      <ellipse cx="60" cy="101.5" rx="25" ry="3.4" fill={COLOR.soil} />

      {/* soil specks */}
      <circle cx="50" cy="101" r="0.9" fill={COLOR.soilSpeck} opacity="0.7" />
      <circle cx="66" cy="102" r="0.7" fill={COLOR.soilSpeck} opacity="0.7" />
      <circle cx="58" cy="102.5" r="0.6" fill={COLOR.soilSpeck} opacity="0.7" />
    </g>
  )
}

function Seed() {
  return (
    <g>
      {/* seed body */}
      <ellipse cx="60" cy="98" rx="6.5" ry="5.5" fill={COLOR.seed} />
      {/* seed highlight */}
      <ellipse cx="57.5" cy="95.5" rx="2.6" ry="1.5" fill={COLOR.seedHighlight} />
      {/* base shadow */}
      <ellipse cx="60" cy="101" rx="5.5" ry="1.2" fill="#000" opacity="0.15" />
    </g>
  )
}

function Plant({ stage }: { stage: PlantStage }) {
  if (stage === 'sprout') return <Sprout />
  if (stage === 'growing') return <Growing />
  if (stage === 'bloom') return <Bloom />
  return null
}

function Sprout() {
  return (
    <g>
      {/* stem */}
      <path
        d="M 60 100 Q 60 88 60 78"
        stroke={COLOR.stem}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* left leaf */}
      <g transform="rotate(-32 54 80)">
        <ellipse cx="54" cy="80" rx="7" ry="3.2" fill={COLOR.leaf} />
        <ellipse cx="53" cy="79" rx="2.5" ry="1" fill={COLOR.leafHighlight} opacity="0.8" />
      </g>
      {/* right leaf */}
      <g transform="rotate(32 66 80)">
        <ellipse cx="66" cy="80" rx="7" ry="3.2" fill={COLOR.leaf} />
        <ellipse cx="67" cy="79" rx="2.5" ry="1" fill={COLOR.leafHighlight} opacity="0.8" />
      </g>
    </g>
  )
}

function Growing() {
  return (
    <g>
      {/* stem */}
      <path
        d="M 60 100 Q 59 75 60 50"
        stroke={COLOR.stem}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* lower pair */}
      <g transform="rotate(-38 50 84)">
        <ellipse cx="50" cy="84" rx="9.5" ry="4.5" fill={COLOR.leaf} />
        <ellipse cx="48" cy="82.5" rx="3.5" ry="1.4" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>
      <g transform="rotate(38 70 84)">
        <ellipse cx="70" cy="84" rx="9.5" ry="4.5" fill={COLOR.leaf} />
        <ellipse cx="72" cy="82.5" rx="3.5" ry="1.4" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>

      {/* upper pair */}
      <g transform="rotate(-32 53 62)">
        <ellipse cx="53" cy="62" rx="6.5" ry="3" fill={COLOR.leaf} />
        <ellipse cx="52" cy="61" rx="2.2" ry="0.9" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>
      <g transform="rotate(32 67 62)">
        <ellipse cx="67" cy="62" rx="6.5" ry="3" fill={COLOR.leaf} />
        <ellipse cx="68" cy="61" rx="2.2" ry="0.9" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>

      {/* tiny bud */}
      <ellipse cx="60" cy="50" rx="3" ry="3.6" fill="#8c7aa6" />
      <ellipse cx="59" cy="49" rx="1.2" ry="1.6" fill="#b9aacf" opacity="0.8" />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      {/* main stem with slight bend at top */}
      <path
        d="M 60 100 Q 59 72 58 50 Q 56 44 52 41"
        stroke={COLOR.stem}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* fuzzy stem hairs */}
      <line x1="58" y1="78" x2="55" y2="76" stroke={COLOR.fuzz} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="60" y1="70" x2="63" y2="68" stroke={COLOR.fuzz} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="58" y1="60" x2="55" y2="58" stroke={COLOR.fuzz} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="59" y1="52" x2="62" y2="50" stroke={COLOR.fuzz} strokeWidth="0.8" strokeLinecap="round" />

      {/* leaves - lower pair */}
      <g transform="rotate(-38 50 86)">
        <ellipse cx="50" cy="86" rx="10" ry="4.8" fill={COLOR.leaf} />
        <ellipse cx="48" cy="84" rx="3.8" ry="1.5" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>
      <g transform="rotate(38 70 86)">
        <ellipse cx="70" cy="86" rx="10" ry="4.8" fill={COLOR.leaf} />
        <ellipse cx="72" cy="84" rx="3.8" ry="1.5" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>

      {/* leaves - upper pair */}
      <g transform="rotate(-32 53 64)">
        <ellipse cx="53" cy="64" rx="7" ry="3.2" fill={COLOR.leaf} />
        <ellipse cx="52" cy="63" rx="2.4" ry="1" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>
      <g transform="rotate(32 67 64)">
        <ellipse cx="67" cy="64" rx="7" ry="3.2" fill={COLOR.leaf} />
        <ellipse cx="68" cy="63" rx="2.4" ry="1" fill={COLOR.leafHighlight} opacity="0.7" />
      </g>

      {/* drooping flower */}
      <g transform="translate(52 41) rotate(-25)">
        {/* back petals */}
        <path
          d="M -9 -2 Q -11 -10 0 -11 Q 11 -10 9 -2 Z"
          fill={COLOR.flowerBack}
        />
        {/* outer petals layer */}
        <path
          d="M -10 0 Q -12 -6 -4 -9 L 0 -7 L 4 -9 Q 12 -6 10 0 Q 6 8 0 9 Q -6 8 -10 0 Z"
          fill={COLOR.flowerFront}
        />
        {/* petal separator lines */}
        <path d="M -5 -8 Q -4 0 -3 7" stroke={COLOR.flowerBack} strokeWidth="0.6" fill="none" opacity="0.7" />
        <path d="M 5 -8 Q 4 0 3 7" stroke={COLOR.flowerBack} strokeWidth="0.6" fill="none" opacity="0.7" />
        <path d="M 0 -9 Q 0 0 0 9" stroke={COLOR.flowerBack} strokeWidth="0.5" fill="none" opacity="0.5" />
        {/* highlight */}
        <ellipse cx="-3" cy="-3" rx="3.5" ry="2" fill={COLOR.flowerHighlight} opacity="0.7" />
        {/* center (yellow stamen) */}
        <circle cx="0" cy="2" r="2.4" fill={COLOR.flowerCenter} />
        <circle cx="-0.7" cy="1.2" r="0.9" fill={COLOR.flowerCenterHi} />
      </g>
    </g>
  )
}
