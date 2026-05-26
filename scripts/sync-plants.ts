// ============================================================
// scripts/sync-plants.ts
// 산림청 scnmSearch 는 학명으로 필터링되지 않으므로
// 전체 DB(약 39,030건)를 페이지로 다운로드 후 메모리에서
// KDC_PLANT_MAP 의 10종 학명과 매칭하여 plant_info UPDATE.
//
// 실행: npx tsx scripts/sync-plants.ts
// 소요시간: 약 6분 (40 페이지 × 8~10초)
// ============================================================

import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'
import type { ForestPlantRecord } from '../lib/forest'

async function main() {
  loadEnvConfig(process.cwd())

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const forestKey = process.env.FOREST_API_KEY

  const missing: string[] = []
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!forestKey) missing.push('FOREST_API_KEY')
  if (missing.length) {
    console.error('환경변수 누락:', missing.join(', '))
    process.exit(1)
  }

  const { KDC_PLANT_MAP } = await import('../lib/plants')
  const { fetchForestPage, findForestRecordBySciName } = await import(
    '../lib/forest'
  )

  const admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false },
  })

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const entries = Object.entries(KDC_PLANT_MAP)

  // ───────────────────────────────────────────────────────────
  // 1) plant_info 를 KDC_PLANT_MAP 기준으로 동기화 (source of truth)
  //    plant_name / sci_name / family_kor 는 seed 값으로 덮어쓰기
  //    family_sci / genus_* 는 NULL 로 비워 산림청 매칭 결과를 받음
  // ───────────────────────────────────────────────────────────
  console.log('1단계: plant_info 정리 (KDC_PLANT_MAP 기준)')
  for (const [kdcCode, plant] of entries) {
    const { error } = await admin
      .from('plant_info')
      .update({
        plant_name: plant.name,
        sci_name: plant.sci,
        family_kor: plant.family,
        family_sci: null,
        genus_kor: null,
        genus_sci: null,
      })
      .eq('kdc_code', kdcCode)
    if (error) {
      console.error(`  ✗ KDC ${kdcCode} 초기화 실패:`, error.message)
    }
  }
  console.log('  ✓ 10종 초기화 완료\n')

  // ───────────────────────────────────────────────────────────
  // 2) 산림청 DB 전체 다운로드 (페이지당 1000건)
  // ───────────────────────────────────────────────────────────
  const PAGE_SIZE = 1000
  console.log(`2단계: 산림청 DB 전체 다운로드 (페이지당 ${PAGE_SIZE}건)`)

  const all: ForestPlantRecord[] = []
  let pageNo = 1
  let totalCount = Infinity

  while (all.length < totalCount) {
    const t0 = Date.now()
    const page = await fetchForestPage(forestKey!, pageNo, PAGE_SIZE)
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

    if (pageNo === 1) totalCount = page.totalCount
    if (page.records.length === 0) break

    all.push(...page.records)
    console.log(
      `  페이지 ${pageNo}: +${page.records.length}건 / 누적 ${all.length}/${totalCount} (${elapsed}s)`
    )
    pageNo++
    if (all.length < totalCount) await sleep(1000)
  }
  console.log(`  ✓ 총 ${all.length}건 다운로드 완료\n`)

  // ───────────────────────────────────────────────────────────
  // 3) 10종 매칭 + UPDATE
  // ───────────────────────────────────────────────────────────
  console.log('3단계: 학명 매칭 + plant_info UPDATE')

  let updated = 0
  let notFound = 0
  let failed = 0

  for (const [kdcCode, plant] of entries) {
    console.log(`KDC ${kdcCode} · ${plant.name} (${plant.sci})`)
    const match = findForestRecordBySciName(all, plant.sci)

    if (!match) {
      console.warn('  ⚠ 산림청 DB 에서 매칭 실패 — 건너뜀')
      notFound++
      continue
    }

    console.log(
      `  ↳ ${match.via} 매칭: ${match.record.sciName}` +
        (match.via === '이명' ? ' (정명이 다른 학명으로 이동됨)' : '')
    )

    const { error } = await admin
      .from('plant_info')
      .update({
        family_kor: match.record.familyKor ?? plant.family,
        family_sci: match.record.familySci ?? null,
        genus_kor: match.record.genusKor ?? null,
        genus_sci: match.record.genusSci ?? null,
      })
      .eq('kdc_code', kdcCode)

    if (error) {
      console.error('  ✗ DB UPDATE 실패:', error.message)
      failed++
    } else {
      console.log(
        `  ✓ 과: ${match.record.familyKor ?? '-'} / ${match.record.familySci ?? '-'}` +
          `, 속: ${match.record.genusKor ?? '-'} / ${match.record.genusSci ?? '-'}`
      )
      updated++
    }
  }

  console.log(`\n=== 완료 ===`)
  console.log(
    `업데이트 ${updated} · 매칭 실패 ${notFound} · UPDATE 실패 ${failed}`
  )
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
