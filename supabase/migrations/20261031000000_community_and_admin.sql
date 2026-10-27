-- Iteration 5: common punya ghada + half-masked leaderboard, app settings, announcements.
-- Needs the admins table from 20261029000000_admin_stats.sql.

alter table public.profiles add column if not exists show_on_board boolean not null default true;  -- the user's choice
alter table public.profiles add column if not exists board_hidden boolean not null default false;  -- set by the owner

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
grant execute on function public.is_admin() to authenticated;

-- Settings the owner can change without a deploy.
create table if not exists public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security;
drop policy if exists "settings readable" on public.app_settings;
create policy "settings readable" on public.app_settings for select to anon, authenticated using (true);
drop policy if exists "settings admin write" on public.app_settings;
create policy "settings admin write" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.app_settings (key, value) values ('community_goal', '2000'), ('personal_goal', '100') on conflict (key) do nothing;

-- Messages from the owner shown on Home.
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  message jsonb not null,            -- {"en": "...", "gu": "...", "hi": "..."}
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "announcements readable" on public.announcements;
create policy "announcements readable" on public.announcements for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "announcements admin write" on public.announcements;
create policy "announcements admin write" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- "Jigar Pandya" -> "Jig** Pan***": the first half of every word stays, the rest is hidden.
create or replace function public.mask_name(n text) returns text
language sql immutable as $$
  select coalesce(nullif(string_agg(
    case when char_length(w) <= 1 then w
         else left(w, ceil(char_length(w) / 2.0)::int) || repeat('*', char_length(w) - ceil(char_length(w) / 2.0)::int) end, ' '), ''), 'Karma friend')
  from regexp_split_to_table(trim(coalesce(n, '')), '\s+') as w;
$$;

-- This week's common punya ghada and leaderboard. Only punya points, masked names and the caller's own rank leave the
-- database: no acts, no paap, no net scores, no full names.
create or replace function public.community_board() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  from_d date := (now() at time zone 'Asia/Kolkata')::date - 6;
  goal int := coalesce((select value::int from public.app_settings where key = 'community_goal'), 2000);
  res jsonb;
begin
  with pts as (
    select a.user_id, sum(a.weight)::int as points
    from public.actions a
    where a.type = 'punya' and a.entry_date >= from_d
    group by a.user_id
  ),
  ranked as (
    select pt.user_id, pt.points, pr.name,
           row_number() over (order by pt.points desc, pr.created_at) as rnk
    from pts pt join public.profiles pr on pr.id = pt.user_id
    where pr.show_on_board and not pr.board_hidden
  )
  select jsonb_build_object(
    'week_total',   coalesce((select sum(points) from pts), 0),
    'goal',         goal,
    'participants', (select count(*) from pts),
    'leaders',      coalesce((select jsonb_agg(jsonb_build_object('rank', rnk, 'name', public.mask_name(name), 'points', points, 'me', user_id = uid) order by rnk) from ranked where rnk <= 5), '[]'::jsonb),
    'me',           (select jsonb_build_object('rank', rnk, 'points', points) from ranked where user_id = uid),
    'my_points',    coalesce((select points from pts where user_id = uid), 0),
    'next_up',      (select jsonb_build_object('rank', rnk, 'name', public.mask_name(name), 'points', points) from ranked where rnk = (select rnk from ranked where user_id = uid) - 1)
  ) into res;
  return res;
end;
$$;
revoke all on function public.community_board() from public;
grant execute on function public.community_board() to authenticated;

notify pgrst, 'reload schema';
