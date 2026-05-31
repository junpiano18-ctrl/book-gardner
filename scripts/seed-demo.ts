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
// 트리거(handle_quote_inserted) 동작 (10회 = 완독):
//   1-3회 → sprout · 4-6회 → growing · 7-9회 → bloom · 10회 → 완독
//
// 문장 설계 — 7개 주제 풀(총 95개, 전부 고유):
//   T1 고독       · T2 시간/기억 · T3 관계/타인 · T4 선택/길
//   T5 자연/계절  · T6 말과 글   · T7 죽음/사라짐
//
// 책마다 어울리는 주제를 골라 풀에서 순차 소비 (책 간 중복 0).
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
// 7개 주제 풀 — 모두 고유. 책 간 중복 없음.
// 풀 합계 = 95개 (= 책별 targetQuotes 합계와 정확히 일치)
// ============================================================
type Theme =
  | 'T1_solitude'
  | 'T2_time'
  | 'T3_others'
  | 'T4_choice'
  | 'T5_nature'
  | 'T6_words'
  | 'T7_death'

const POOLS: Record<Theme, readonly string[]> = {
  // ── T1 고독 (12) ──────────────────────────────────────
  T1_solitude: [
    '누구의 발자국도 들리지 않는 길에서, 나는 천천히 나에게 가까워졌다.',
    '혼자 있을 때에야 비로소 어느 누구도 닮지 않은 내가 보였다.',
    '적막은 비어 있는 게 아니라, 가장 정직하게 채워진 시간이었다.',
    '어떤 외로움은 답을 주는 대신 묻는 법을 가르쳤다.',
    '곁이 있다고 외롭지 않은 게 아니고, 곁이 없다고 외로운 것도 아니다.',
    '나 자신과 마주 앉는 일은 늘 가장 먼 자리에서 시작된다.',
    '누구도 들여다보지 않는 창이 있어야, 한 사람의 안이 자란다.',
    '혼자 견딘 밤만큼 나의 새벽은 부드러워졌다.',
    '군중 속에서야 외로움은 가장 또렷한 모양으로 떠올랐다.',
    '등 뒤로 누군가의 기척이 사라지고 나서야 내 안의 소리가 들렸다.',
    '누구의 평가에도 닿지 않는 시간이 있어야 한 사람이 천천히 완성된다.',
    '깊은 곳에 닿는 일은 늘 혼자 가는 길에서 일어났다.',
  ],

  // ── T2 시간/기억 (14) ─────────────────────────────────
  T2_time: [
    '시간은 흐르지 않고, 우리 위에 천천히 쌓이는 것이었다.',
    '잊었다고 믿었던 것들이, 어느 날 새 얼굴로 다시 돌아왔다.',
    '어떤 기억은 다시 쓰일 때마다 조금씩 부드러워진다.',
    '어제와 오늘 사이에는 보이지 않는 다리가 놓여 있다.',
    '우리가 무엇을 기억하느냐가, 결국 우리가 누구인지를 정한다.',
    '오래된 사진을 펼치면, 그 자리의 공기가 먼저 깨어났다.',
    '한 시대가 끝났다는 건, 누군가의 일상이 끝났다는 뜻이기도 하다.',
    '시간은 답을 주는 대신, 질문을 다른 자리에 옮겨놓는다.',
    '흘러간 것은 사라지지 않고 모양만 바꿔 우리 안에 머문다.',
    '어떤 날들은 지나간 뒤에야 비로소 가장 환하게 빛난다.',
    '기억이 흐려지는 자리에서도, 감각은 가장 오래 남아 있다.',
    '우리는 미래를 향해 걷는 것 같지만, 사실은 과거를 다시 짓고 있다.',
    '시간은 모든 것을 데려가지만, 그 자리를 정확하게 비워두지는 않는다.',
    '그날의 빛이 다시 와도, 그날의 마음으로는 다시 닿을 수 없다.',
  ],

  // ── T3 관계/타인 (14) ─────────────────────────────────
  T3_others: [
    '누군가의 옆자리는 늘 천천히 데워야 했다.',
    '가까운 사람일수록 가장 자주 오해되었다.',
    '다정함은 큰 일에서가 아니라, 사소한 자리에서 자랐다.',
    '관계는 말이 끊긴 자리에서 비로소 시작되기도 한다.',
    '누군가를 안다고 믿었던 순간이, 사실 가장 모르던 순간이었다.',
    '사람과 사람 사이에는 빈 칸이 있고, 그 칸이 둘을 살게 한다.',
    '가까이 있어도 닿지 않는 마음이 있고, 멀리 있어도 닿는 마음이 있다.',
    '곁에 머무는 일은, 자주 가장 어려운 사랑이었다.',
    '같은 풍경을 보았다는 것만으로도 우리는 잠시 한 식구가 된다.',
    '누군가의 슬픔에 가만히 머무는 일은, 어떤 말보다 깊었다.',
    '사람은 이름이 불릴 때마다 조금씩 다시 살아난다.',
    '거절을 견디는 자리에서, 한 사람의 품이 만들어진다.',
    '손을 내미는 일은 늘, 자신을 먼저 여는 일이다.',
    '같이 침묵할 수 있는 사이가 진짜 가까운 사이라는 걸 늦게 알았다.',
  ],

  // ── T4 선택/길 (14) ──────────────────────────────────
  T4_choice: [
    '어느 길로 가든, 결국 그 길을 걷는 동안의 나만 남는다.',
    '갈림길 앞에서의 망설임은 두 길 모두에 대한 예의다.',
    '선택은 가지지 못한 것을 견디는 일에서부터 시작된다.',
    '길을 만드는 것은 길이 아니라, 걷는 발자국이다.',
    '답이 보이지 않는 자리에서 가장 정직한 답이 천천히 자란다.',
    '어떤 결정은 한 번이 아니라, 매일 새로 한다.',
    '두려운 일을 마주할 때 가장 나다운 모양이 드러난다.',
    '잘못 든 길이 가르쳐 주는 풍경이 따로 있었다.',
    '우회로는 길이 아닌 게 아니라, 또 다른 길이다.',
    '의심 없는 확신보다, 머뭇거리며 내딛는 한 걸음이 더 멀리 갔다.',
    '멈춰 선 자리에서도 우리는 자란다.',
    '길은 답을 알려주는 게 아니라, 묻는 자세를 알려주었다.',
    '시작은 늘 작고 어설프다. 그게 시작이 가진 정직한 표정이다.',
    '가지 않은 길이, 가본 길보다 더 오래 우리를 따라다닌다.',
  ],

  // ── T5 자연/계절 (14) ─────────────────────────────────
  T5_nature: [
    '별빛은 닿기까지 너무 오래 걸려, 도착할 무렵엔 이미 옛것이 되어 있다.',
    '사막은 비어 있는 게 아니라, 보이지 않는 것들로 가득 차 있었다.',
    '한 송이 꽃은 한 우주가 잠시 모양을 갖춘 자리다.',
    '비는 위에서 내리지만, 그것이 닿는 곳은 늘 깊은 자리였다.',
    '계절은 천천히 우리를 다시 가르친다.',
    '바람은 늘 그 자리에 멈추라고 말한다, 흔들리는 채로.',
    '나무는 가만히 서서 가장 멀리 간다.',
    '강은 머물지 않으면서도 한 자리를 지킨다.',
    '별을 올려다본다는 건, 우리 안의 가장 먼 자리를 더듬어 보는 일이다.',
    '겨울은 모든 것을 멈추게 하지만, 그 안에서 모든 것이 다시 시작된다.',
    '흙은 가장 낮은 자리에서, 가장 많은 것을 길러낸다.',
    '작은 새는 작은 만큼 정직하게 울었다.',
    '산은 무엇이 되려 하지 않고도, 그 자체로 컸다.',
    '가장 먼 하늘이 가장 가까운 호흡이 되는 순간이 있었다.',
  ],

  // ── T6 말과 글 (14) ──────────────────────────────────
  T6_words: [
    '어떤 문장은 다 읽고도 그 자리에 머물고, 어떤 문장은 읽기 전부터 익숙했다.',
    '말은 입에서 나오지만, 자라는 곳은 오래된 침묵 위였다.',
    '글을 쓴다는 건, 자기 안의 가장 정직한 자리에 다녀오는 일이다.',
    '좋은 문장은 닫혀 있어도 환했다.',
    '말이 줄어들면, 마음 둘 자리가 좁아진다.',
    '듣는 자리에 머무는 사람이 가장 멀리까지 들었다.',
    '같은 단어가 사람마다 다른 무게로 닿는다.',
    '글은 쓰는 사람을 천천히 다시 쓴다.',
    '침묵을 견디는 말이 가장 멀리 갔다.',
    '비유는 두 세계 사이에 놓는 다리였다.',
    '말로 한 약속보다, 말이 사라진 뒤의 자세가 진심에 더 가까웠다.',
    '어떤 문장은 펼쳐진 채로 한 사람의 생을 따라다닌다.',
    '표현은 줄어들수록 본 모양에 가까워졌다.',
    '글자가 작아질수록 마음은 천천히 자라났다.',
  ],

  // ── T7 죽음/사라짐 (13) ───────────────────────────────
  T7_death: [
    '어떤 사라짐은, 사라지지 않은 것을 더 환하게 한다.',
    '떠난 사람은 사라지지 않고 우리 안에 자리를 옮긴다.',
    '마지막은 끝이 아니라, 자리를 비우는 일이었다.',
    '잊지 않는다는 건 매일 같은 자리로 돌아간다는 뜻이다.',
    '죽음은 부재가 아니라, 다른 방식의 머묾일지도 모른다.',
    '누군가의 이름을 부른다는 건, 사라진 사람을 다시 깨우는 일이다.',
    '사라진 것이 더 가까워지는 자리가 있었다.',
    '한 사람이 떠난 자리에는, 그 사람을 닮은 침묵이 남는다.',
    '끝났다고 믿었던 일이 가장 오래 곁에 남았다.',
    '우리가 묻어두는 것은 사실, 우리 안에 다시 심는 일이다.',
    '가장 큰 슬픔은 천천히 가구의 모양을 바꿔놓는다.',
    '떠난 자리는 빈 게 아니라, 다른 무엇으로 천천히 채워진다.',
    '어떤 죽음은 끝나지 않고, 우리에게 와서 계속 자라난다.',
  ],
}

// ============================================================
// 책 시드 — 책마다 어울리는 주제를 골라 풀에서 N개 소비
//
// 분포 (트리거 임계 기준):
//   0회 → seed         · 1-3회 → sprout
//   4-6회 → growing    · 7-9회 → bloom (미완)
//   10회 → bloom + 완독
//
// 합 95문장 · 20권
// ============================================================
interface BookSeed {
  keyword: string
  targetQuotes: number
  themes: Array<{ theme: Theme; count: number }>
}

const SEEDS: BookSeed[] = [
  // ───── 완독 (10회) ─────
  {
    // 고독 속에서 자기 길 찾기
    keyword: '데미안 헤르만 헤세',
    targetQuotes: 10,
    themes: [
      { theme: 'T1_solitude', count: 6 },
      { theme: 'T4_choice', count: 4 },
    ],
  },
  {
    // 관계, 별, 사막, 꽃 — 관계와 자연
    keyword: '어린왕자 생텍쥐페리',
    targetQuotes: 10,
    themes: [
      { theme: 'T3_others', count: 5 },
      { theme: 'T5_nature', count: 5 },
    ],
  },
  // ───── bloom 미완 (8회) ─────
  {
    // 우주의 시간 + 별/자연
    keyword: '코스모스 칼 세이건',
    targetQuotes: 8,
    themes: [
      { theme: 'T2_time', count: 4 },
      { theme: 'T5_nature', count: 4 },
    ],
  },
  {
    // 인류사의 시간 + 문명의 선택
    keyword: '사피엔스 유발 하라리',
    targetQuotes: 8,
    themes: [
      { theme: 'T2_time', count: 4 },
      { theme: 'T4_choice', count: 4 },
    ],
  },
  {
    // 공동체 선택 + 관계
    keyword: '정의란 무엇인가 마이클 샌델',
    targetQuotes: 8,
    themes: [
      { theme: 'T3_others', count: 4 },
      { theme: 'T4_choice', count: 4 },
    ],
  },
  {
    // 광주, 죽음, 곁에 남는 슬픔
    keyword: '소년이 온다 한강',
    targetQuotes: 8,
    themes: [
      { theme: 'T3_others', count: 3 },
      { theme: 'T7_death', count: 5 },
    ],
  },
  {
    // 지리·환경의 시간, 자연 조건
    keyword: '총 균 쇠 재레드 다이아몬드',
    targetQuotes: 8,
    themes: [
      { theme: 'T2_time', count: 4 },
      { theme: 'T5_nature', count: 4 },
    ],
  },
  // ───── growing (5회) ─────
  {
    // 말 통제 + 사라지는 사람들
    keyword: '1984 조지 오웰',
    targetQuotes: 5,
    themes: [
      { theme: 'T6_words', count: 3 },
      { theme: 'T7_death', count: 2 },
    ],
  },
  {
    // 외로움 + 별빛/자연 + 한 줄 편지
    keyword: '반 고흐 영혼의 편지',
    targetQuotes: 5,
    themes: [
      { theme: 'T1_solitude', count: 3 },
      { theme: 'T5_nature', count: 1 },
      { theme: 'T6_words', count: 1 },
    ],
  },
  {
    // 말과 글의 온기, 관계
    keyword: '언어의 온도 이기주',
    targetQuotes: 5,
    themes: [
      { theme: 'T3_others', count: 2 },
      { theme: 'T6_words', count: 3 },
    ],
  },
  {
    // 사유의 길, 묻는 자세
    keyword: '서양 철학사',
    targetQuotes: 5,
    themes: [
      { theme: 'T4_choice', count: 2 },
      { theme: 'T6_words', count: 3 },
    ],
  },
  {
    // 시대의 흐름 + 잊혀짐
    keyword: '한국사 통론',
    targetQuotes: 5,
    themes: [
      { theme: 'T2_time', count: 2 },
      { theme: 'T7_death', count: 3 },
    ],
  },
  // ───── sprout (2회) ─────
  {
    keyword: '백과사전',
    targetQuotes: 2,
    themes: [{ theme: 'T6_words', count: 2 }],
  },
  {
    keyword: '종교의 역사',
    targetQuotes: 2,
    themes: [{ theme: 'T7_death', count: 2 }],
  },
  {
    keyword: '심리학 개론',
    targetQuotes: 2,
    themes: [{ theme: 'T1_solitude', count: 2 }],
  },
  {
    keyword: '사회학 개론',
    targetQuotes: 2,
    themes: [
      { theme: 'T1_solitude', count: 1 },
      { theme: 'T6_words', count: 1 },
    ],
  },
  {
    keyword: '서양 음악사',
    targetQuotes: 2,
    themes: [
      { theme: 'T6_words', count: 1 },
      { theme: 'T7_death', count: 1 },
    ],
  },
  // ───── seed (0회, 갓 심은 상태) ─────
  { keyword: '영어 회화 첫걸음', targetQuotes: 0, themes: [] },
  { keyword: '한국 현대시', targetQuotes: 0, themes: [] },
  { keyword: '건축의 역사', targetQuotes: 0, themes: [] },
]

// 책별 페이지 — 두께 다양성 위해 의도적으로 분산 (144~520)
const PAGE_VARIATIONS = [
  152, 384, 248, 520, 188, 296, 472, 168, 412, 224,
  328, 196, 444, 280, 360, 144, 256, 504, 312, 392,
] as const

// ============================================================
// 풀 소비기 — 책 호출 순서대로 풀에서 N개 꺼냄. 풀 간 중복 0.
// ============================================================
function makePoolConsumer() {
  const cursors: Record<Theme, number> = {
    T1_solitude: 0,
    T2_time: 0,
    T3_others: 0,
    T4_choice: 0,
    T5_nature: 0,
    T6_words: 0,
    T7_death: 0,
  }
  return {
    pick(themes: BookSeed['themes']): string[] {
      const out: string[] = []
      for (const { theme, count } of themes) {
        const pool = POOLS[theme]
        for (let i = 0; i < count; i++) {
          const idx = cursors[theme]
          if (idx >= pool.length) {
            console.warn(
              `  ⚠ 풀 ${theme} 고갈 (idx=${idx}/${pool.length}) — count 줄여주세요`
            )
            break
          }
          out.push(pool[idx])
          cursors[theme] = idx + 1
        }
      }
      return out
    },
    snapshot() {
      return { ...cursors }
    },
  }
}

// 설계 검증 — 책별 themes 합 == targetQuotes 인지 + 풀 용량 초과 안 하는지
function validateSeeds(): void {
  const need: Record<Theme, number> = {
    T1_solitude: 0,
    T2_time: 0,
    T3_others: 0,
    T4_choice: 0,
    T5_nature: 0,
    T6_words: 0,
    T7_death: 0,
  }
  for (const s of SEEDS) {
    const sum = s.themes.reduce((a, t) => a + t.count, 0)
    if (sum !== s.targetQuotes) {
      throw new Error(
        `시드 검증 실패: "${s.keyword}" themes 합=${sum} ≠ targetQuotes=${s.targetQuotes}`
      )
    }
    for (const { theme, count } of s.themes) need[theme] += count
  }
  for (const t of Object.keys(POOLS) as Theme[]) {
    if (need[t] > POOLS[t].length) {
      throw new Error(
        `시드 검증 실패: 풀 ${t} 부족 (필요 ${need[t]} > 보유 ${POOLS[t].length})`
      )
    }
  }
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

  // 설계 검증 — 풀 용량 / 책별 합계 사전 체크
  validateSeeds()

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
    // 문장 숲 캐시도 함께 정리 (옛 quote_id 참조 무효화)
    const { error: cacheErr } = await admin
      .from('sentence_forest_cache')
      .delete()
      .eq('user_id', demoUserId)
    if (cacheErr) {
      // 테이블이 아직 없을 수도 있음 — 경고만
      console.warn('  ⚠ sentence_forest_cache 정리 스킵:', cacheErr.message)
    } else {
      console.log(`  ✓ sentence_forest_cache: 정리 완료`)
    }
    console.log()
  }

  // ───── 2) 책 검색 + 심기 + 물주기 ─────
  console.log(`2단계: ${SEEDS.length}개 키워드로 책 검색 + 심기 + 물주기\n`)

  const seenKeys = new Set<string>()
  const consumer = makePoolConsumer()
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

    const themeLabel =
      seed.themes
        .map(({ theme, count }) => `${theme.replace(/^T\d_/, '')}×${count}`)
        .join('+') || '—'
    console.log(
      `  ↳ ${book.title} · ${book.authors.join(', ') || '저자 미상'} · KDC ${book.kdcCode} (${kdcPlant.name}) · ${totalPages}p · 결: ${themeLabel}`
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

    // quotes — 풀에서 결정적으로 소비 (책 간 중복 0)
    const quotes = consumer.pick(seed.themes)
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

  // ───── 4) 풀 사용 통계 + 문장 숲 캐시 정리 ─────
  if (!reset) {
    // 추가 모드라도 캐시는 비워줘야 새 문장이 반영됨
    const { error: cacheErr } = await admin
      .from('sentence_forest_cache')
      .delete()
      .eq('user_id', demoUserId)
    if (cacheErr) {
      console.warn('\n⚠ sentence_forest_cache 정리 스킵:', cacheErr.message)
    } else {
      console.log('\n4단계: sentence_forest_cache 정리 완료 (다음 호출에 재분석)')
    }
  }

  const snap = consumer.snapshot()
  console.log('\n=== 시드 완료 ===')
  console.log(`📚 책: ${planted}권`)
  console.log(`📜 문장: ${totalQuotes}개 (즐겨찾기 ${favCount})`)
  console.log(`🌸 완독(10회): ${bloomCount}권 — 도감 노출`)
  console.log(`🎨 주제 풀 소비:`)
  ;(Object.keys(POOLS) as Theme[]).forEach((t) => {
    const used = snap[t]
    const total = POOLS[t].length
    const bar = '█'.repeat(used) + '░'.repeat(total - used)
    console.log(`   ${t.replace(/^T\d_/, '').padEnd(10)} ${used}/${total} ${bar}`)
  })
  console.log(`건너뜀 ${skipped} · 실패 ${failed}`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
