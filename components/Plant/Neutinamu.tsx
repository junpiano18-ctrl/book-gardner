import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  trunk: '#6b4423',
  trunkLight: '#8e5d33',
  trunkShadow: '#4a2e16',
  canopy: '#4a8c3a',
  canopyLight: '#7bb061',
  canopyShade: '#2f6a26',
}

export function Neutinamu({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`느티나무 ${stage} 단계`}
    >
      <Pot />
      {stage === 'seed' && <Seed />}
      {stage === 'sprout' && <Sprout />}
      {stage === 'growing' && <Growing />}
      {stage === 'bloom' && <Bloom />}
    </svg>
  )
}

function Sprout() {
  return (
    <g>
      <path d="M 60 100 L 60 80" stroke={COLOR.trunk} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="60" cy="76" r="9" fill={COLOR.canopy} />
      <circle cx="56" cy="73" r="3" fill={COLOR.canopyLight} opacity="0.7" />
    </g>
  )
}

function Growing() {
  return (
    <g>
      <path d="M 60 100 L 60 66" stroke={COLOR.trunk} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 60 78 L 50 68" stroke={COLOR.trunk} strokeWidth="2" strokeLinecap="round" />
      <path d="M 60 76 L 70 66" stroke={COLOR.trunk} strokeWidth="2" strokeLinecap="round" />

      <ellipse cx="48" cy="62" rx="10" ry="8" fill={COLOR.canopyShade} />
      <ellipse cx="72" cy="60" rx="11" ry="9" fill={COLOR.canopyShade} />
      <ellipse cx="60" cy="56" rx="13" ry="10" fill={COLOR.canopy} />
      <ellipse cx="50" cy="60" rx="9" ry="7" fill={COLOR.canopy} />
      <ellipse cx="70" cy="58" rx="10" ry="8" fill={COLOR.canopy} />

      <ellipse cx="55" cy="52" rx="4" ry="3" fill={COLOR.canopyLight} opacity="0.6" />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      <path d="M 60 100 L 60 64" stroke={COLOR.trunk} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 58 78 L 42 60" stroke={COLOR.trunk} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 62 76 L 78 56" stroke={COLOR.trunk} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 60 72 L 70 64" stroke={COLOR.trunkLight} strokeWidth="1.6" strokeLinecap="round" />

      <ellipse cx="40" cy="56" rx="13" ry="11" fill={COLOR.canopyShade} />
      <ellipse cx="80" cy="52" rx="14" ry="12" fill={COLOR.canopyShade} />
      <ellipse cx="60" cy="46" rx="17" ry="14" fill={COLOR.canopy} />
      <ellipse cx="44" cy="54" rx="12" ry="10" fill={COLOR.canopy} />
      <ellipse cx="76" cy="50" rx="13" ry="11" fill={COLOR.canopy} />

      <ellipse cx="54" cy="40" rx="7" ry="4.5" fill={COLOR.canopyLight} opacity="0.7" />
      <ellipse cx="72" cy="46" rx="5" ry="3.2" fill={COLOR.canopyLight} opacity="0.6" />
      <ellipse cx="42" cy="48" rx="4" ry="2.6" fill={COLOR.canopyLight} opacity="0.5" />
    </g>
  )
}
