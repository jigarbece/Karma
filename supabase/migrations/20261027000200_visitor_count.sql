-- Anonymous visitor counter: counts unique browsers by a random id. No personal data is stored.
-- The table has RLS on and NO policies, so nobody can read or write it directly; only the two functions below can.

create table if not exists public.site_visitors (
  visitor_id uuid primary key,
  first_seen timestamptz not null default now()
);
alter table public.site_visitors enable row level security;

-- Registers a visitor (once per random id) and returns the total number of unique visitors.
create or replace function public.register_visit(vid uuid) returns bigint
language plpgsql security definer set search_path = public as $$
begin
  insert into public.site_visitors (visitor_id) values (vid) on conflict do nothing;
  return (select count(*) from public.site_visitors);
end;
$$;

-- Returns the total without registering anyone (used when the browser sends Do Not Track).
create or replace function public.visitor_count() returns bigint
language sql stable security definer set search_path = public as $$
  select count(*) from public.site_visitors;
$$;

revoke all on function public.register_visit(uuid) from public;
revoke all on function public.visitor_count() from public;
grant execute on function public.register_visit(uuid) to anon, authenticated;
grant execute on function public.visitor_count() to anon, authenticated;

notify pgrst, 'reload schema';
