-- DulSai 운영/심사 필수 기능 — Supabase SQL editor 에서 1회 실행.
-- 이미 존재하는 테이블/정책은 IF NOT EXISTS / OR REPLACE 로 멱등 처리.
--
-- 적용 순서:
--   1. content_reports (신고)
--   2. user_blocks (차단)
--   3. posts.status / post_comments.status — 운영자 hidden 처리용 (이미 컬럼이 있으면 skip)
--   4. user_profiles.user_id UNIQUE — saveProfile 의 onConflict 안정성
--   5. 답글 10개 제한 trigger (선택)
--
-- 운영 절차 (별도 admin 화면 대신 Supabase Dashboard 기반):
--   - 신고 검토:   select * from content_reports where status = 'open' order by created_at desc;
--   - 처리 완료:   update content_reports set status = 'reviewed' where id = '...';
--   - 부적절 글:   update posts set status = 'hidden' where id = '...';
--   - 부적절 답글: update post_comments set status = 'hidden' where id = '...';
--   - 강제 탈퇴:   Auth → Users 에서 행 삭제 (또는 supabase functions invoke delete-account 를 admin 권한으로)


-- ──────────────────────────────────────────────────────────────────────────
-- 1. content_reports (신고)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (
    target_type in ('user', 'post', 'reply', 'message', 'conversation')
  ),
  target_id uuid not null,
  -- 'hate' 는 옛 데이터 호환을 위해 남겨둔다. 신규 클라이언트는 'harassment_hate' 사용.
  reason_kind text not null check (
    reason_kind in (
      'hate',
      'harassment_hate',
      'sexual',
      'minor_risk',
      'spam',
      'impersonation',
      'self_harm',
      'private_info',
      'other'
    )
  ),
  reason_detail text,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

-- 기존 테이블이 있던 환경 — check 제약을 새 정책으로 교체.
do $$
declare
  has_old_constraint boolean;
begin
  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'content_reports'
      and c.conname = 'content_reports_reason_kind_check'
      and pg_get_constraintdef(c.oid) not like '%harassment_hate%'
  ) into has_old_constraint;
  if has_old_constraint then
    alter table public.content_reports
      drop constraint content_reports_reason_kind_check;
    alter table public.content_reports
      add constraint content_reports_reason_kind_check
      check (reason_kind in (
        'hate', 'harassment_hate', 'sexual', 'minor_risk', 'spam',
        'impersonation', 'self_harm', 'private_info', 'other'
      ));
  end if;
end$$;

create index if not exists content_reports_status_created_idx
  on public.content_reports (status, created_at desc);
create index if not exists content_reports_target_idx
  on public.content_reports (target_type, target_id);

alter table public.content_reports enable row level security;

drop policy if exists "reporter can read own reports" on public.content_reports;
create policy "reporter can read own reports"
  on public.content_reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "reporter inserts own reports" on public.content_reports;
create policy "reporter inserts own reports"
  on public.content_reports for insert
  with check (auth.uid() = reporter_id);

-- update / delete 정책은 일부러 두지 않음 → 일반 사용자는 본인 신고도 수정·삭제 불가.
-- 운영자는 service_role 또는 Supabase Studio 의 SQL 권한으로 직접 처리.


-- ──────────────────────────────────────────────────────────────────────────
-- 2. user_blocks (차단)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_idx
  on public.user_blocks (blocker_id);

alter table public.user_blocks enable row level security;

drop policy if exists "blocker selects own blocks" on public.user_blocks;
create policy "blocker selects own blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id);

drop policy if exists "blocker inserts own blocks" on public.user_blocks;
create policy "blocker inserts own blocks"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

drop policy if exists "blocker deletes own blocks" on public.user_blocks;
create policy "blocker deletes own blocks"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);


-- ──────────────────────────────────────────────────────────────────────────
-- 3. posts.status / post_comments.status — 운영자가 'hidden' 처리하면 listPosts 가 제외
-- 이미 컬럼이 있으면 무시. text 컬럼이 아닌 경우 기존 데이터 호환을 위해 ALTER 하지 않음.
-- ──────────────────────────────────────────────────────────────────────────
alter table public.posts
  add column if not exists status text default 'visible';
alter table public.post_comments
  add column if not exists status text default 'visible';

-- ──────────────────────────────────────────────────────────────────────────
-- 3-b. posts.author_gender — 이성 간 답글 정책 enforcement 용 비정규화 컬럼
--   - 'male' | 'female' | null
--   - create-post Edge Function 이 user_profiles.gender 를 읽어 같이 insert
--   - 기존 row 는 user_profiles 조인으로 backfill
-- ──────────────────────────────────────────────────────────────────────────
alter table public.posts
  add column if not exists author_gender text check (
    author_gender in ('male', 'female') or author_gender is null
  );

-- 기존 데이터 backfill — user_profiles 에 gender 가 채워져 있는 사용자만.
update public.posts p
  set author_gender = up.gender
  from public.user_profiles up
  where p.user_id = up.user_id
    and p.author_gender is null
    and up.gender in ('male', 'female');

create index if not exists posts_author_gender_idx
  on public.posts (author_gender);


-- ──────────────────────────────────────────────────────────────────────────
-- 4. user_profiles.user_id UNIQUE — saveProfile 의 row 식별 안정성
--    (이미 unique 면 ADD CONSTRAINT 가 에러를 던지므로 DO 블럭으로 멱등 처리)
-- ──────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_user_id_key'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_user_id_key unique (user_id);
  end if;
end$$;


-- ──────────────────────────────────────────────────────────────────────────
-- 5. 답글 개수 제한 trigger — **사용하지 않음** (정책 변경).
-- DulSai 는 누구나 / 자기 글에도 / 무제한 답글을 허용한다.
-- 기존 환경에 trigger 가 남아 있다면 아래 한 줄로 제거.
-- ──────────────────────────────────────────────────────────────────────────
drop trigger if exists enforce_reply_limit_trigger on public.post_comments;
drop function if exists public.enforce_reply_limit();

-- 추가: 원글 작성자가 자기 글에 달린 답글을 hide / delete 할 수 있도록 RLS 보강 안내.
-- 일반 정책 예시 — 환경에 맞춰 기존 policy 이름과 충돌 시 drop 후 재생성.
--
-- create policy "post_owner can update reply status"
--   on public.post_comments for update
--   using (
--     exists (
--       select 1 from public.posts p
--       where p.id = post_comments.post_id
--         and p.user_id = auth.uid()
--     )
--   )
--   with check (
--     exists (
--       select 1 from public.posts p
--       where p.id = post_comments.post_id
--         and p.user_id = auth.uid()
--     )
--   );
--
-- create policy "post_owner can delete reply"
--   on public.post_comments for delete
--   using (
--     exists (
--       select 1 from public.posts p
--       where p.id = post_comments.post_id
--         and p.user_id = auth.uid()
--     )
--   );


-- 적용 확인:
--   select * from content_reports limit 1;
--   select * from user_blocks limit 1;
--   select column_name, data_type from information_schema.columns
--     where table_schema='public' and table_name='posts' and column_name='status';
--   select conname from pg_constraint where conname='user_profiles_user_id_key';

-- ──────────────────────────────────────────────────────────────────────────
-- 6. (권장) posts / post_comments INSERT 를 Edge Function 만 가능하도록 제한
--
-- 현재 클라이언트는 supabase.from('posts').insert(...) 를 직접 호출하지 않고
-- Edge Function `create-post` / `create-reply` 를 통해서만 작성한다.
-- Edge Function 은 service_role 키로 동작하므로 RLS 를 자동 우회한다.
-- 따라서 authenticated 사용자의 직접 INSERT 를 막아도 정상 작성 흐름은 영향을 받지 않으며,
-- 우회 시도(API 직접 호출 / SDK 우회) 가 차단된다.
--
-- 단, Edge Function 두 개를 deploy 한 다음에 실행해야 한다. 순서:
--   1) supabase functions deploy create-post
--   2) supabase functions deploy create-reply
--   3) 새 클라이언트 빌드 배포 / TestFlight 확인
--   4) 아래 두 정책 적용
--
-- 적용 전 기존 INSERT 정책 이름을 확인 후 drop 한다. Supabase 가 자동 생성한 정책 이름이
-- 환경별로 다를 수 있어 정책을 모두 조회 후 수동 정리하는 것이 안전.
--
-- 예시 (실 운영 시 정책 이름은 환경에 맞춰 수정):
--   drop policy if exists "Allow authenticated to insert posts" on public.posts;
--   drop policy if exists "posts insert by authenticated" on public.posts;
--   drop policy if exists "Allow authenticated to insert post_comments" on public.post_comments;
--   -- 그 외 환경별 정책 정리...
--
-- 위 정책을 모두 제거하면 authenticated 사용자는 INSERT 가 불가능해지고,
-- service_role 만 INSERT 가 가능하다 (RLS 우회).
--
-- 만약 임시로 authenticated 직접 INSERT 를 허용해야 하면 (예: Edge Function 미배포 상태에서 디버깅):
--   create policy "temporary direct insert" on public.posts for insert
--     with check (auth.uid() = user_id);
-- 처럼 임시 정책을 추가하고, Edge Function 라우팅이 안정된 뒤 drop.


-- PostgREST schema cache 갱신:
notify pgrst, 'reload schema';
