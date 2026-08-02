-- Phase 1: focus_sessions table
-- Maps to FocusSessionRecord (from types/index.ts). Append-only by design:
-- no UPDATE or DELETE policy, matching current app behavior (no
-- editFocusSession/deleteFocusSession exists in context/FoxDenContext.tsx).

create table public.focus_sessions (
  id text primary key,  -- client-generated
  user_id uuid not null references public.profiles(id) on delete cascade,
  homework_id text references public.homework(id) on delete set null,
  date date not null,
  minutes integer not null check (minutes > 0)
);

create index focus_sessions_user_date_idx on public.focus_sessions(user_id, date);

alter table public.focus_sessions enable row level security;

create policy "focus_sessions_select_own"
  on public.focus_sessions for select
  using (auth.uid() = user_id);

create policy "focus_sessions_insert_own"
  on public.focus_sessions for insert
  with check (auth.uid() = user_id);

-- No UPDATE or DELETE policy — append-only, intentionally.
