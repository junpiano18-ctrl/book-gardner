// ============================================================
// 문장 숲(Sentence Forest) API
// - POST /api/sentence-forest
// - Authorization: Bearer <supabase access_token>
// - 본인 quotes 전체를 가져와서 Claude 로 의미·주제별 클러스터링
// - 8개 미만이면 not_enough 응답
// - 사용자의 원문은 절대 수정/생성하지 않음 (id 만 그룹핑)
// - 이전 분석 라벨을 다음 분석에 힌트로 전달 → 라벨 일관성
//
// 보안:
// - ANTHROPIC_API_KEY 는 서버 전용 (NEXT_PUBLIC_ 접두사 없음)
// - access_token 검증 후 본인 quotes 만 service_role 로 조회
// ============================================================

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const MIN_QUOTES = 8
const MIN_GROUP_SIZE = 4
const MAX_GROUPS = 8
const TARGET_GROUPS_MIN = 5

interface RawQuote {
  id: string
  content: string
  book: { title: string | null } | null
}

interface Group {
  label: string
  quote_ids: string[]
}

interface EnrichedQuote {
  id: string
  content: string
  book_title: string | null
}

interface EnrichedGroup {
  label: string
  quotes: EnrichedQuote[]
}

// ── 시스템 프롬프트: 5대 원칙 + 라벨 일관성 + 그룹 수 제약 ─
const SYSTEM_PROMPT = `당신은 한국어 문장 클러스터링 보조입니다. 사용자가 책에서 모은 한 줄 문장들을 의미·주제별로 묶고, 각 묶음에 1~3자 한국어 명사 라벨만 붙입니다.

# 절대 원칙
1. 사용자의 원문 텍스트는 절대 수정·요약·창작·번역하지 않는다. 입력은 id 로만 참조한다.
2. 그룹 라벨은 1~3자 한국어 명사로만 (예: "고독", "시간", "선택", "관계", "사랑", "죽음", "기억").
3. 해석·코멘트·질문·조언·감상·요약을 일절 출력하지 않는다. JSON 외 텍스트 금지.
4. 묶는 기준은 문장 자체의 의미·주제뿐이다. 책 제목·저자·KDC·시기 등 외부 정보를 추정하지 않는다 (애초에 제공되지 않는다).
5. 사용자의 심리·감정·상태를 추측하거나 진단하지 않는다.

# 클러스터링 규칙 (중요)
- **전체 문장을 ${TARGET_GROUPS_MIN}~${MAX_GROUPS}개의 큰 의미 그룹으로 묶어라. ${MAX_GROUPS}개를 절대 넘기지 마라.**
- **비슷한 주제는 하나로 합쳐라. 잘게 쪼개지 말고, 굵직한 결로 묶어라.**
  예: "책", "문장", "재독", "글" 같은 비슷한 결은 모두 "글" 또는 "말" 한 그룹으로 합친다.
       "시간", "기억", "옛날" 처럼 시간 결도 하나로 합친다.
- **한 그룹은 최소 ${MIN_GROUP_SIZE}개 이상의 문장을 포함해야 한다.**
  문장이 적은 그룹은 만들지 말고, 의미가 가까운 더 큰 그룹에 합쳐라.
- 모든 문장을 억지로 묶지 않아도 된다. 명확한 의미 연관이 없으면 그 문장은 어느 그룹에도 넣지 않는다.
- 한 문장이 둘 이상의 큰 그룹에 속할 수 있다 (id 중복 허용).

# 라벨 일관성
- "기존 라벨" 목록이 함께 제공된다. 이는 직전 분석에서 사용된 라벨들이다.
- 의미가 비슷한 새 그룹에는 기존 라벨을 우선 재사용한다 (예: 기존에 "고독"이 있으면 비슷한 주제는 "외로움" 같은 신규 라벨 만들지 말고 "고독" 재사용).
- 기존 라벨로 표현할 수 없는 명확히 새로운 주제만 새 라벨을 만든다.

# 출력
구조화된 JSON 스키마에 맞춰 출력한다.`

function getApiKey(): string | null {
  const raw = ANTHROPIC_API_KEY
  if (!raw) return null
  // .env.local 에 `sk-ant-...(REAL_KEY)` 같은 래퍼가 섞여있는 경우 안전 추출
  const m = raw.match(/sk-ant-[A-Za-z0-9_\-]+/g)
  if (!m) return raw.trim() || null
  return m[m.length - 1]
}

function notEnoughResponse(count: number) {
  return Response.json({
    status: 'not_enough',
    message: `문장이 더 모이면 숲이 자랍니다 (${count}/${MIN_QUOTES}개)`,
    count,
    min: MIN_QUOTES,
  })
}

function errorResponse(message: string, status = 502) {
  return Response.json(
    {
      status: 'error',
      message,
    },
    { status }
  )
}

function enrich(
  groups: Group[],
  quoteMap: Map<string, RawQuote>
): EnrichedGroup[] {
  const built = groups
    .map((g) => {
      const seen = new Set<string>()
      const quotes: EnrichedQuote[] = []
      for (const qid of g.quote_ids) {
        if (seen.has(qid)) continue
        const q = quoteMap.get(qid)
        if (!q) continue
        seen.add(qid)
        quotes.push({
          id: q.id,
          content: q.content,
          book_title: q.book?.title ?? null,
        })
      }
      return { label: g.label.trim(), quotes }
    })
    .filter((g) => g.label.length > 0 && g.quotes.length >= MIN_GROUP_SIZE)

  // 모델이 프롬프트 무시하고 잘게 쪼개면 큰 그룹만 남기는 안전망
  if (built.length > MAX_GROUPS) {
    built.sort((a, b) => b.quotes.length - a.quotes.length)
    return built.slice(0, MAX_GROUPS)
  }
  return built
}

// JSON 스키마 — structured outputs 로 모델이 형식 어기는 것 방지
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    groups: {
      type: 'array',
      description: '의미·주제별로 묶은 문장 그룹들',
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            description: '1~3자 한국어 명사 라벨',
          },
          quote_ids: {
            type: 'array',
            description: '이 그룹에 속하는 문장들의 id',
            items: { type: 'string' },
          },
        },
        required: ['label', 'quote_ids'],
        additionalProperties: false,
      },
    },
  },
  required: ['groups'],
  additionalProperties: false,
} as const

async function callClaude(
  quotes: RawQuote[],
  priorLabels: string[]
): Promise<{ groups: Group[] }> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  const client = new Anthropic({ apiKey })

  const userPayload = {
    prior_labels: priorLabels,
    quotes: quotes.map((q) => ({ id: q.id, text: q.content })),
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }, // 시스템 프롬프트는 불변 → 캐싱
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: OUTPUT_SCHEMA,
      },
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `다음은 사용자가 모은 한 줄 문장들입니다. 의미별로 묶어주세요.\n\n` +
              `prior_labels 는 직전 분석의 라벨 목록입니다 (있으면 우선 재사용).\n\n` +
              JSON.stringify(userPayload, null, 2),
          },
        ],
      },
    ],
  })

  // 첫 text 블록에서 JSON 추출
  let raw = ''
  for (const block of message.content) {
    if (block.type === 'text') {
      raw += block.text
    }
  }
  raw = raw.trim()

  // 혹시 코드펜스로 감싸져 오면 제거
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    console.error('[forest] JSON parse failed. raw =', raw.slice(0, 500))
    throw new Error('Claude 응답을 해석할 수 없어요')
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { groups?: unknown }).groups)
  ) {
    throw new Error('Claude 응답 형식이 잘못됐어요')
  }

  const groups = (parsed as { groups: unknown[] }).groups
    .map((g): Group | null => {
      if (!g || typeof g !== 'object') return null
      const obj = g as Record<string, unknown>
      if (typeof obj.label !== 'string') return null
      if (!Array.isArray(obj.quote_ids)) return null
      const ids = obj.quote_ids.filter(
        (x): x is string => typeof x === 'string'
      )
      return { label: obj.label, quote_ids: ids }
    })
    .filter((g): g is Group => g !== null)

  return { groups }
}

export async function POST(request: Request) {
  // ── 환경 변수 확인 ────────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('서버 설정이 비어 있어요', 500)
  }
  if (!getApiKey()) {
    return errorResponse(
      'ANTHROPIC_API_KEY 가 설정되지 않았어요 (.env.local)',
      500
    )
  }

  // ── 인증 ──────────────────────────────────────────────
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return Response.json(
      { status: 'unauthorized', message: '로그인이 필요해요' },
      { status: 401 }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  })
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return Response.json(
      { status: 'unauthorized', message: '세션이 유효하지 않아요' },
      { status: 401 }
    )
  }

  // ── 본인 quotes 조회 (service_role 로 RLS 우회) ──────
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: rawQuotes, error: qErr } = await admin
    .from('quotes')
    .select('id, content, book:books(title)')
    .eq('user_id', user.id)
    .order('watered_at', { ascending: false })

  if (qErr) {
    console.error('[forest] quotes query failed:', qErr)
    return errorResponse('문장을 불러오지 못했어요', 500)
  }

  const quotes = (rawQuotes ?? []) as unknown as RawQuote[]

  if (quotes.length < MIN_QUOTES) {
    return notEnoughResponse(quotes.length)
  }

  const quoteMap = new Map(quotes.map((q) => [q.id, q]))

  // ── 캐시 확인 ─────────────────────────────────────────
  let priorLabels: string[] = []
  try {
    const { data: cached } = await admin
      .from('sentence_forest_cache')
      .select('quote_count, result, labels')
      .eq('user_id', user.id)
      .maybeSingle()

    if (cached) {
      priorLabels = Array.isArray(cached.labels) ? cached.labels : []
      if (
        cached.quote_count === quotes.length &&
        cached.result &&
        Array.isArray((cached.result as { groups?: unknown }).groups)
      ) {
        const cachedGroups = (cached.result as { groups: Group[] }).groups
        const enriched = enrich(cachedGroups, quoteMap)
        return Response.json({
          status: 'ok',
          cached: true,
          quote_count: quotes.length,
          groups: enriched,
        })
      }
    }
  } catch (e) {
    // 캐시 테이블이 아직 없을 수 있음 — 무시하고 진행
    console.warn('[forest] cache table unavailable:', e)
  }

  // ── Claude 호출 ───────────────────────────────────────
  let claudeResult: { groups: Group[] }
  try {
    claudeResult = await callClaude(quotes, priorLabels)
  } catch (e) {
    console.error('[forest] Claude failed:', e)
    return errorResponse('지금은 숲을 그릴 수 없어요. 잠시 후 다시', 502)
  }

  // ── 캐시 저장 ─────────────────────────────────────────
  try {
    const newLabels = Array.from(
      new Set(
        claudeResult.groups
          .map((g) => g.label.trim())
          .filter((l) => l.length > 0)
      )
    )
    await admin
      .from('sentence_forest_cache')
      .upsert(
        {
          user_id: user.id,
          quote_count: quotes.length,
          result: claudeResult,
          labels: newLabels,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  } catch (e) {
    // 캐시 저장 실패해도 응답은 정상 진행
    console.warn('[forest] cache upsert failed:', e)
  }

  const enriched = enrich(claudeResult.groups, quoteMap)

  return Response.json({
    status: 'ok',
    cached: false,
    quote_count: quotes.length,
    groups: enriched,
  })
}
