-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: drops app policies/tables first. Does not touch auth.users.

create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.run_splits cascade;
drop table if exists public.runs cascade;
drop table if exists public.share_sessions cascade;
drop table if exists public.sections cascade;
drop table if exists public.categories cascade;
drop table if exists public.game_profiles cascade;
drop table if exists public.user_settings cascade;

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  chroma_hex text not null default '#00b140',
  transparent_background boolean not null default false,
  font_scale numeric not null default 1,
  font_family text not null default 'geist-mono',
  show_best_of boolean not null default true,
  show_sum_of_best boolean not null default true,
  show_pb_delta boolean not null default true,
  show_section_delta boolean not null default false,
  compare_mode text not null default 'pb' check (compare_mode in ('pb', 'target')),
  shortcut_start text,
  shortcut_stop text,
  shortcut_split text,
  shortcut_reset text,
  shortcut_undo text,
  shortcut_next_section text,
  updated_at timestamptz not null default now()
);

create table public.game_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  game_profile_id uuid not null references public.game_profiles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_time_ms bigint,
  created_at timestamptz not null default now()
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique (category_id, sort_order)
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  completed_at timestamptz,
  is_valid boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.run_splits (
  run_id uuid not null references public.runs (id) on delete cascade,
  section_id uuid not null references public.sections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  time_ms bigint not null,
  primary key (run_id, section_id)
);

create table public.share_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  token text not null unique,
  referee_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_split_at timestamptz,
  closed_at timestamptz
);

create index game_profiles_user_id_idx on public.game_profiles (user_id);
create index categories_user_id_idx on public.categories (user_id);
create index categories_game_profile_id_idx on public.categories (game_profile_id);
create index sections_category_id_idx on public.sections (category_id);
create index runs_user_category_idx on public.runs (user_id, category_id, started_at desc);
create index run_splits_user_id_idx on public.run_splits (user_id);
create index share_sessions_token_idx on public.share_sessions (token);

alter table public.user_settings enable row level security;
alter table public.game_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.sections enable row level security;
alter table public.runs enable row level security;
alter table public.run_splits enable row level security;
alter table public.share_sessions enable row level security;

create policy "user_settings_select" on public.user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update" on public.user_settings for update using (auth.uid() = user_id);

create policy "game_profiles_select" on public.game_profiles for select using (auth.uid() = user_id);
create policy "game_profiles_insert" on public.game_profiles for insert with check (auth.uid() = user_id);
create policy "game_profiles_update" on public.game_profiles for update using (auth.uid() = user_id);
create policy "game_profiles_delete" on public.game_profiles for delete using (auth.uid() = user_id);

create policy "categories_select" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert" on public.categories for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.game_profiles g
    where g.id = game_profile_id and g.user_id = auth.uid()
  )
);
create policy "categories_update" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete" on public.categories for delete using (auth.uid() = user_id);

create policy "sections_select" on public.sections for select using (auth.uid() = user_id);
create policy "sections_insert" on public.sections for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.categories c
    where c.id = category_id and c.user_id = auth.uid()
  )
);
create policy "sections_update" on public.sections for update using (auth.uid() = user_id);
create policy "sections_delete" on public.sections for delete using (auth.uid() = user_id);

create policy "runs_select" on public.runs for select using (auth.uid() = user_id);
create policy "runs_insert" on public.runs for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.categories c
    where c.id = category_id and c.user_id = auth.uid()
  )
);
create policy "runs_update" on public.runs for update using (auth.uid() = user_id);
create policy "runs_delete" on public.runs for delete using (auth.uid() = user_id);

create policy "run_splits_select" on public.run_splits for select using (auth.uid() = user_id);
create policy "run_splits_insert" on public.run_splits for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.runs r
    where r.id = run_id and r.user_id = auth.uid()
  )
);
create policy "run_splits_update" on public.run_splits for update using (auth.uid() = user_id);
create policy "run_splits_delete" on public.run_splits for delete using (auth.uid() = user_id);

create policy "share_sessions_select" on public.share_sessions for select using (auth.uid() = user_id);
create policy "share_sessions_insert" on public.share_sessions for insert with check (auth.uid() = user_id);
create policy "share_sessions_update" on public.share_sessions for update using (auth.uid() = user_id);
create policy "share_sessions_delete" on public.share_sessions for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;
