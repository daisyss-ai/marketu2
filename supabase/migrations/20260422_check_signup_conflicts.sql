-- Helper to detect duplicate signup values (email / student id) with a single RPC call.
-- This avoids generic "Database error saving new user" when DB triggers fail on unique constraints.

create or replace function public.check_signup_conflicts(p_email text, p_student_id text)
returns table(email_exists boolean, student_id_exists boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  has_profiles boolean := to_regclass('public.profiles') is not null;
begin
  email_exists := exists(
    select 1
    from auth.users u
    where lower(u.email) = lower(p_email)
  );

  student_id_exists := exists(
    select 1
    from public.users u
    where u.enrollment_code = p_student_id
  );

  if has_profiles then
    student_id_exists := student_id_exists or exists(
      select 1
      from public.profiles p
      where p.student_id = p_student_id
    );
  end if;

  return next;
end;
$$;

revoke all on function public.check_signup_conflicts(text, text) from public;
grant execute on function public.check_signup_conflicts(text, text) to anon, authenticated;

