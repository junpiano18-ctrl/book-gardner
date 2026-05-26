import { supabase } from './supabase'
import type { KdcPlant } from '@/types'

export { supabase }

export const KDC_PLANT_MAP: Record<string, KdcPlant> = {
  '0': { name: '고사리', sci: 'Pteridium aquilinum', family: '잔고사리과' },
  '1': { name: '할미꽃', sci: 'Pulsatilla koreana', family: '미나리아재비과' },
  '2': { name: '연꽃', sci: 'Nelumbo nucifera', family: '수련과' },
  '3': { name: '느티나무', sci: 'Zelkova serrata', family: '느릅나무과' },
  '4': { name: '구절초', sci: 'Dendranthema zawadzkii', family: '국화과' },
  '5': { name: '대나무', sci: 'Phyllostachys bambusoides', family: '벼과' },
  '6': { name: '진달래', sci: 'Rhododendron mucronulatum', family: '진달래과' },
  '7': { name: '으아리', sci: 'Clematis terniflora', family: '미나리아재비과' },
  '8': { name: '매화', sci: 'Prunus mume', family: '장미과' },
  '9': { name: '소나무', sci: 'Pinus densiflora', family: '소나무과' },
}

export function getPlantByKdc(kdcCode: string): KdcPlant | null {
  const key = kdcCode.charAt(0)
  return KDC_PLANT_MAP[key] ?? null
}
