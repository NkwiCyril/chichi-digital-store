-- =============================================================================
-- Chichi digital marketplace — core data model
-- Tables: profiles, stores
-- Storage: avatars bucket
-- Includes RLS policies, updated_at triggers, new-user trigger, and a backfill
-- for users that signed up before this migration.
-- This migration is idempotent and safe to re-run.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('buyer', 'creator');
  end if;
  if not exists (select 1 from pg_type where typname = 'store_category') then
    create type public.store_category as enum ('ebooks', 'templates', 'courses', 'software', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'payout_method') then
    create type public.payout_method as enum ('mtn', 'orange');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- profiles
-- One row per auth user. Canonical store for identity + onboarding state.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                          uuid primary key references auth.users (id) on delete cascade,
  display_name                text not null default '',
  avatar_url                  text not null default '',
  bio                         text not null default '',
  roles                       public.app_role[] not null default array['buyer']::public.app_role[],
  active_role                 public.app_role not null default 'buyer',
  signup_intent               public.app_role not null default 'buyer',
  onboarding_complete         boolean not null default false,
  creator_onboarding_complete boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.profiles is 'Per-user identity and onboarding state for Chichi.';

-- -----------------------------------------------------------------------------
-- stores
-- One storefront per creator (owner_id unique). Holds payout details.
-- -----------------------------------------------------------------------------
create table if not exists public.stores (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null unique references public.profiles (id) on delete cascade,
  name           text not null,
  slug           text not null unique,
  category       public.store_category not null default 'other',
  payout_method  public.payout_method,
  payout_number  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.stores is 'Creator storefronts. Slug is the public store URL segment.';

create index if not exists stores_owner_id_idx on public.stores (owner_id);
create index if not exists stores_slug_idx on public.stores (slug);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create a profile when a new auth user is created.
-- Reads any metadata supplied at sign-up (display name, intent).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_intent public.app_role;
begin
  begin
    meta_intent := coalesce(nullif(new.raw_user_meta_data ->> 'signup_intent', ''), 'buyer')::public.app_role;
  exception when others then
    meta_intent := 'buyer';
  end;

  insert into public.profiles (id, display_name, signup_intent)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      ''
    ),
    meta_intent
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.stores enable row level security;

-- profiles: public read (marketplace profiles), owner-only writes.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- stores: public read, owner-only writes.
drop policy if exists "Stores are viewable by everyone" on public.stores;
create policy "Stores are viewable by everyone"
  on public.stores for select
  using (true);

drop policy if exists "Owners can insert their store" on public.stores;
create policy "Owners can insert their store"
  on public.stores for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their store" on public.stores;
create policy "Owners can update their store"
  on public.stores for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete their store" on public.stores;
create policy "Owners can delete their store"
  on public.stores for delete
  to authenticated
  using (auth.uid() = owner_id);

-- -----------------------------------------------------------------------------
-- Storage: public `avatars` bucket. Files live under `{user_id}/...`.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- Backfill: create profiles for any pre-existing users.
-- -----------------------------------------------------------------------------
insert into public.profiles (id, display_name, avatar_url, bio, signup_intent)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'display_name', ''),
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    ''
  ),
  coalesce(nullif(u.raw_user_meta_data ->> 'avatar_url', ''), ''),
  coalesce(nullif(u.raw_user_meta_data ->> 'bio', ''), ''),
  coalesce(
    case
      when (u.raw_user_meta_data ->> 'signup_intent') in ('buyer', 'creator')
        then u.raw_user_meta_data ->> 'signup_intent'
      else 'buyer'
    end::public.app_role,
    'buyer'
  )
from auth.users u
on conflict (id) do nothing;
