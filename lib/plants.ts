import { supabase } from './supabase'
import type { KdcPlant, PlantInfo } from '@/types'

export { supabase }

export const KDC_PLANT_MAP: Record<string, KdcPlant> = {
  '0': { name: '솔이끼', sci: 'Polytrichum commune', family: '솔이끼과' },
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

// plant_info 캐시 (KDC 10종 = 사실상 정적 데이터).
// 동시에 같은 KDC 가 여러 카드에서 fetch 되더라도 Promise 를 공유해 중복 호출 방지.
const plantInfoCache = new Map<string, Promise<PlantInfo | null>>()

export function getPlantInfo(kdcCode: string): Promise<PlantInfo | null> {
  const key = kdcCode.charAt(0)
  const cached = plantInfoCache.get(key)
  if (cached) return cached

  const p = (async () => {
    const { data, error } = await supabase
      .from('plant_info')
      .select('*')
      .eq('kdc_code', key)
      .maybeSingle()
    if (error) {
      plantInfoCache.delete(key) // 실패 시 재시도 허용
      return null
    }
    return (data as PlantInfo | null) ?? null
  })()

  plantInfoCache.set(key, p)
  return p
}
