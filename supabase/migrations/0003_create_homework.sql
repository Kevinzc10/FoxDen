-- Phase 1: homework table
-- Maps to Assignment (from types/index.ts). due_date and due_time are kept
-- as separate fields (not combined into a single timestamptz), matching
-- the existing client-side split and avoiding any parsing changes in
-- new-assignment.tsx / assignment-detail.tsx.

create table public.homework (
  id text primary key,  -- client-generated (generateId()), not a DB default
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text not null default '',
  description text not null default '',
  due_date date,
  due_time text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'overdue')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index homework_user_id_idx on public.homework(user_id);
create index homework_user_status_idx on public.homework(user_id, status);

alter table public.homework enable row level security;

create policy "homework_select_own"
  on public.homework for select
  using (auth.uid() = user_id);

create policy "homework_insert_own"
  on public.homework for insert
  with check (auth.uid() = user_id);

create policy "homework_update_own"
  on public.homework for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "homework_delete_own"
  on public.homework for delete
  using (auth.uid() = user_id);
