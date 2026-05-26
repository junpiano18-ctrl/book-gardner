import { Daenamu } from './Daenamu'
import { Euari } from './Euari'
import { Gujulcho } from './Gujulcho'
import { Halmiggot } from './Halmiggot'
import { Jindalrae } from './Jindalrae'
import { Maehwa } from './Maehwa'
import { Neutinamu } from './Neutinamu'
import { Solikki } from './Solikki'
import { Sonamu } from './Sonamu'
import { Yeonggot } from './Yeonggot'
import type { PlantStage } from '@/types'

interface PlantIllustrationProps {
  kdcCode?: string
  stage: PlantStage
  size?: number
  className?: string
}

const SUPPORTED_KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])

export function hasPlantIllustration(kdcCode?: string): boolean {
  return !!kdcCode && SUPPORTED_KEYS.has(kdcCode.charAt(0))
}

export function PlantIllustration({
  kdcCode,
  stage,
  size,
  className,
}: PlantIllustrationProps) {
  const key = (kdcCode ?? '').charAt(0)
  const props = { stage, size, className }
  switch (key) {
    case '0':
      return <Solikki {...props} />
    case '1':
      return <Halmiggot {...props} />
    case '2':
      return <Yeonggot {...props} />
    case '3':
      return <Neutinamu {...props} />
    case '4':
      return <Gujulcho {...props} />
    case '5':
      return <Daenamu {...props} />
    case '6':
      return <Jindalrae {...props} />
    case '7':
      return <Euari {...props} />
    case '8':
      return <Maehwa {...props} />
    case '9':
      return <Sonamu {...props} />
    default:
      return null
  }
}
