-- ============================================================
-- 문장 숲(Sentence Forest) 분석 결과 캐시
-- - user_id 당 한 행
-- - quote_count 가 그대로면 캐시 hit → Claude 재호출 안 함
-- - labels: 이전 분석에서 사용된 라벨 (다음 분석에 "재사용 우선" 힌트로 전달)
-- - result: { groups: [{ label, quote_ids }] } JSONB
--
-- ⚠️ Supabase SQL Editor 에서 사용자가 직접 실행.
-- ============================================================

create table if not exists public.sentence_forest_cache (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quote_count integer not null default 0,
  result jsonb not null default '{"groups":[]}'::jsonb,
  labels text[] not null default array[]::text[],
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sentence_forest_cache_touch on public.sentence_forest_cache;
create trigger sentence_forest_cache_touch
  before update on public.sentence_forest_cache
  for each row execute function public.touch_updated_at();

alter table public.sentence_forest_cache enable row level security;

drop policy if exists sentence_forest_cache_select_own on public.sentence_forest_cache;
create policy sentence_forest_cache_select_own
  on public.sentence_forest_cache
  for select
  using (auth.uid() = user_id);

-- 쓰기는 서비스 롤(서버 라우트)만 — anon/authenticated 에는 insert/update 권한 없음
-- service_role 은 RLS 우회하므로 별도 정책 불필요
