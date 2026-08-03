-- Phase 1: profiles table
-- Maps to Fox (from context/FoxDenContext.tsx) plus identity fields the
-- local-only app never needed before. `level` is intentionally NOT stored
-- here — it stays derived from xp via getFoxLevel() on the client, per
-- approved design.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  fox_name text not null default 'Ember',
  fox_personality text not null default 'mischievous'
    check (fox_personality in ('energetic', 'sleepy', 'mischievous', 'calm', 'wise')),
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT or DELETE policy for the authenticated role.
-- Row creation is deferred to the Phase 2 signup flow (service_role
-- or a security-definer trigger on auth.users), and account deletion
-- is explicitly out of scope for this phase.
