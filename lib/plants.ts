import { supabase } from './supabase'
import type { KdcPlant, PlantInfo } from '@/types'

export { supabase }

// KDC 코드 → 자생식물 매핑 + "왜 이 식물인지" 의미 문구.
// 의미 문구는 헤더와 책 상세 양쪽에서 동일하게 노출 (단일 출처).
export const KDC_PLANT_MAP: Record<string, KdcPlant> = {
  '0': {
    name: '솔이끼',
    sci: 'Polytrichum commune',
    family: '솔이끼과',
    meaning:
      '가장 낮은 곳에서 숲의 바닥을 덮는 이끼. 모든 지식이 뿌리내리는 바탕과 닮았습니다.',
  },
  '1': {
    name: '할미꽃',
    sci: 'Pulsatilla koreana',
    family: '미나리아재비과',
    meaning:
      '고개 숙여 피어 깊이 사유하는 듯한 꽃. 낮게 묻고 멀리 보는 철학과 닮았습니다.',
  },
  '2': {
    name: '연꽃',
    sci: 'Nelumbo nucifera',
    family: '수련과',
    meaning:
      '흙탕물 속에서 맑게 피어오르는 꽃. 혼탁함을 넘어서려는 믿음과 닮았습니다.',
  },
  '3': {
    name: '느티나무',
    sci: 'Zelkova serrata',
    family: '느릅나무과',
    meaning:
      '마을 어귀에서 사람들이 모이던 큰 그늘. 사람과 사회를 품는 학문과 닮았습니다.',
  },
  '4': {
    name: '구절초',
    sci: 'Dendranthema zawadzkii',
    family: '국화과',
    meaning:
      '가을 들녘에 정연하게 피는 들국화. 자연의 질서를 탐구하는 과학과 닮았습니다.',
  },
  '5': {
    name: '대나무',
    sci: 'Phyllostachys bambusoides',
    family: '벼과',
    meaning:
      '마디를 쌓으며 곧고 빠르게 자라는 식물. 차근차근 쌓아 올리는 기술과 닮았습니다.',
  },
  '6': {
    name: '진달래',
    sci: 'Rhododendron mucronulatum',
    family: '진달래과',
    meaning: '봄 산을 붉게 물들이는 꽃. 마음을 물들이는 예술과 닮았습니다.',
  },
  '7': {
    name: '으아리',
    sci: 'Clematis terniflora',
    family: '미나리아재비과',
    meaning:
      '덩굴을 뻗어 멀리까지 이어지는 꽃. 사람과 사람을 잇는 말과 닮았습니다.',
  },
  '8': {
    name: '매화',
    sci: 'Prunus mume',
    family: '장미과',
    meaning:
      '추위 끝에 가장 먼저 피어내는 꽃. 묵묵히 써 내려간 이야기와 닮았습니다.',
  },
  '9': {
    name: '소나무',
    sci: 'Pinus densiflora',
    family: '소나무과',
    meaning:
      '사철 푸르게 자리를 지키는 나무. 시간을 견뎌 남은 기록과 닮았습니다.',
  },
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
