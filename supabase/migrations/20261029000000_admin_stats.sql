-- Admin panel numbers. Counts only: no names, no emails, no diary text, no acts.
-- Only emails listed in public.admins can call admin_stats(); everyone else gets an error.
-- After running this, add yourself (once), using the email you sign in with:
--   insert into public.admins (email) values ('you@example.com');

create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security; -- no policies: nobody can read or write it from the app

create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  who text := lower(coalesce(auth.jwt() ->> 'email', ''));
  today date := (now() at time zone 'Asia/Kolkata')::date;
  out jsonb;
begin
  if who = '' or not exists (select 1 from public.admins a where lower(a.email) = who) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users_total',     (select count(*) from auth.users),
    'users_today',     (select count(*) from auth.users where (created_at at time zone 'Asia/Kolkata')::date = today),
    'users_7d',        (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'onboarded',       (select count(*) from public.profiles where onboarding_done),
    'visitors_total',  (select count(*) from public.site_visitors),
    'visitors_today',  (select count(*) from public.site_visitors where (first_seen at time zone 'Asia/Kolkata')::date = today),
    'analyses_total',  (select count(*) from public.entries),
    'analyses_today',  (select count(*) from public.entries where (created_at at time zone 'Asia/Kolkata')::date = today),
    'active_7d',       (select count(distinct user_id) from public.entries where created_at > now() - interval '7 days'),
    'by_language',     coalesce((select jsonb_object_agg(language, n) from (select language, count(*) n from public.profiles group by language) l), '{}'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', d::date,
        'signups',  (select count(*) from auth.users u where (u.created_at at time zone 'Asia/Kolkata')::date = d::date),
        'analyses', (select count(*) from public.entries e where (e.created_at at time zone 'Asia/Kolkata')::date = d::date),
        'visitors', (select count(*) from public.site_visitors v where (v.first_seen at time zone 'Asia/Kolkata')::date = d::date)
      ) order by d)
      from generate_series(today - 13, today, interval '1 day') d
    ), '[]'::jsonb)
  ) into out;
  return out;
end;
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;
notify pgrst, 'reload schema';
