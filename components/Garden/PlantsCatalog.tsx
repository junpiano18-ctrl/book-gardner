import { PlantIllustration } from '@/components/Plant/PlantIllustration'
import { KDC_PLANT_MAP } from '@/lib/plants'

// ============================================================
// 정원 페이지 상단 — 접이식 "분야별 식물 도감".
// 평소엔 한 줄(summary)만 보이고, 누르면 10개 KDC 분야의 자생식물 전체가
// 표로 펼쳐짐. KDC_PLANT_MAP 을 0→9 로 정렬해 map 렌더 (하드코딩 X).
// ============================================================

const KDC_LABEL: Record<string, string> = {
  '0': '총류',
  '1': '철학',
  '2': '종교',
  '3': '사회과학',
  '4': '자연과학',
  '5': '기술과학',
  '6': '예술',
  '7': '언어',
  '8': '문학',
  '9': '역사',
}

export function PlantsCatalog() {
  const entries = Object.entries(KDC_PLANT_MAP).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <details className="group overflow-hidden rounded-2xl bg-white/70 shadow-sm ring-1 ring-amber-900/5">
      {/* 접혀 있을 때 보이는 한 줄 — 우측 ▾ 는 펼침 시 회전 */}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-stone-800 transition hover:bg-amber-50/40 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span aria-hidden>🌿</span>
          <span>분야별 식물 도감</span>
          <span className="text-[11px] font-normal text-stone-400">
            10종
          </span>
        </span>
        <span
          aria-hidden
          className="text-xs text-stone-500 transition-transform duration-200 group-open:rotate-180"
        >
          ▾
        </span>
      </summary>

      {/* 펼치면 보이는 10개 행 */}
      <ul className="divide-y divide-amber-100 border-t border-amber-100">
        {entries.map(([code, plant]) => (
          <li
            key={code}
            className="flex items-start gap-3 px-4 py-3 sm:gap-4"
          >
            {/* 식물 일러스트 — bloom(만개) 단계로 통일 */}
            <div className="flex h-12 w-12 shrink-0 items-end justify-center sm:h-14 sm:w-14">
              <PlantIllustration kdcCode={code} stage="bloom" size={44} />
            </div>

            {/* 텍스트 블록 */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                  KDC {code}
                </span>
                <span className="text-sm font-bold text-stone-800">
                  {KDC_LABEL[code] ?? '기타'}
                </span>
                <span className="text-stone-300">·</span>
                <span className="text-sm font-semibold text-stone-700">
                  {plant.name}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] italic text-stone-500">
                {plant.sci} · {plant.family}
              </p>
              <p
                className="mt-1 text-xs leading-relaxed text-stone-600 sm:text-[13px]"
                style={{
                  fontFamily:
                    '"Nanum Myeongjo", var(--font-geist-sans), serif',
                }}
              >
                {plant.meaning}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* 출처 */}
      <p className="border-t border-amber-100 px-4 py-2 text-[11px] text-stone-400">
        식물 정보 출처 · 산림청 국가표준식물목록
      </p>
    </details>
  )
}
