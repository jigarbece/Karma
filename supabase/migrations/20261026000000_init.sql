-- Karma schema. Every table has RLS ON; a user can only touch their own rows.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (id = auth user id)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text        not null default '',
  language        text        not null default 'gu'  check (language in ('gu', 'hi', 'en')),
  tradition       text        not null default 'hindu_gita' check (tradition in ('hindu_gita', 'jain', 'swaminarayan', 'general')),
  greeting        text        not null default 'jsk' check (greeting in ('jsk', 'jj', 'jsw', 'namaste', 'radhe')),
  goals           text[]      not null default '{}',
  timezone        text        not null default 'Asia/Kolkata',
  city            text        not null default 'Ahmedabad',
  reminder_time   time,
  consent_at      timestamptz,
  onboarding_done boolean     not null default false,
  keep_words      boolean     not null default true,  -- "Keep my words": false => transcript deleted after analysis
  theme           text        not null default 'light' check (theme in ('light', 'dark')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- entries: one analysed message. Audio is never stored.
-- ---------------------------------------------------------------------------
create table public.entries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date     date not null,                       -- the user's local date
  transcript     text,                                -- null when keep_words = false
  language       text not null default 'en' check (language in ('gu', 'hi', 'en')),
  ai_provider    text,
  ai_model       text,
  rubric_version text,
  created_at     timestamptz not null default now()
);
create index entries_user_date_idx on public.entries (user_id, entry_date);

-- ---------------------------------------------------------------------------
-- actions: scored items found in an entry. weight is a positive magnitude (1-5).
-- ---------------------------------------------------------------------------
create table public.actions (
  id             uuid primary key default gen_random_uuid(),
  entry_id       uuid not null references public.entries (id) on delete cascade,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date     date not null,                       -- denormalised from entries for fast range queries
  summary        text not null,
  type           text not null check (type in ('punya', 'paap', 'neutral')),
  category       text not null check (category in (
                   'seva', 'family_duty', 'jeev_daya', 'satya', 'vani', 'krodh',
                   'honesty_work', 'daan', 'discipline_health', 'gratitude_bhakti', 'ahimsa_food')),
  weight         integer not null check (weight between 0 and 5),
  reason         text not null default '',
  intention_note text not null default '',
  created_at     timestamptz not null default now()
);
create index actions_user_date_idx on public.actions (user_id, entry_date);

create table public.action_feedback (
  id         uuid primary key default gen_random_uuid(),
  action_id  uuid not null references public.actions (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  comment    text not null check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create table public.reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date not null,
  teaching_id text not null,
  suggestion  text not null default '',
  created_at  timestamptz not null default now()
);
create index reflections_user_date_idx on public.reflections (user_id, date);

create table public.pratikraman (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  action_id  uuid not null references public.actions (id) on delete cascade,
  reflection text not null default '' check (char_length(reflection) <= 2000),
  commitment text not null default '' check (char_length(commitment) <= 500),
  created_at timestamptz not null default now()
);

-- Rate limiting for the analyse-day function (one row per analysis attempt).
create table public.analysis_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  created_at timestamptz not null default now()
);
create index analysis_log_user_day_idx on public.analysis_log (user_id, local_date);

-- ---------------------------------------------------------------------------
-- daily_summary view (runs with the caller's rights, so RLS applies)
-- ---------------------------------------------------------------------------
create view public.daily_summary with (security_invoker = true) as
with per_cat as (
  select user_id, entry_date, category,
         sum(case type when 'punya' then weight when 'paap' then -weight else 0 end)::int as net
    from public.actions
   group by user_id, entry_date, category
)
select a.user_id,
       a.entry_date as date,
       coalesce(sum(a.weight) filter (where a.type = 'punya'), 0)::int as punya_total,
       coalesce(sum(a.weight) filter (where a.type = 'paap'), 0)::int  as paap_total,
       (coalesce(sum(a.weight) filter (where a.type = 'punya'), 0)
        - coalesce(sum(a.weight) filter (where a.type = 'paap'), 0))::int as net,
       (select jsonb_object_agg(c.category, c.net)
          from per_cat c
         where c.user_id = a.user_id and c.entry_date = a.entry_date) as category_totals
  from public.actions a
 group by a.user_id, a.entry_date;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.entries         enable row level security;
alter table public.actions         enable row level security;
alter table public.action_feedback enable row level security;
alter table public.reflections     enable row level security;
alter table public.pratikraman     enable row level security;
alter table public.analysis_log    enable row level security;

create policy profiles_select on public.profiles for select using (id = auth.uid());
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete on public.profiles for delete using (id = auth.uid());

create policy entries_select on public.entries for select using (user_id = auth.uid());
create policy entries_insert on public.entries for insert with check (user_id = auth.uid());
create policy entries_update on public.entries for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy entries_delete on public.entries for delete using (user_id = auth.uid());

create policy actions_select on public.actions for select using (user_id = auth.uid());
create policy actions_insert on public.actions for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid()));
create policy actions_update on public.actions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy actions_delete on public.actions for delete using (user_id = auth.uid());

create policy feedback_select on public.action_feedback for select using (user_id = auth.uid());
create policy feedback_insert on public.action_feedback for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.actions a where a.id = action_id and a.user_id = auth.uid()));
create policy feedback_update on public.action_feedback for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy feedback_delete on public.action_feedback for delete using (user_id = auth.uid());

create policy reflections_select on public.reflections for select using (user_id = auth.uid());
create policy reflections_insert on public.reflections for insert with check (user_id = auth.uid());
create policy reflections_update on public.reflections for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reflections_delete on public.reflections for delete using (user_id = auth.uid());

create policy pratikraman_select on public.pratikraman for select using (user_id = auth.uid());
create policy pratikraman_insert on public.pratikraman for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.actions a where a.id = action_id and a.user_id = auth.uid()));
create policy pratikraman_update on public.pratikraman for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy pratikraman_delete on public.pratikraman for delete using (user_id = auth.uid());

create policy analysis_log_select on public.analysis_log for select using (user_id = auth.uid());
create policy analysis_log_insert on public.analysis_log for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Create an empty profile row when a user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
