import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  vine: '#5a8c3e',
  vineLight: '#7eb050',
  leaf: '#6db84a',
  leafLight: '#a8dc85',
  leafDark: '#3e6529',
  petal: '#fefcf3',
  petalShade: '#e8e2c8',
  petalEdge: '#d4c89a',
  center: '#bba35b',
  centerHi: '#fef5c4',
}

export function Euari({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`으아리 ${stage} 단계`}
    >
      <Pot />
      {stage === 'seed' && <Seed />}
      {stage === 'sprout' && <Sprout />}
      {stage === 'growing' && <Growing />}
      {stage === 'bloom' && <Bloom />}
    </svg>
  )
}

function Leaf({ cx, cy, rotate, scale = 1 }: { cx: number; cy: number; rotate: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <path d="M 0 0 Q 5 -3.5 11 0 Q 5 3.5 0 0 Z" fill={COLOR.leaf} />
      <path d="M 1 0 L 10 0" stroke={COLOR.leafLight} strokeWidth="0.5" opacity="0.7" />
    </g>
  )
}

function StarFlower({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cx="0" cy="-5" rx="2" ry="5" fill={COLOR.petal} />
          <ellipse cx="0" cy="-6" rx="0.8" ry="2.5" fill="#ffffff" opacity="0.8" />
        </g>
      ))}
      <circle cx="0" cy="0" r="1.6" fill={COLOR.center} />
      <circle cx="-0.4" cy="-0.4" r="0.5" fill={COLOR.centerHi} />
    </g>
  )
}

function Sprout() {
  return (
    <g>
      <path
        d="M 60 100 Q 58 92 62 86 Q 66 82 60 78"
        stroke={COLOR.vine}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Leaf cx={66} cy={84} rotate={-10} scale={0.8} />
      <Leaf cx={56} cy={80} rotate={200} scale={0.8} />
    </g>
  )
}

function Growing() {
  return (
    <g>
      {/* curling vine */}
      <path
        d="M 60 100 Q 55 88 62 80 Q 70 74 60 64 Q 50 58 58 50"
        stroke={COLOR.vine}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      <Leaf cx={66} cy={82} rotate={-15} />
      <Leaf cx={54} cy={86} rotate={205} />
      <Leaf cx={68} cy={68} rotate={-30} scale={0.9} />
      <Leaf cx={52} cy={62} rotate={210} scale={0.9} />

      {/* bud */}
      <circle cx="58" cy="48" r="2.5" fill={COLOR.petalShade} />
      <circle cx="57.4" cy="47.4" r="1" fill={COLOR.petal} opacity="0.8" />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      {/* main vine */}
      <path
        d="M 60 100 Q 54 86 64 80 Q 74 72 58 62 Q 46 56 56 46"
        stroke={COLOR.vine}
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 64 70 Q 72 64 78 58"
        stroke={COLOR.vineLight}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      <Leaf cx={66} cy={82} rotate={-15} />
      <Leaf cx={52} cy={86} rotate={205} />
      <Leaf cx={70} cy={70} rotate={-25} scale={0.9} />
      <Leaf cx={48} cy={62} rotate={210} scale={0.9} />
      <Leaf cx={78} cy={58} rotate={-5} scale={0.8} />

      <StarFlower cx={56} cy={44} />
      <StarFlower cx={80} cy={56} scale={0.78} />
      <StarFlower cx={48} cy={64} scale={0.7} />
    </g>
  )
}
