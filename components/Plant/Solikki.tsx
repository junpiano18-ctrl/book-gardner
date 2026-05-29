import { Pot, Seed, type PlantSvgProps } from './_shared'

const COLOR = {
  moss: '#5a8c3e',
  mossLight: '#7eb050',
  mossDark: '#3e6529',
  capsule: '#a37841',
  capsuleHi: '#c7a872',
  capsuleStem: '#7c6537',
}

export function Solikki({ stage, size = 140, className }: PlantSvgProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`솔이끼 ${stage} 단계`}
    >
      <Pot kdcCode="0" />
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
      <ellipse cx="46" cy="98" rx="6" ry="3" fill={COLOR.moss} />
      <ellipse cx="60" cy="97" rx="7.5" ry="3.5" fill={COLOR.moss} />
      <ellipse cx="74" cy="98" rx="5.5" ry="3" fill={COLOR.moss} />
      <ellipse cx="46" cy="97" rx="2.2" ry="1" fill={COLOR.mossLight} opacity="0.7" />
      <ellipse cx="60" cy="96" rx="2.8" ry="1.2" fill={COLOR.mossLight} opacity="0.7" />
      <ellipse cx="74" cy="97" rx="2" ry="0.9" fill={COLOR.mossLight} opacity="0.7" />
    </g>
  )
}

function Growing() {
  return (
    <g>
      <path
        d="M 32 100 Q 38 88 48 90 Q 60 84 72 90 Q 82 88 88 100 Z"
        fill={COLOR.moss}
      />
      <path
        d="M 36 96 Q 44 88 50 91 Q 60 86 70 91 Q 76 88 84 96 Q 60 94 36 96 Z"
        fill={COLOR.mossLight}
        opacity="0.6"
      />
      <circle cx="44" cy="93" r="0.9" fill={COLOR.mossDark} opacity="0.5" />
      <circle cx="55" cy="89" r="0.9" fill={COLOR.mossDark} opacity="0.5" />
      <circle cx="66" cy="90" r="0.9" fill={COLOR.mossDark} opacity="0.5" />
      <circle cx="76" cy="93" r="0.9" fill={COLOR.mossDark} opacity="0.5" />
    </g>
  )
}

function Bloom() {
  return (
    <g>
      <path
        d="M 30 100 Q 36 84 48 88 Q 60 78 72 88 Q 84 84 90 100 Z"
        fill={COLOR.moss}
      />
      <path
        d="M 34 96 Q 44 86 52 91 Q 60 82 68 91 Q 76 86 86 96 Q 60 92 34 96 Z"
        fill={COLOR.mossLight}
        opacity="0.6"
      />

      <line x1="44" y1="86" x2="44" y2="68" stroke={COLOR.capsuleStem} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="44" cy="66" rx="2" ry="3" fill={COLOR.capsule} />
      <ellipse cx="43.2" cy="65" rx="0.6" ry="1" fill={COLOR.capsuleHi} />

      <line x1="54" y1="82" x2="55" y2="60" stroke={COLOR.capsuleStem} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="55" cy="58" rx="2.2" ry="3.2" fill={COLOR.capsule} />
      <ellipse cx="54.2" cy="57" rx="0.7" ry="1.1" fill={COLOR.capsuleHi} />

      <line x1="65" y1="82" x2="67" y2="63" stroke={COLOR.capsuleStem} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="67" cy="61" rx="2" ry="3" fill={COLOR.capsule} />
      <ellipse cx="66.2" cy="60" rx="0.6" ry="1" fill={COLOR.capsuleHi} />

      <line x1="76" y1="86" x2="76" y2="71" stroke={COLOR.capsuleStem} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="76" cy="69" rx="1.9" ry="2.8" fill={COLOR.capsule} />
    </g>
  )
}
