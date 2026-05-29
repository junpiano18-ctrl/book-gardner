// 톤다운한 책등 색상 — KDC별 매핑 (6색 팔레트 순환)
// ShelfView 의 책등 색상과 BookCard 의 표지 폴백 배경에 공유
export const KDC_COLORS: Record<string, string> = {
  '0': '#6a6a8a',
  '1': '#8a6a7a',
  '2': '#5a7a6a',
  '3': '#a07850',
  '4': '#7a8a5a',
  '5': '#8a5a4a',
  '6': '#8a6a7a',
  '7': '#5a7a6a',
  '8': '#a07850',
  '9': '#7a8a5a',
}

export const DEFAULT_KDC_COLOR = '#6a6a8a'

export function getKdcColor(kdcCode: string | undefined | null): string {
  if (!kdcCode) return DEFAULT_KDC_COLOR
  const key = kdcCode.charAt(0)
  return KDC_COLORS[key] ?? DEFAULT_KDC_COLOR
}
