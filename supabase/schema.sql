-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: drops app policies/tables first. Does not touch auth.users.

create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.run_splits cascade;
drop table if exists public.runs cascade;
drop table if exists public.custom_target_splits cascade;
drop table if exists public.sections cascade;
drop table if exists public.categories cascade;
drop table if exists public.game_profiles cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.user_settings cascade;

create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  chroma_hex text not null default '#00b140',
  transparent_background boolean not null default false,
  font_scale numeric not null default 1,
  font_family text not null default 'geist-mono',
  show_best_of boolean not null default true,
  show_sum_of_best boolean not null default true,
  show_compare_delta boolean not null default true,
  show_section_delta boolean not null default false,
  compare_mode text not null default 'pb'
    check (compare_mode in ('pb', 'target')),
  shortcut_start text,
  shortcut_stop text,
  shortcut_split text,
  shortcut_reset text,
  shortcut_undo text,
  shortcut_next_section text,
  shortcut_start_split text,
  shortcut_pause text,
  shortcut_skip text,
  double_tap_delay_ms integer not null default 300,
  save_incomplete_runs boolean not null default false,
  visible_split_count integer,
  updated_at timestamptz not null default now(),

  constraint user_settings_visible_split_count_check
    check (
      visible_split_count is null
      or visible_split_count >= 1
    )

  Constraint user_settings_double_tap_delay_ms_check
    check (
      double_tap_delay_ms >= 0
      and double_tap_delay_ms <= 5000
    )
);

create table public.user_profiles (
  user_id uuid primary key
    references auth.users (id)
    on delete cascade,

  display_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_profiles_display_name_check
    check (
      display_name is null
      or (
        char_length(trim(display_name)) > 0
        and char_length(trim(display_name)) <= 50
      )
    )
);

  

create table public.game_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  game_profile_id uuid not null
    references public.game_profiles (id)
    on delete cascade,

  user_id uuid not null
    references auth.users (id)
    on delete cascade,

  name text not null,

  target_time_ms bigint,

  compare_mode text not null default 'personal_best'
    check (
      compare_mode in (
        'personal_best',
        'custom_target',
        'latest_run',
        'worst_run'
      )
    ),

  attempt_count integer not null default 0
    check (attempt_count >= 0),

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


create index game_profiles_user_id_idx on public.game_profiles (user_id);
create index categories_user_id_idx on public.categories (user_id);
create index categories_game_profile_id_idx on public.categories (game_profile_id);
create index sections_category_id_idx on public.sections (category_id);
create index runs_user_category_idx on public.runs (user_id, category_id, started_at desc);
create index run_splits_user_id_idx on public.run_splits (user_id);


alter table public.sections
  add constraint sections_id_category_user_key
  unique (id, category_id, user_id);

alter table public.game_profiles
  add constraint game_profiles_id_user_id_key
  unique (id, user_id);

alter table public.categories
  add constraint categories_id_user_id_key
  unique (id, user_id);

alter table public.runs
  add constraint runs_id_user_id_key
  unique (id, user_id);

alter table public.sections
  add constraint sections_id_user_id_key
  unique (id, user_id);

create table public.custom_target_splits (
  category_id uuid not null,
  section_id uuid not null,
  user_id uuid not null,

  -- Cumulatieve target split-time, niet de losse segmenttijd.
  time_ms bigint not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (category_id, section_id, user_id),

  constraint custom_target_splits_time_check
    check (time_ms >= 0),

  constraint custom_target_splits_category_user_fkey
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete cascade,

  constraint custom_target_splits_section_category_user_fkey
    foreign key (section_id, category_id, user_id)
    references public.sections (id, category_id, user_id)
    on delete cascade
);

alter table public.categories
  add constraint categories_profile_user_fkey
  foreign key (game_profile_id, user_id)
  references public.game_profiles (id, user_id)
  on delete cascade;

alter table public.sections
  add constraint sections_category_user_fkey
  foreign key (category_id, user_id)
  references public.categories (id, user_id)
  on delete cascade;

alter table public.runs
  add constraint runs_category_user_fkey
  foreign key (category_id, user_id)
  references public.categories (id, user_id)
  on delete cascade;

alter table public.run_splits
  add constraint run_splits_run_user_fkey
  foreign key (run_id, user_id)
  references public.runs (id, user_id)
  on delete cascade;

alter table public.run_splits
  add constraint run_splits_section_user_fkey
  foreign key (section_id, user_id)
  references public.sections (id, user_id)
  on delete cascade;

alter table public.user_settings enable row level security;
alter table public.user_profiles enable row level security;
alter table public.game_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.sections enable row level security;
alter table public.custom_target_splits enable row level security;
alter table public.runs enable row level security;
alter table public.run_splits enable row level security;


create policy "user_settings_select"
on public.user_settings
for select
using (auth.uid() = user_id);

create policy "user_settings_insert"
on public.user_settings
for insert
with check (auth.uid() = user_id);

create policy "user_settings_update"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);



create policy "game_profiles_select"
on public.game_profiles
for select
using (auth.uid() = user_id);

create policy "game_profiles_insert"
on public.game_profiles
for insert
with check (auth.uid() = user_id);

create policy "game_profiles_update"
on public.game_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "game_profiles_delete"
on public.game_profiles
for delete
using (auth.uid() = user_id);


create policy "categories_select"
on public.categories
for select
using (auth.uid() = user_id);

create policy "categories_insert"
on public.categories
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.game_profiles gp
    where gp.id = game_profile_id
      and gp.user_id = auth.uid()
  )
);

create policy "categories_update"
on public.categories
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.game_profiles gp
    where gp.id = game_profile_id
      and gp.user_id = auth.uid()
  )
);

create policy "categories_delete"
on public.categories
for delete
using (auth.uid() = user_id);


create policy "sections_select"
on public.sections
for select
using (auth.uid() = user_id);

create policy "sections_insert"
on public.sections
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);

create policy "sections_update"
on public.sections
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);

create policy "sections_delete"
on public.sections
for delete
using (auth.uid() = user_id);


create policy "runs_select"
on public.runs
for select
using (auth.uid() = user_id);

create policy "runs_insert"
on public.runs
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);

create policy "runs_update"
on public.runs
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
);

create policy "runs_delete"
on public.runs
for delete
using (auth.uid() = user_id);


create policy "run_splits_select"
on public.run_splits
for select
using (auth.uid() = user_id);

create policy "run_splits_insert"
on public.run_splits
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.runs r
    join public.sections s
      on s.id = section_id
    where r.id = run_id
      and r.user_id = auth.uid()
      and s.user_id = auth.uid()
      and r.category_id = s.category_id
  )
);

create policy "run_splits_update"
on public.run_splits
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.runs r
    join public.sections s
      on s.id = section_id
    where r.id = run_id
      and r.user_id = auth.uid()
      and s.user_id = auth.uid()
      and r.category_id = s.category_id
  )
);

create policy "run_splits_delete"
on public.run_splits
for delete
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create policy "user_profiles_select_own"
on public.user_profiles
for select
using (
  auth.uid() = user_id
);

create policy "user_profiles_insert_own"
on public.user_profiles
for insert
with check (
  auth.uid() = user_id
);

create policy "user_profiles_update_own"
on public.user_profiles
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "user_profiles_delete_own"
on public.user_profiles
for delete
using (
  auth.uid() = user_id
);

create policy "custom_target_splits_select_own"
on public.custom_target_splits
for select
using (
  auth.uid() = user_id
);

create policy "custom_target_splits_insert_own"
on public.custom_target_splits
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories as c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.sections as s
    where s.id = section_id
      and s.category_id = category_id
      and s.user_id = auth.uid()
  )
);

create policy "custom_target_splits_update_own"
on public.custom_target_splits
for update
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categories as c
    where c.id = category_id
      and c.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.sections as s
    where s.id = section_id
      and s.category_id = category_id
      and s.user_id = auth.uid()
  )
);

create policy "custom_target_splits_delete_own"
on public.custom_target_splits
for delete
using (
  auth.uid() = user_id
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

create trigger custom_target_splits_set_updated_at
before update on public.custom_target_splits
for each row
execute function public.set_updated_at();

insert into public.user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.user_profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

