-- Phase 1: daily_hunts table
-- Maps to DailyHunt (from types/index.ts), simplified: only the
-- `date` and `claimed` fields are persisted. Objective generation and
-- progress calculation (generateDailyHunt, calcHuntProgress in
-- context/FoxDenContext.tsx) stay entirely client-side, per approved
-- decision. There is no hunt_objectives table.

create table public.daily_hunts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  claimed boolean not null default false,
  unique (user_id, date)  -- one hunt row per user per day
);

create index daily_hunts_user_date_idx on public.daily_hunts(user_id, date);

alter table public.daily_hunts enable row level security;

create policy "daily_hunts_select_own"
  on public.daily_hunts for select
  using (auth.uid() = user_id);

create policy "daily_hunts_insert_own"
  on public.daily_hunts for insert
  with check (auth.uid() = user_id);

create policy "daily_hunts_update_own"
  on public.daily_hunts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No DELETE policy — no delete flow needed; a new day just gets a new row.
