import type { PlantStage } from '@/types'

export interface PlantSvgProps {
  stage: PlantStage
  size?: number
  className?: string
}

export const POT_COLOR = {
  body: '#c97c5d',
  shade: '#a86a4a',
  highlight: '#e89476',
  rimShade: '#7a4a2f',
  soil: '#3e2818',
  soilSpeck: '#5a3923',
}

export function Pot() {
  return (
    <g>
      <ellipse cx="60" cy="135" rx="36" ry="3" fill="#000" opacity="0.08" />
      <path d="M 30 102 L 90 102 L 82 132 L 38 132 Z" fill={POT_COLOR.body} />
      <path d="M 33 104 L 36 130 L 39 130 L 36 104 Z" fill={POT_COLOR.highlight} opacity="0.55" />
      <ellipse cx="60" cy="102" rx="30" ry="5.5" fill={POT_COLOR.shade} />
      <ellipse cx="60" cy="102" rx="27" ry="4.2" fill={POT_COLOR.rimShade} />
      <ellipse cx="60" cy="101.5" rx="25" ry="3.4" fill={POT_COLOR.soil} />
      <circle cx="50" cy="101" r="0.9" fill={POT_COLOR.soilSpeck} opacity="0.7" />
      <circle cx="66" cy="102" r="0.7" fill={POT_COLOR.soilSpeck} opacity="0.7" />
      <circle cx="58" cy="102.5" r="0.6" fill={POT_COLOR.soilSpeck} opacity="0.7" />
    </g>
  )
}

export function Seed() {
  return (
    <g>
      <ellipse cx="60" cy="98" rx="6.5" ry="5.5" fill="#7a4a23" />
      <ellipse cx="57.5" cy="95.5" rx="2.6" ry="1.5" fill="#a87447" />
      <ellipse cx="60" cy="101" rx="5.5" ry="1.2" fill="#000" opacity="0.15" />
    </g>
  )
}
