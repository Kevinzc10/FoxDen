-- Phase 1: subtasks table
-- Maps to Subtask (from types/index.ts), child of homework.
-- user_id is denormalized here (rather than requiring a join through
-- homework for every RLS check) per approved decision — applied here
-- specifically because subtasks are clearly user-owned data with
-- independent insert/update/delete operations in the app today.

create table public.subtasks (
  id text primary key,  -- client-generated
  homework_id text not null references public.homework(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  sort_order integer not null default 0
);

create index subtasks_homework_id_idx on public.subtasks(homework_id);
create index subtasks_user_id_idx on public.subtasks(user_id);

alter table public.subtasks enable row level security;

create policy "subtasks_select_own"
  on public.subtasks for select
  using (auth.uid() = user_id);

create policy "subtasks_insert_own"
  on public.subtasks for insert
  with check (auth.uid() = user_id);

create policy "subtasks_update_own"
  on public.subtasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "subtasks_delete_own"
  on public.subtasks for delete
  using (auth.uid() = user_id);

-- Note: user_id here is trusted client input at insert time, same trust
-- model as homework.user_id. A future improvement (not this phase) would
-- be a trigger that stamps user_id from the parent homework row
-- server-side to remove that trust dependency entirely.
