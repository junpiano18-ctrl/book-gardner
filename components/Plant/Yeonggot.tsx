import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  water: '#7ec8e3',
  waterHi: '#b6e0eb',
  waterRipple: '#5cb1d4',
  pad: '#5fa052',
  padLight: '#88c47a',
  stem: '#6a9c5a',
  petal: '#f8b8c8',
  petalLight: '#fcd6e0',
  petalDeep: '#e695aa',
  center: '#f4d03f',
  centerHi: '#fef5c4',
}

export function Yeonggot({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`연꽃 ${stage} 단계`}
    >
      <Pot />
      {stage === 'seed' && <Seed />}
      {stage !== 'seed' && (
        <>
          <WaterSurface />
          {stage === 'sprout' && <Sprout />}
          {stage === 'growing' && <Growing />}
          {stage === 'bloom' && <Bloom />}
        </>
      )}
    </svg>
  )
}

function WaterSurface() {
  return (
    <g>
      <ellipse cx="60" cy="101.5" rx="25" ry="3.4" fill={COLOR.water} />
      <ellipse cx="60" cy="100.8" rx="23" ry="2.6" fill={COLOR.waterHi} opacity="0.6" />
      <ellipse cx="54" cy="100.5" rx="3" ry="0.5" fill={COLOR.waterRipple} opacity="0.5" />
      <ellipse cx="68" cy="101.5" rx="2" ry="0.4" fill={COLOR.waterRipple} opacity="0.5" />
    </g>
  )
}

function Sprout() {
  return (
    <g>
      <ellipse cx="60" cy="97" rx="11" ry="4" fill={COLOR.pad} />
      <path d="M 60 97 L 64 94.5 L 64 99 Z" fill={COLOR.waterHi} />
      <ellipse cx="56" cy="95.5" rx="3.5" ry="1.4" fill={COLOR.padLight} opacity="0.7" />
    </g>
  )
}

function Growing() {
  return (
    <g>
      <ellipse cx="46" cy="98" rx="13" ry="4.5" fill={COLOR.pad} />
      <path d="M 46 98 L 52 95 L 52 99 Z" fill={COLOR.waterHi} />
      <ellipse cx="42" cy="96.5" rx="4" ry="1.5" fill={COLOR.padLight} opacity="0.7" />

      <ellipse cx="74" cy="99" rx="9" ry="3" fill={COLOR.pad} />
      <path d="M 74 99 L 78 97 L 78 99.5 Z" fill={COLOR.waterHi} />

      <line x1="60" y1="98" x2="60" y2="74" stroke={COLOR.stem} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="60" cy="70" rx="4" ry="6.5" fill={COLOR.petalDeep} />
      <ellipse cx="58.5" cy="69" rx="1.6" ry="3.2" fill={COLOR.petal} opacity="0.85" />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      <ellipse cx="42" cy="99" rx="12" ry="4" fill={COLOR.pad} />
      <path d="M 42 99 L 47 96 L 47 99.5 Z" fill={COLOR.waterHi} />
      <ellipse cx="38" cy="97.5" rx="3.5" ry="1.3" fill={COLOR.padLight} opacity="0.7" />

      <ellipse cx="78" cy="98" rx="11" ry="3.5" fill={COLOR.pad} />
      <path d="M 78 98 L 82.5 96 L 82.5 99 Z" fill={COLOR.waterHi} />

      <line x1="60" y1="98" x2="60" y2="58" stroke={COLOR.stem} strokeWidth="1.5" strokeLinecap="round" />

      <g transform="translate(60 54)">
        <ellipse cx="-7" cy="2" rx="4.5" ry="9" transform="rotate(-30)" fill={COLOR.petal} />
        <ellipse cx="7" cy="2" rx="4.5" ry="9" transform="rotate(30)" fill={COLOR.petal} />
        <ellipse cx="-3" cy="-3" rx="4.5" ry="9" transform="rotate(-12)" fill={COLOR.petalLight} />
        <ellipse cx="3" cy="-3" rx="4.5" ry="9" transform="rotate(12)" fill={COLOR.petalLight} />
        <ellipse cx="0" cy="0" rx="4.5" ry="9" fill={COLOR.petalLight} />
        <ellipse cx="-1" cy="-3" rx="2" ry="4" fill="#ffe5ec" opacity="0.7" />
        <circle cx="0" cy="3" r="2.8" fill={COLOR.center} />
        <circle cx="-0.7" cy="2.2" r="0.9" fill={COLOR.centerHi} />
      </g>
    </g>
  )
}
