import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  branch: '#6b4423',
  branchLight: '#8e5d33',
  leaf: '#5a9f4b',
  leafLight: '#88c47a',
  leafDark: '#3e7333',
  petal: '#f292b3',
  petalHi: '#f8b5cc',
  petalDeep: '#d96c8d',
  center: '#7c2f4a',
  centerDot: '#fde6ee',
  bud: '#c97898',
}

export function Jindalrae({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`진달래 ${stage} 단계`}
    >
      <Pot kdcCode="6" />
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
      <path d="M 0 0 Q 4 -4 9 0 Q 4 4 0 0 Z" fill={COLOR.leaf} />
      <path d="M 1 0 Q 4 -2 8 0" stroke={COLOR.leafLight} strokeWidth="0.5" fill="none" opacity="0.7" />
    </g>
  )
}

function Flower({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <ellipse cx="0" cy="-4" rx="3.2" ry="4" fill={COLOR.petal} />
          <ellipse cx="0" cy="-5" rx="1.5" ry="2" fill={COLOR.petalHi} opacity="0.8" />
        </g>
      ))}
      <circle cx="0" cy="0" r="1.6" fill={COLOR.center} />
      <circle cx="-0.4" cy="-0.4" r="0.5" fill={COLOR.centerDot} />
    </g>
  )
}

function Sprout() {
  return (
    <g>
      <path d="M 60 100 Q 60 88 60 80" stroke={COLOR.branch} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Leaf cx={56} cy={82} rotate={-30} scale={0.9} />
      <Leaf cx={64} cy={82} rotate={210} scale={0.9} />
      <Leaf cx={60} cy={78} rotate={-90} scale={0.8} />
    </g>
  )
}

function Growing() {
  return (
    <g>
      <path d="M 60 100 Q 58 80 56 64" stroke={COLOR.branch} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 58 82 Q 65 78 70 72" stroke={COLOR.branchLight} strokeWidth="1.8" strokeLinecap="round" fill="none" />

      <Leaf cx={50} cy={86} rotate={-30} />
      <Leaf cx={66} cy={86} rotate={210} />
      <Leaf cx={51} cy={72} rotate={-25} scale={0.9} />
      <Leaf cx={66} cy={70} rotate={210} scale={0.9} />
      <Leaf cx={72} cy={68} rotate={-10} scale={0.8} />

      {/* buds */}
      <ellipse cx="56" cy="62" rx="2.5" ry="3.5" fill={COLOR.bud} />
      <ellipse cx="55" cy="61" rx="0.9" ry="1.5" fill={COLOR.petalHi} opacity="0.7" />
      <ellipse cx="71" cy="68" rx="2" ry="2.8" fill={COLOR.bud} />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      <path d="M 60 100 Q 58 78 54 58" stroke={COLOR.branch} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M 58 82 Q 68 76 76 66" stroke={COLOR.branchLight} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M 56 70 Q 50 68 44 70" stroke={COLOR.branchLight} strokeWidth="1.6" strokeLinecap="round" fill="none" />

      <Leaf cx={48} cy={86} rotate={-30} />
      <Leaf cx={66} cy={86} rotate={210} />
      <Leaf cx={50} cy={74} rotate={-25} scale={0.9} />
      <Leaf cx={64} cy={72} rotate={210} scale={0.9} />
      <Leaf cx={73} cy={70} rotate={-5} scale={0.8} />
      <Leaf cx={44} cy={72} rotate={200} scale={0.8} />

      <Flower cx={54} cy={56} />
      <Flower cx={76} cy={64} scale={0.85} />
      <Flower cx={44} cy={70} scale={0.75} />
    </g>
  )
}
