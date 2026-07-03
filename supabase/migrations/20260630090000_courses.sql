-- =============================================================================
-- Chichi — course catalog, enrollments, orders, and watch progress.
-- Builds on 20260629120000 (profiles, stores, set_updated_at()).
-- Idempotent and safe to re-run.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'course_status') then
    create type public.course_status as enum ('draft', 'published', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'course_level') then
    create type public.course_level as enum ('beginner', 'intermediate', 'advanced', 'all_levels');
  end if;
  if not exists (select 1 from pg_type where typname = 'lesson_status') then
    create type public.lesson_status as enum ('processing', 'ready', 'error');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'enrollment_source') then
    create type public.enrollment_source as enum ('purchase', 'gift', 'admin');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Future-proofing: storefront subdomain / custom domain columns.
-- -----------------------------------------------------------------------------
alter table public.stores add column if not exists subdomain text;
alter table public.stores add column if not exists custom_domain text;
alter table public.stores add column if not exists domain_verified boolean not null default false;

create unique index if not exists stores_subdomain_key on public.stores (subdomain) where subdomain is not null;
create unique index if not exists stores_custom_domain_key on public.stores (custom_domain) where custom_domain is not null;

-- -----------------------------------------------------------------------------
-- courses
-- -----------------------------------------------------------------------------
create table if not exists public.courses (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores (id) on delete cascade,
  title              text not null default '',
  slug               text not null,
  summary            text not null default '',
  description        text not null default '',
  cover_url          text not null default '',
  price_xaf          integer not null default 0 check (price_xaf >= 0),
  level              public.course_level not null default 'all_levels',
  language           text not null default 'en',
  status             public.course_status not null default 'draft',
  total_duration_sec integer not null default 0,
  lesson_count       integer not null default 0,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (store_id, slug)
);

create index if not exists courses_store_id_idx on public.courses (store_id);
create index if not exists courses_status_idx on public.courses (status);

-- -----------------------------------------------------------------------------
-- course_sections
-- -----------------------------------------------------------------------------
create table if not exists public.course_sections (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  title      text not null default 'Untitled section',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_sections_course_id_idx on public.course_sections (course_id);

-- -----------------------------------------------------------------------------
-- lessons
-- -----------------------------------------------------------------------------
create table if not exists public.lessons (
  id             uuid primary key default gen_random_uuid(),
  section_id     uuid not null references public.course_sections (id) on delete cascade,
  course_id      uuid not null references public.courses (id) on delete cascade,
  title          text not null default 'Untitled lesson',
  position       integer not null default 0,
  is_preview     boolean not null default false,
  bunny_video_id text,
  status         public.lesson_status not null default 'processing',
  duration_sec   integer not null default 0,
  thumbnail_url  text not null default '',
  attachments    jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists lessons_section_id_idx on public.lessons (section_id);
create index if not exists lessons_course_id_idx on public.lessons (course_id);
create index if not exists lessons_bunny_video_id_idx on public.lessons (bunny_video_id) where bunny_video_id is not null;

-- -----------------------------------------------------------------------------
-- enrollments — grants playback rights for a course.
-- -----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  source     public.enrollment_source not null default 'purchase',
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists enrollments_user_id_idx on public.enrollments (user_id);
create index if not exists enrollments_course_id_idx on public.enrollments (course_id);

-- -----------------------------------------------------------------------------
-- orders — one-time course purchases (MoMo / Orange via aggregator).
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete restrict,
  amount_xaf      integer not null check (amount_xaf >= 0),
  commission_xaf  integer not null default 0,
  status          public.order_status not null default 'pending',
  provider        text,
  provider_ref    text,
  idempotency_key text unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_course_id_idx on public.orders (course_id);
create index if not exists orders_status_idx on public.orders (status);

-- -----------------------------------------------------------------------------
-- lesson_progress — per-user watch position.
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  position_sec integer not null default 0,
  completed    boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists lesson_progress_user_course_idx on public.lesson_progress (user_id, course_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['courses', 'course_sections', 'lessons', 'orders']
  loop
    execute format('drop trigger if exists %1$s_set_updated_at on public.%1$s', t);
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$s for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end$$;

-- -----------------------------------------------------------------------------
-- Ownership helper: does the current user own the store behind this course?
-- SECURITY DEFINER to keep policy expressions simple and avoid recursion.
-- -----------------------------------------------------------------------------
create or replace function public.owns_course(target_course_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.courses c
    join public.stores s on s.id = c.store_id
    where c.id = target_course_id
      and s.owner_id = auth.uid()
  );
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.orders enable row level security;
alter table public.lesson_progress enable row level security;

-- courses: public read of published; owner full control.
drop policy if exists "Published courses are public" on public.courses;
create policy "Published courses are public"
  on public.courses for select
  using (
    status = 'published'
    or exists (
      select 1 from public.stores s where s.id = courses.store_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners manage their courses" on public.courses;
create policy "Owners manage their courses"
  on public.courses for all
  to authenticated
  using (exists (select 1 from public.stores s where s.id = courses.store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.stores s where s.id = courses.store_id and s.owner_id = auth.uid()));

-- course_sections: read if parent course is readable; owner full control.
drop policy if exists "Sections readable with course" on public.course_sections;
create policy "Sections readable with course"
  on public.course_sections for select
  using (
    public.owns_course(course_id)
    or exists (select 1 from public.courses c where c.id = course_sections.course_id and c.status = 'published')
  );

drop policy if exists "Owners manage sections" on public.course_sections;
create policy "Owners manage sections"
  on public.course_sections for all
  to authenticated
  using (public.owns_course(course_id))
  with check (public.owns_course(course_id));

-- lessons: read metadata if parent course is readable; owner full control.
drop policy if exists "Lessons readable with course" on public.lessons;
create policy "Lessons readable with course"
  on public.lessons for select
  using (
    public.owns_course(course_id)
    or exists (select 1 from public.courses c where c.id = lessons.course_id and c.status = 'published')
  );

drop policy if exists "Owners manage lessons" on public.lessons;
create policy "Owners manage lessons"
  on public.lessons for all
  to authenticated
  using (public.owns_course(course_id))
  with check (public.owns_course(course_id));

-- enrollments: a user can read their own; inserts happen via service role (webhook).
drop policy if exists "Users read own enrollments" on public.enrollments;
create policy "Users read own enrollments"
  on public.enrollments for select
  to authenticated
  using (auth.uid() = user_id);

-- orders: a user reads/creates their own pending orders; status changes via service role.
drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

-- lesson_progress: a user fully manages their own rows (enrollment enforced in app/API).
drop policy if exists "Users manage own progress" on public.lesson_progress;
create policy "Users manage own progress"
  on public.lesson_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
