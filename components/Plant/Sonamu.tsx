import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  trunk: '#6b4423',
  trunkLight: '#8e5d33',
  trunkShadow: '#4a2e16',
  needles: '#356929',
  needlesLight: '#5a8c3e',
  needlesDark: '#1f4719',
  needlesHi: '#7eb050',
  cone: '#8e5d33',
  coneDark: '#5a3923',
}

export function Sonamu({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`소나무 ${stage} 단계`}
    >
      <Pot kdcCode="9" />
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
      <path d="M 60 100 L 60 84" stroke={COLOR.trunk} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M 60 84 L 52 92 L 68 92 Z"
        fill={COLOR.needles}
      />
      <path d="M 60 84 L 54 90 L 66 90 Z" fill={COLOR.needlesLight} opacity="0.7" />
    </g>
  )
}

function Growing() {
  return (
    <g>
      <path d="M 60 100 L 60 60" stroke={COLOR.trunk} strokeWidth="3" strokeLinecap="round" />

      {/* layered triangular foliage */}
      <path
        d="M 60 60 L 46 80 L 74 80 Z"
        fill={COLOR.needlesDark}
      />
      <path
        d="M 60 64 L 48 78 L 72 78 Z"
        fill={COLOR.needles}
      />

      <path
        d="M 60 72 L 44 90 L 76 90 Z"
        fill={COLOR.needlesDark}
      />
      <path
        d="M 60 76 L 46 88 L 74 88 Z"
        fill={COLOR.needles}
      />

      {/* highlights */}
      <path d="M 60 68 L 54 76 L 60 78 Z" fill={COLOR.needlesLight} opacity="0.6" />
      <path d="M 60 80 L 52 86 L 60 88 Z" fill={COLOR.needlesLight} opacity="0.6" />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      <path d="M 60 100 L 60 48" stroke={COLOR.trunk} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 60 80 L 60 100" stroke={COLOR.trunkShadow} strokeWidth="1.2" opacity="0.6" />

      {/* three layers of foliage */}
      <path
        d="M 60 48 L 48 66 L 72 66 Z"
        fill={COLOR.needlesDark}
      />
      <path
        d="M 60 52 L 50 64 L 70 64 Z"
        fill={COLOR.needles}
      />
      <path d="M 60 56 L 55 62 L 60 64 Z" fill={COLOR.needlesLight} opacity="0.6" />

      <path
        d="M 60 60 L 44 80 L 76 80 Z"
        fill={COLOR.needlesDark}
      />
      <path
        d="M 60 64 L 46 78 L 74 78 Z"
        fill={COLOR.needles}
      />
      <path d="M 60 68 L 53 76 L 60 78 Z" fill={COLOR.needlesLight} opacity="0.6" />

      <path
        d="M 60 74 L 40 94 L 80 94 Z"
        fill={COLOR.needlesDark}
      />
      <path
        d="M 60 78 L 42 92 L 78 92 Z"
        fill={COLOR.needles}
      />
      <path d="M 60 82 L 50 90 L 60 92 Z" fill={COLOR.needlesLight} opacity="0.6" />

      {/* pine cones */}
      <ellipse cx="68" cy="76" rx="2.2" ry="3.2" fill={COLOR.cone} />
      <path d="M 68 73 L 68 79 M 66.5 75 L 69.5 75 M 66.5 77 L 69.5 77" stroke={COLOR.coneDark} strokeWidth="0.5" />

      <ellipse cx="52" cy="84" rx="2" ry="3" fill={COLOR.cone} />
      <path d="M 52 81 L 52 87 M 50.5 83 L 53.5 83 M 50.5 85 L 53.5 85" stroke={COLOR.coneDark} strokeWidth="0.5" />
    </g>
  )
}
