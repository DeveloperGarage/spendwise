-- Paste into the hosted Supabase SQL editor (Authentication → Hooks → Before User Created).
-- Local Docker Postgres is not GoTrue; Hono still checks allowed_emails on every login.
-- Do not disable Auth sign-ups globally: that blocks the first Google login for an allowed person.

create or replace function public.hook_restrict_signup_by_allowlist(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  incoming_email text;
begin
  incoming_email := lower(event->'user'->>'email');

  if incoming_email is null or incoming_email = '' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Email is required.',
        'http_code', 403
      )
    );
  end if;

  if not exists (
    select 1
    from public.allowed_emails
    where lower(email) = incoming_email
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'This email is not allowed to sign in.',
        'http_code', 403
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant execute on function public.hook_restrict_signup_by_allowlist(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_by_allowlist(jsonb) from authenticated, anon, public;
