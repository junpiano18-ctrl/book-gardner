import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  stem: '#4d8a3a',
  leaf: '#6db84a',
  leafLight: '#a8dc85',
  petal: '#fefcf3',
  petalShade: '#ece4c2',
  petalEdge: '#d8cf9b',
  center: '#f4d03f',
  centerHi: '#fef5c4',
  bud: '#d9d0a8',
}

export function Gujulcho({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`구절초 ${stage} 단계`}
    >
      <Pot kdcCode="4" />
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
      <path d="M 60 100 Q 60 88 60 80" stroke={COLOR.stem} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <g transform="rotate(-32 53 83)">
        <ellipse cx="53" cy="83" rx="6" ry="2.8" fill={COLOR.leaf} />
        <ellipse cx="52" cy="82" rx="2" ry="0.9" fill={COLOR.leafLight} opacity="0.7" />
      </g>
      <g transform="rotate(32 67 83)">
        <ellipse cx="67" cy="83" rx="6" ry="2.8" fill={COLOR.leaf} />
        <ellipse cx="68" cy="82" rx="2" ry="0.9" fill={COLOR.leafLight} opacity="0.7" />
      </g>
    </g>
  )
}

function Growing() {
  return (
    <g>
      <path d="M 60 100 Q 60 70 60 56" stroke={COLOR.stem} strokeWidth="2.3" strokeLinecap="round" fill="none" />

      <g transform="rotate(-38 50 84)">
        <path d="M 42 84 Q 46 80 50 82 Q 56 84 58 84 Q 54 88 50 87 Q 46 88 42 84 Z" fill={COLOR.leaf} />
        <ellipse cx="49" cy="83" rx="2" ry="0.9" fill={COLOR.leafLight} opacity="0.7" />
      </g>
      <g transform="rotate(38 70 84)">
        <path d="M 62 84 Q 64 84 70 82 Q 74 80 78 84 Q 74 88 70 87 Q 66 88 62 84 Z" fill={COLOR.leaf} />
        <ellipse cx="71" cy="83" rx="2" ry="0.9" fill={COLOR.leafLight} opacity="0.7" />
      </g>

      <g transform="rotate(-30 54 68)">
        <ellipse cx="54" cy="68" rx="5" ry="2.3" fill={COLOR.leaf} />
      </g>
      <g transform="rotate(30 66 68)">
        <ellipse cx="66" cy="68" rx="5" ry="2.3" fill={COLOR.leaf} />
      </g>

      <circle cx="60" cy="55" r="4" fill={COLOR.bud} />
      <ellipse cx="58.5" cy="53.5" rx="1.4" ry="2" fill={COLOR.petal} opacity="0.6" />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      <path d="M 60 100 Q 60 70 60 50" stroke={COLOR.stem} strokeWidth="2.3" strokeLinecap="round" fill="none" />

      <g transform="rotate(-38 48 86)">
        <path d="M 40 86 Q 44 82 48 84 Q 54 86 58 86 Q 54 90 48 89 Q 44 90 40 86 Z" fill={COLOR.leaf} />
        <ellipse cx="48" cy="85" rx="2.2" ry="1" fill={COLOR.leafLight} opacity="0.7" />
      </g>
      <g transform="rotate(38 72 86)">
        <path d="M 62 86 Q 64 86 72 84 Q 76 82 80 86 Q 76 90 72 89 Q 66 90 62 86 Z" fill={COLOR.leaf} />
        <ellipse cx="72" cy="85" rx="2.2" ry="1" fill={COLOR.leafLight} opacity="0.7" />
      </g>

      <g transform="rotate(-30 52 66)">
        <ellipse cx="52" cy="66" rx="5.5" ry="2.4" fill={COLOR.leaf} />
      </g>
      <g transform="rotate(30 68 66)">
        <ellipse cx="68" cy="66" rx="5.5" ry="2.4" fill={COLOR.leaf} />
      </g>

      <g transform="translate(60 46)">
        {/* daisy petals — 8 ellipses around center */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = i * 45
          return (
            <g key={i} transform={`rotate(${angle})`}>
              <ellipse cx="0" cy="-8" rx="3" ry="6" fill={COLOR.petal} />
              <ellipse cx="0" cy="-9" rx="1.2" ry="3" fill="#ffffff" opacity="0.7" />
              <ellipse cx="0" cy="-5.5" rx="2.4" ry="1" fill={COLOR.petalEdge} opacity="0.3" />
            </g>
          )
        })}
        <circle cx="0" cy="0" r="3.5" fill={COLOR.center} />
        <circle cx="-1" cy="-1" r="1.2" fill={COLOR.centerHi} />
      </g>
    </g>
  )
}
