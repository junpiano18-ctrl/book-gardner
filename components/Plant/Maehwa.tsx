import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  branch: '#4a2e16',
  branchLight: '#6b4423',
  branchHi: '#8e5d33',
  petal: '#f8d6df',
  petalLight: '#fce8ee',
  petalDeep: '#e695aa',
  center: '#c2516a',
  stamen: '#f4d03f',
  bud: '#d49baa',
}

export function Maehwa({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`매화 ${stage} 단계`}
    >
      <Pot />
      {stage === 'seed' && <Seed />}
      {stage === 'sprout' && <Sprout />}
      {stage === 'growing' && <Growing />}
      {stage === 'bloom' && <Bloom />}
    </svg>
  )
}

function PlumFlower({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <circle cx="0" cy="-3.5" r="2.8" fill={COLOR.petal} />
          <circle cx="-0.6" cy="-4" r="1.2" fill={COLOR.petalLight} opacity="0.9" />
        </g>
      ))}
      <circle cx="0" cy="0" r="1.4" fill={COLOR.center} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <line x1="0" y1="0" x2="0" y2="-2.2" stroke={COLOR.stamen} strokeWidth="0.6" strokeLinecap="round" />
          <circle cx="0" cy="-2.4" r="0.5" fill={COLOR.stamen} />
        </g>
      ))}
    </g>
  )
}

function Sprout() {
  return (
    <g>
      <path
        d="M 60 100 Q 58 90 60 82"
        stroke={COLOR.branch}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="60" cy="80" r="2.5" fill={COLOR.bud} />
      <circle cx="59" cy="79" r="1" fill={COLOR.petalLight} opacity="0.8" />
    </g>
  )
}

function Growing() {
  return (
    <g>
      <path
        d="M 60 100 Q 56 84 58 70"
        stroke={COLOR.branch}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 58 82 Q 66 78 72 72"
        stroke={COLOR.branchLight}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 58 72 Q 52 70 48 64"
        stroke={COLOR.branchLight}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* buds */}
      <circle cx="58" cy="68" r="2.6" fill={COLOR.bud} />
      <circle cx="57" cy="67" r="1.1" fill={COLOR.petalLight} opacity="0.8" />
      <circle cx="73" cy="70" r="2.2" fill={COLOR.bud} />
      <circle cx="48" cy="62" r="2" fill={COLOR.bud} />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      {/* gnarled main branch */}
      <path
        d="M 60 100 Q 56 84 56 70 Q 56 60 50 50"
        stroke={COLOR.branch}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 56 76 Q 66 70 76 60"
        stroke={COLOR.branchLight}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 56 64 Q 48 62 42 56"
        stroke={COLOR.branchLight}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 76 60 Q 82 58 84 54"
        stroke={COLOR.branchHi}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* flowers */}
      <PlumFlower cx={50} cy={48} />
      <PlumFlower cx={76} cy={58} scale={0.88} />
      <PlumFlower cx={42} cy={54} scale={0.78} />
      <PlumFlower cx={62} cy={70} scale={0.7} />
      <PlumFlower cx={84} cy={52} scale={0.65} />
    </g>
  )
}
