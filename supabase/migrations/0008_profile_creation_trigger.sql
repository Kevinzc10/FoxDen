-- Phase 2: create required account rows whenever Supabase creates an auth user.
--
-- This trigger is intentionally the only creation path for profiles and
-- plan_state. There are no client INSERT policies on those tables.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    coins
  )
  values (
    new.id,
    100
  );

  insert into public.plan_state (
    user_id
  )
  values (
    new.id
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
