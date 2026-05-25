import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  stem: '#5fa052',
  stemDark: '#3e7235',
  stemHi: '#8dc580',
  joint: '#436e3b',
  leaf: '#5cb84d',
  leafDark: '#406f33',
  leafHi: '#9ad58e',
}

export function Daenamu({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`대나무 ${stage} 단계`}
    >
      <Pot />
      {stage === 'seed' && <Seed />}
      {stage === 'sprout' && <Sprout />}
      {stage === 'growing' && <Growing />}
      {stage === 'bloom' && <Bloom />}
    </svg>
  )
}

function Segment({ x, y1, y2, width = 4 }: { x: number; y1: number; y2: number; width?: number }) {
  return (
    <>
      <rect x={x - width / 2} y={y2} width={width} height={y1 - y2} fill={COLOR.stem} rx={1} />
      <rect x={x - width / 2 + 0.4} y={y2 + 1} width={width / 3} height={y1 - y2 - 2} fill={COLOR.stemHi} opacity="0.7" rx={1} />
    </>
  )
}

function Joint({ x, y, width = 5 }: { x: number; y: number; width?: number }) {
  return <rect x={x - width / 2} y={y - 1} width={width} height="2" fill={COLOR.joint} rx={1} />
}

function Leaf({ cx, cy, rotate, scale = 1 }: { cx: number; cy: number; rotate: number; scale?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <path d="M 0 0 Q 4 -3 10 0 Q 4 3 0 0 Z" fill={COLOR.leaf} />
      <path d="M 1 0 Q 4 -1.5 9 0" stroke={COLOR.leafHi} strokeWidth="0.5" fill="none" opacity="0.6" />
    </g>
  )
}

function Sprout() {
  return (
    <g>
      <Segment x={60} y1={100} y2={82} />
      <Joint x={60} y={82} />
      <Leaf cx={62} cy={80} rotate={-20} scale={0.8} />
      <Leaf cx={58} cy={80} rotate={200} scale={0.7} />
    </g>
  )
}

function Growing() {
  return (
    <g>
      <Segment x={60} y1={100} y2={78} />
      <Joint x={60} y={78} />
      <Segment x={60} y1={78} y2={58} />
      <Joint x={60} y={58} />

      <Leaf cx={62} cy={76} rotate={-25} />
      <Leaf cx={58} cy={75} rotate={195} scale={0.8} />
      <Leaf cx={62} cy={56} rotate={-15} />
      <Leaf cx={58} cy={56} rotate={205} scale={0.9} />
      <Leaf cx={64} cy={62} rotate={-40} scale={0.7} />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      {/* main stem */}
      <Segment x={55} y1={100} y2={80} />
      <Joint x={55} y={80} />
      <Segment x={55} y1={80} y2={60} />
      <Joint x={55} y={60} />
      <Segment x={55} y1={60} y2={42} width={3.6} />
      <Joint x={55} y={42} width={4.5} />

      {/* side stem */}
      <Segment x={72} y1={100} y2={84} width={3.5} />
      <Joint x={72} y={84} width={4.5} />
      <Segment x={72} y1={84} y2={66} width={3.2} />

      {/* leaves on main stem */}
      <Leaf cx={57} cy={78} rotate={-20} />
      <Leaf cx={53} cy={78} rotate={200} scale={0.9} />
      <Leaf cx={58} cy={58} rotate={-15} />
      <Leaf cx={52} cy={58} rotate={205} />
      <Leaf cx={59} cy={66} rotate={-45} scale={0.7} />
      <Leaf cx={57} cy={44} rotate={-25} scale={0.9} />
      <Leaf cx={52} cy={45} rotate={210} scale={0.8} />
      <Leaf cx={56} cy={38} rotate={-10} scale={0.7} />

      {/* leaves on side stem */}
      <Leaf cx={74} cy={82} rotate={-30} scale={0.8} />
      <Leaf cx={70} cy={82} rotate={210} scale={0.7} />
      <Leaf cx={75} cy={68} rotate={-20} scale={0.9} />
      <Leaf cx={69} cy={68} rotate={200} scale={0.7} />
    </g>
  )
}
