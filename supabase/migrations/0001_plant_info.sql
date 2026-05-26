-- ============================================================
-- plant_info: KDC 0~9 분류별 대표 식물 정보 캐시
-- 산림청 국가표준식물목록 API(일일 1000건 제한) 응답을 보관
-- ============================================================

create table if not exists public.plant_info (
  kdc_code    text primary key,            -- KDC 1자리 (0~9)
  plant_name  text not null,               -- 한글 식물명
  sci_name    text not null,               -- 학명 (산림청 API 검색 키)
  family_kor  text,                        -- 과명 (한글) — falmKorNm
  family_sci  text,                        -- 과명 (학명) — falmNm
  genus_kor   text,                        -- 속명 (한글) — genusKorNm
  genus_sci   text,                        -- 속명 (학명) — genusNm
  description text,                        -- 부가 설명 / 비고
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists plant_info_sci_name_key
  on public.plant_info (sci_name);

-- updated_at 자동 갱신 트리거 ---------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists plant_info_set_updated_at on public.plant_info;
create trigger plant_info_set_updated_at
  before update on public.plant_info
  for each row execute function public.set_updated_at();

-- RLS: 읽기 공개, 쓰기는 service_role 만 ----------------------
alter table public.plant_info enable row level security;

drop policy if exists "plant_info_read_all" on public.plant_info;
create policy "plant_info_read_all"
  on public.plant_info
  for select
  using (true);

-- ============================================================
-- 초기 시드: KDC_PLANT_MAP 10종 (lib/plants.ts와 동기)
-- family_sci / genus_kor / genus_sci / description 는
-- 이후 산림청 API 동기화 단계에서 채워짐
-- ============================================================
insert into public.plant_info (kdc_code, plant_name, sci_name, family_kor) values
  ('0', '솔이끼',   'Polytrichum commune',       '솔이끼과'),
  ('1', '할미꽃',   'Pulsatilla koreana',        '미나리아재비과'),
  ('2', '연꽃',     'Nelumbo nucifera',          '수련과'),
  ('3', '느티나무', 'Zelkova serrata',           '느릅나무과'),
  ('4', '구절초',   'Dendranthema zawadskii',    '국화과'),
  ('5', '대나무',   'Phyllostachys bambusoides', '벼과'),
  ('6', '진달래',   'Rhododendron mucronulatum', '진달래과'),
  ('7', '으아리',   'Clematis terniflora',       '미나리아재비과'),
  ('8', '매화',     'Prunus mume',               '장미과'),
  ('9', '소나무',   'Pinus densiflora',          '소나무과')
on conflict (kdc_code) do update
  set plant_name = excluded.plant_name,
      sci_name   = excluded.sci_name,
      family_kor = excluded.family_kor;
