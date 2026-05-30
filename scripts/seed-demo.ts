// ============================================================
// scripts/seed-demo.ts
// 데모 계정에 실제 책(국립중앙도서관 검색) + 식물 + 문장 시드
//
// 실행:
//   npx tsx scripts/seed-demo.ts            # 추가 모드
//   npx tsx scripts/seed-demo.ts --reset    # 기존 삭제 후 재생성 (멱등)
//
// 필요 env (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   NL_API_KEY, DEMO_USER_ID
//
// 트리거(water_plant) 동작 (10회 = 완독):
//   1-3회 → sprout · 4-6회 → growing · 7-9회 → bloom · 10회 → 완독
// ============================================================

import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// NL OpenAPI (route.ts 와 동일 로직 — self-contained)
// ============================================================
const NL_BOOK_SEARCH_URL = 'https://www.nl.go.kr/NL/search/openApi/search.do'

interface NLBook {
  title: string
  authors: string[]
  publisher: string
  isbn: string
  thumbnail: string
  kdcCode: string
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

function tagText(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`,
    'i'
  )
  const m = xml.match(re)
  if (!m) return ''
  return decodeEntities((m[1] ?? m[2] ?? '').trim())
}

function pickTag(xml: string, ...tags: string[]): string {
  for (const t of tags) {
    const v = tagText(xml, t)
    if (v) return v
  }
  return ''
}

function stripHighlight(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim()
}

function firstKdcDigit(raw: string): string {
  const m = raw.match(/\d/)
  return m ? m[0] : '8'
}

function iterItemBlocks(xml: string): string[] {
  const blocks: string[] = []
  const re = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) blocks.push(m[1])
  return blocks
}

async function searchNL(keyword: string, key: string): Promise<NLBook | null> {
  const params = new URLSearchParams({
    srchTarget: 'total',
    kwd: keyword,
    category: '도서',
    pageNum: '1',
    pageSize: '1',
    key,
  })
  const res = await fetch(`${NL_BOOK_SEARCH_URL}?${params.toString()}`)
  if (!res.ok) throw new Error(`NL HTTP ${res.status}`)
  const xml = await res.text()
  const errCode = tagText(xml, 'ERR_CODE')
  if (errCode && errCode !== '000') {
    throw new Error(tagText(xml, 'ERR_MSG') || `NL ERR_CODE ${errCode}`)
  }
  const blocks = iterItemBlocks(xml)
  if (blocks.length === 0) return null
  const block = blocks[0]
  const title = stripHighlight(pickTag(block, 'title_info', 'titleInfo'))
  const author = stripHighlight(pickTag(block, 'author_info', 'authorInfo'))
  const publisher = stripHighlight(pickTag(block, 'pub_info', 'pubInfo'))
  const isbn = pickTag(block, 'isbn')
  const kdcRaw = pickTag(
    block,
    'kdc_code_1s',
    'kdcCode1s',
    'kdc_code',
    'kdcCode',
    'class_no'
  )
  const image = pickTag(block, 'image_url', 'imageUrl', 'title_url')
  return {
    title,
    authors: author ? [author] : [],
    publisher,
    isbn,
    thumbnail: image,
    kdcCode: firstKdcDigit(kdcRaw),
  }
}

// ============================================================
// 시드 분포 (새 임계값 기준)
//   0회 → seed         · 1-3회 → sprout
//   4-6회 → growing    · 7-9회 → bloom (미완)
//   10회 → bloom + 완독
//
// 책별 targetQuotes:
//   10×2 (완독) · 8×5 (bloom) · 5×5 (growing) · 2×5 (sprout) · 0×3 (seed)
//   합 95문장 · 20권
// ============================================================
interface BookSeed {
  keyword: string
  targetQuotes: number
  specific: string[]
}

const SEEDS: BookSeed[] = [
  // ───── 완독 (10회, bloom + completed) ─────
  {
    keyword: '데미안 헤르만 헤세',
    targetQuotes: 10,
    specific: [
      '새는 알에서 나오기 위해 투쟁한다. 알은 세계다.',
      '한 사람의 운명은, 그가 자신 안에 길러낸 작은 세계로부터 흘러나온다.',
      '나는 다만 내 안에서 솟아 나오려는 것, 그것을 살아보고 싶었을 뿐이다.',
      '운명의 신호는, 가장 두려워하던 일과 함께 찾아온다.',
      '내 안의 소리에 귀를 기울일 때, 비로소 나는 더 깊은 나에게 가닿는다.',
    ],
  },
  {
    keyword: '어린왕자 생텍쥐페리',
    targetQuotes: 10,
    specific: [
      '정말 중요한 것은 눈에 보이지 않아.',
      '네가 길들인 것에 대해 너는 영원히 책임을 져야 해.',
      '어른들은 누구나 처음엔 어린아이였다. 하지만 그것을 기억하는 어른은 거의 없다.',
      '사막이 아름다운 건, 어딘가에 우물을 감추고 있어서야.',
      '가시는 꽃이 자신을 지키기 위한 작은 용기야.',
    ],
  },
  // ───── bloom 미완 (8회) ─────
  {
    keyword: '코스모스 칼 세이건',
    targetQuotes: 8,
    specific: [
      '별 먼지로 만들어진 우리가, 별을 올려다보고 있다.',
      '우리는 우주가 스스로를 알아가는 한 방식이다.',
      '탐험은 인간 본성에 새겨진 일이다.',
      '천문학은 결국 우리가 어디에서 왔는지를 묻는 일이다.',
    ],
  },
  {
    keyword: '사피엔스 유발 하라리',
    targetQuotes: 8,
    specific: [
      '허구를 함께 믿는 능력 덕분에 낯선 사람들과도 협력할 수 있었다.',
      '농업혁명은 역사상 가장 큰 사기였을지도 모른다.',
      '무엇이든 할 수 있게 된 우리는, 정작 무엇을 원해야 할지 모른다.',
      '우리가 동식물을 길들이기 전에, 어쩌면 그들이 우리를 길들였는지도 모른다.',
    ],
  },
  {
    keyword: '정의란 무엇인가 마이클 샌델',
    targetQuotes: 8,
    specific: [
      '정의는 단지 옳고 그름의 문제가 아니라, 어떤 공동체를 원하는가의 문제다.',
      '직관을 그대로 따르기보다 그 근거를 묻는 일이 철학의 시작이다.',
      '시장 바깥에 두어야 할 가치가 있다.',
      '좋은 삶에 대한 합의 없이는, 정의도 흔들린다.',
    ],
  },
  {
    keyword: '소년이 온다 한강',
    targetQuotes: 8,
    specific: [
      '당신의 슬픔이 당신을 만들었고, 그 슬픔을 거쳐 당신은 인간이 되었다.',
      '이름을 부르는 일이, 누군가를 살아 있게 한다.',
      '어떤 죽음은 끝나지 않고 우리에게 와서 계속 자라난다.',
      '잊지 않는다는 건, 매일 다시 그 자리로 돌아간다는 뜻이다.',
    ],
  },
  {
    keyword: '총 균 쇠 재레드 다이아몬드',
    targetQuotes: 8,
    specific: [
      '지리는 운명의 절반을 결정한다.',
      '한 사회의 성패는 자원의 양이 아니라 그것을 마주한 시간의 길이에 달려 있다.',
      '문명은 동식물을 길들이는 데서 시작되었다.',
      '문명의 차이는 사람의 차이가 아니라, 사람이 놓인 자리의 차이다.',
    ],
  },
  // ───── growing (5회) ─────
  {
    keyword: '1984 조지 오웰',
    targetQuotes: 5,
    specific: [
      '자유란 둘 더하기 둘은 넷이라고 말할 수 있는 자유다.',
      '과거를 지배하는 자가 미래를 지배한다.',
      '말이 줄어들면 생각도 줄어든다.',
    ],
  },
  {
    keyword: '반 고흐 영혼의 편지',
    targetQuotes: 5,
    specific: [
      '별이 빛나는 밤은, 그 자체로 한 사람의 외로움을 견디게 한다.',
      '위대한 일은 작은 일들이 한데 모여 이루어진다.',
      '나는 그림에서 위로를 찾는다. 다른 어디에서도 받지 못하는 위로를.',
    ],
  },
  {
    keyword: '언어의 온도 이기주',
    targetQuotes: 5,
    specific: [
      '어떤 말은 너무 따뜻해서 받아 들기 전에 식어버린다.',
      '말은 결국 그 사람이다.',
      '듣는 일이 말하는 일보다 더 깊은 자리에서 일어난다.',
    ],
  },
  {
    keyword: '서양 철학사',
    targetQuotes: 5,
    specific: [
      '철학은 묻기를 두려워하지 않는 일이다.',
      '지혜는 답이 아니라 머무는 자세에 있다.',
      '옛 사람들이 끝내지 못한 질문이 오늘 내 책상 위에 놓여 있다.',
    ],
  },
  {
    keyword: '한국사 통론',
    targetQuotes: 5,
    specific: [
      '역사는 지나간 시간이 아니라, 지금 우리를 만든 흐름이다.',
      '기록되지 않은 삶이 사라지는 게 아니라, 다시 읽힐 자리를 기다리는 것이다.',
      '한 시대의 끝은, 다음 시대의 첫 페이지다.',
    ],
  },
  // ───── sprout (2회) ─────
  {
    keyword: '백과사전',
    targetQuotes: 2,
    specific: [
      '지식은 외워야 할 목록이 아니라, 마음에 새겨야 할 풍경이다.',
      '한 분야를 깊이 파고들면, 다른 모든 분야가 천천히 따라온다.',
    ],
  },
  {
    keyword: '종교의 역사',
    targetQuotes: 2,
    specific: [
      '믿음은 답을 알기보다, 길게 묻는 자세를 견디는 일이다.',
      '의식은 짧고, 그것이 우리에게 남긴 자세는 오래간다.',
    ],
  },
  {
    keyword: '심리학 개론',
    targetQuotes: 2,
    specific: [
      '우리는 우리가 본 것보다, 보기로 한 것을 더 많이 안다.',
      '감정은 해석되기 전까지는 신호일 뿐이다.',
    ],
  },
  {
    keyword: '사회학 개론',
    targetQuotes: 2,
    specific: [
      '사회는 우리가 만든 것이지만, 만들고 나면 우리를 만든다.',
      '구조는 보이지 않을 때 가장 강하게 작동한다.',
    ],
  },
  {
    keyword: '서양 음악사',
    targetQuotes: 2,
    specific: [
      '음악은 시간을 들으며 시간을 잊게 한다.',
      '쉼표는 침묵이 아니라 다음을 위한 호흡이다.',
    ],
  },
  // ───── seed (0회, 갓 심은 상태) ─────
  { keyword: '영어 회화 첫걸음', targetQuotes: 0, specific: [] },
  { keyword: '한국 현대시', targetQuotes: 0, specific: [] },
  { keyword: '건축의 역사', targetQuotes: 0, specific: [] },
]

// 책 전용 문장이 부족할 때 채울 범용 문장 (30개) — globalUsed 로 책 간 중복 방지
const UNIVERSAL_QUOTES: readonly string[] = [
  '오래 들여다본 문장은 결국 나를 들여다본다.',
  '어떤 말은 너무 무거워서 책을 닫고 나서야 가만히 내려놓을 수 있었다.',
  '한 권의 책은 한 사람의 계절이다.',
  '읽는 일은, 누군가의 침묵을 가만히 듣는 일이기도 하다.',
  '다 읽고 나서야 비로소, 첫 페이지가 어디였는지 알게 된다.',
  '어떤 책은 내 안의 작은 길을 열어놓고 떠난다.',
  '밑줄을 긋는 자리는, 결국 내가 흔들렸던 자리다.',
  '문장이 한참을 머물다 갔다. 그 자국이 나를 더 가깝게 만들었다.',
  '책을 덮는 순간에도, 한 줄은 여전히 펼쳐져 있다.',
  '두 번째로 읽는 페이지는, 사실 다른 책이다.',
  '활자 속에서 누군가의 마음을 만지는 건, 이상한 다정함이다.',
  '잠들기 전 마지막 줄이, 다음날 아침의 문을 연다.',
  '낯선 문장이 익숙해질 무렵, 나는 어느새 달라져 있었다.',
  '책장은 천천히 나를 만든다.',
  '한 줄 한 줄이 길게 내려앉아 마음에 길을 낸다.',
  '읽다가 멈춘 자리, 거기에 오래 머물고 싶었다.',
  '책은 끝내지 못한 대화의 모음이다.',
  '같은 책이라도 두 번째에는 다른 페이지에서 멈춘다.',
  '문장이 짧을수록 그 안의 침묵이 길었다.',
  '오랜 책에는 시간의 향이 묻어난다.',
  '글자가 나에게 말을 거는 듯한 순간이 있다.',
  '책 한 권의 끝은, 종종 또 다른 시작이다.',
  '필요한 책은 늘 우연히 찾아온다.',
  '읽기는 결국 듣는 일이다.',
  '오랜 책을 다시 펼치는 일은, 옛 친구를 만나는 일과 닮았다.',
  '한 줄에 머무는 시간이, 한 권을 읽는 시간보다 더 길 때가 있다.',
  '책을 펼치는 손이, 어쩌면 나를 가장 잘 안다.',
  '독서는 천천히 자기를 가꾸는 일이다.',
  '문장은 늘 나보다 한 발 앞서 있다.',
  '책에는 시간이 단단히 접혀 있다.',
]

// 책별 페이지 — 두께 다양성 위해 의도적으로 분산 (144~520)
const PAGE_VARIATIONS = [
  152, 384, 248, 520, 188, 296, 472, 168, 412, 224,
  328, 196, 444, 280, 360, 144, 256, 504, 312, 392,
] as const

// ============================================================
// 헬퍼
// ============================================================
function pickQuotes(
  seed: BookSeed,
  bookIndex: number,
  globalUsed: Set<string>
): string[] {
  const out: string[] = []
  // 책 전용 문장 먼저 (중복 가드)
  for (const q of seed.specific) {
    if (out.length >= seed.targetQuotes) break
    if (out.includes(q)) continue
    out.push(q)
    globalUsed.add(q)
  }
  if (out.length >= seed.targetQuotes) return out

  // 결정적 셔플 (bookIndex 시드) → 책마다 다른 순서
  const shuffled = [...UNIVERSAL_QUOTES].sort((a, b) => {
    const ha = (a.length * (bookIndex + 3)) % 17
    const hb = (b.length * (bookIndex + 3)) % 17
    return ha - hb
  })

  // 1차: 다른 책이 안 쓴 universal 우선
  for (const q of shuffled) {
    if (out.length >= seed.targetQuotes) break
    if (globalUsed.has(q)) continue
    out.push(q)
    globalUsed.add(q)
  }
  // 2차: pool 소진 시 fallback — 본 책 내 중복만 금지
  if (out.length < seed.targetQuotes) {
    for (const q of shuffled) {
      if (out.length >= seed.targetQuotes) break
      if (out.includes(q)) continue
      out.push(q)
    }
  }
  return out
}

function buildWateredDates(quoteCount: number, bookIndex: number): Date[] {
  let s = bookIndex * 31 + 7
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const newestDaysAgo = Math.floor(rnd() * 8) + 1
  const spacing = Math.floor(rnd() * 3) + 2
  const dates: Date[] = []
  for (let i = 0; i < quoteCount; i++) {
    const daysAgo = newestDaysAgo + i * spacing
    dates.push(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000))
  }
  return dates.reverse() // 오래된 → 최신
}

function pageNumberFor(qi: number, total: number, bookPages: number): number {
  const start = 10
  const end = Math.max(start + 20, bookPages - 20)
  if (total <= 1) return Math.round((start + end) / 2)
  return Math.round(start + (qi * (end - start)) / (total - 1))
}

function stageLabelFromCount(n: number): string {
  if (n >= 10) return 'bloom+완독'
  if (n >= 7) return 'bloom'
  if (n >= 4) return 'growing'
  if (n >= 1) return 'sprout'
  return 'seed (갓 심음)'
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ============================================================
// main
// ============================================================
async function main() {
  loadEnvConfig(process.cwd())

  const reset = process.argv.includes('--reset')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const nlKey = process.env.NL_API_KEY
  const demoUserId = process.env.DEMO_USER_ID

  const missing: string[] = []
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!nlKey) missing.push('NL_API_KEY')
  if (!demoUserId) missing.push('DEMO_USER_ID')
  if (missing.length) {
    console.error('환경변수 누락:', missing.join(', '))
    process.exit(1)
  }

  const { KDC_PLANT_MAP } = await import('../lib/plants')

  const admin = createClient(url!, serviceRoleKey!, {
    auth: { persistSession: false },
  })

  console.log(`데모 유저: ${demoUserId}`)
  console.log(`모드: ${reset ? '--reset (기존 삭제 후 재생성)' : '추가'}\n`)

  // ───── 1) Reset ─────
  if (reset) {
    console.log('1단계: 데모 사용자 기존 데이터 삭제')
    const tables = ['quotes', 'plants', 'books'] as const
    for (const t of tables) {
      const { error, count } = await admin
        .from(t)
        .delete({ count: 'exact' })
        .eq('user_id', demoUserId)
      if (error) {
        console.error(`  ✗ ${t} 삭제 실패:`, error.message)
        process.exit(1)
      }
      console.log(`  ✓ ${t}: ${count ?? 0}건 삭제`)
    }
    console.log()
  }

  // ───── 2) 책 검색 + 심기 + 물주기 ─────
  console.log(`2단계: ${SEEDS.length}개 키워드로 책 검색 + 심기 + 물주기\n`)

  const seenKeys = new Set<string>()
  const globalUsedQuotes = new Set<string>()
  let planted = 0
  let totalQuotes = 0
  let favCount = 0
  let bloomCount = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i]
    console.log(
      `[${i + 1}/${SEEDS.length}] "${seed.keyword}" (${seed.targetQuotes}회 → ${stageLabelFromCount(seed.targetQuotes)})`
    )

    let book: NLBook | null = null
    try {
      book = await searchNL(seed.keyword, nlKey!)
    } catch (e) {
      console.error('  ✗ NL 검색 실패:', (e as Error).message)
      failed++
      await sleep(800)
      continue
    }
    if (!book) {
      console.warn('  ⚠ 검색 결과 없음 — 건너뜀')
      failed++
      await sleep(800)
      continue
    }

    const dedupKey =
      book.isbn.trim() || `${book.title}|${book.authors[0] ?? ''}`
    if (seenKeys.has(dedupKey)) {
      console.warn(`  ⚠ 중복(${dedupKey.slice(0, 30)}) — 건너뜀`)
      skipped++
      continue
    }
    seenKeys.add(dedupKey)

    const kdcPlant = KDC_PLANT_MAP[book.kdcCode] ?? KDC_PLANT_MAP['8']
    const totalPages = PAGE_VARIATIONS[i % PAGE_VARIATIONS.length]

    console.log(
      `  ↳ ${book.title} · ${book.authors.join(', ') || '저자 미상'} · KDC ${book.kdcCode} (${kdcPlant.name}) · ${totalPages}p`
    )

    const { data: bookRow, error: bookErr } = await admin
      .from('books')
      .insert({
        user_id: demoUserId,
        title: book.title,
        author: book.authors.join(', ') || null,
        publisher: book.publisher || null,
        cover_url: book.thumbnail || null,
        kdc_code: book.kdcCode,
        isbn: book.isbn || null,
        total_pages: totalPages,
        status: 'reading',
      })
      .select()
      .single()
    if (bookErr || !bookRow) {
      console.error('  ✗ books insert 실패:', bookErr?.message)
      failed++
      continue
    }

    const { data: plantRow, error: plantErr } = await admin
      .from('plants')
      .insert({
        user_id: demoUserId,
        book_id: bookRow.id,
        kdc_code: book.kdcCode,
        plant_name: kdcPlant.name,
        sci_name: kdcPlant.sci,
        family_name: kdcPlant.family,
        stage: 'seed',
        growth_point: 0,
      })
      .select()
      .single()
    if (plantErr || !plantRow) {
      console.error('  ✗ plants insert 실패:', plantErr?.message)
      failed++
      continue
    }

    // quotes — 트리거가 plant 단계/완독 처리
    const quotes = pickQuotes(seed, i, globalUsedQuotes)
    const dates = buildWateredDates(quotes.length, i)
    let qOk = 0
    for (let qi = 0; qi < quotes.length; qi++) {
      const isFav = qi === 0 && i % 3 === 1
      const { error: qErr } = await admin.from('quotes').insert({
        user_id: demoUserId,
        book_id: bookRow.id,
        plant_id: plantRow.id,
        content: quotes[qi],
        page_number: pageNumberFor(qi, quotes.length, totalPages),
        watered_at: dates[qi].toISOString(),
        is_favorite: isFav,
      })
      if (qErr) {
        console.error(`  ✗ quote ${qi + 1} 실패:`, qErr.message)
      } else {
        qOk++
        if (isFav) favCount++
      }
    }

    totalQuotes += qOk
    planted++
    if (seed.targetQuotes >= 10) bloomCount++

    console.log(`  ✓ 문장 ${qOk}/${quotes.length}개 기록`)
    await sleep(800)
  }

  // ───── 3) 보정 — quotes 개수 기준으로 plants 강제 재계산
  //         (트리거 동작 여부와 무관하게 일관된 최종 상태 보장)
  console.log('\n3단계: plants 재계산 (트리거 안전망)')

  const { data: plantRows, error: listErr } = await admin
    .from('plants')
    .select('id, book_id, last_watered_at')
    .eq('user_id', demoUserId)

  if (listErr) {
    console.error('  ✗ plants 조회 실패:', listErr.message)
  } else if (!plantRows) {
    console.warn('  ⚠ plants 결과 없음')
  } else {
    let reconciled = 0
    let finalCompleted = 0
    const completedBookIds: string[] = []

    for (const p of plantRows) {
      const { count: qc } = await admin
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('plant_id', p.id)

      const n = qc ?? 0
      const growth = Math.min(100, n * 10)
      const stage =
        growth >= 70 ? 'bloom'
        : growth >= 40 ? 'growing'
        : growth >= 10 ? 'sprout'
        : 'seed'
      const completedAt =
        n >= 10
          ? (p.last_watered_at as string | null) ?? new Date().toISOString()
          : null

      const { error: upErr } = await admin
        .from('plants')
        .update({
          growth_point: growth,
          stage,
          completed_at: completedAt,
        })
        .eq('id', p.id)

      if (upErr) {
        console.error(`  ✗ plant ${p.id} 업데이트 실패:`, upErr.message)
        continue
      }
      reconciled++
      if (completedAt) {
        finalCompleted++
        if (p.book_id) completedBookIds.push(p.book_id as string)
      }
    }

    // books.status 동기화: 데모 유저 책 모두 'reading' 으로 리셋한 후 완독 책만 'completed'
    await admin
      .from('books')
      .update({ status: 'reading' })
      .eq('user_id', demoUserId)
    if (completedBookIds.length > 0) {
      const { error: bErr } = await admin
        .from('books')
        .update({ status: 'completed' })
        .in('id', completedBookIds)
      if (bErr) console.error('  ✗ books.status 갱신 실패:', bErr.message)
    }

    console.log(
      `  ✓ 재계산 ${reconciled}/${plantRows.length}건 · 최종 완독 ${finalCompleted}권`
    )
  }

  console.log('\n=== 시드 완료 ===')
  console.log(`📚 책: ${planted}권`)
  console.log(`📜 문장: ${totalQuotes}개 (즐겨찾기 ${favCount})`)
  console.log(`🌸 완독(10회): ${bloomCount}권 — 도감 노출`)
  console.log(`📐 universal 풀 사용: ${globalUsedQuotes.size}/${UNIVERSAL_QUOTES.length}`)
  console.log(`건너뜀 ${skipped} · 실패 ${failed}`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
