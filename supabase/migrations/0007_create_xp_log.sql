-- Phase 1: xp_log table
-- Maps to XPRecord (from types/index.ts). Deliberately immutable and
-- append-only: no UPDATE or DELETE policy at all, not even for the
-- owning user, since this is a log of XP events and current code never
-- edits or removes entries.
--
-- KNOWN GAP (documented, not solved in this phase): `amount` is trusted
-- client input, constrained only by application logic on the client
-- (awardXP in context/FoxDenContext.tsx), not validated server-side.
-- Same trust model applies to profiles.xp and profiles.coins. This is an
-- acceptable risk for a cosmetic-only economy today, but should be
-- revisited (e.g. via a security-definer RPC that computes XP/coin
-- awards server-side) before FoxCoins carry real monetary value, such as
-- if real-money purchases are introduced in a future phase.

create table public.xp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  amount integer not null,
  reason text not null default ''
);

create index xp_log_user_date_idx on public.xp_log(user_id, date);

alter table public.xp_log enable row level security;

create policy "xp_log_select_own"
  on public.xp_log for select
  using (auth.uid() = user_id);

create policy "xp_log_insert_own"
  on public.xp_log for insert
  with check (auth.uid() = user_id);

-- Deliberately no UPDATE or DELETE policy — immutable append-only log.
