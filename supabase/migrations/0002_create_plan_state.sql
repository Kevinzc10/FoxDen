-- Phase 1: plan_state table
-- Maps to PlanState (from context/PlanContext.tsx), minus devMode, which
-- is explicitly local/dev-build-only in the current code and is NOT
-- persisted here.
--
-- Adjustment from review: updated_at is now database-managed via trigger
-- instead of client-set, so it can't drift or be spoofed by client writes.

create table public.plan_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'foxplus')),
  foxscan_uses_this_week integer not null default 0 check (foxscan_uses_this_week >= 0),
  week_start_date date not null default current_date,
  updated_at timestamptz not null default now()
);

alter table public.plan_state enable row level security;

create policy "plan_state_select_own"
  on public.plan_state for select
  using (auth.uid() = user_id);

create policy "plan_state_update_own"
  on public.plan_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No INSERT/DELETE policy — same deferred-to-signup pattern as profiles.

-- --- updated_at trigger -----------------------------------------------
-- Generic, reusable function: any table that wants a DB-managed
-- updated_at column can reuse this rather than each table rolling its own.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plan_state_set_updated_at
  before update on public.plan_state
  for each row
  execute function public.set_updated_at();
