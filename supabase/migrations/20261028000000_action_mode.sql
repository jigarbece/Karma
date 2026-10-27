-- Rubric v3: every scored item says whether the person actually did it, held back, regrets it, means to do it, or only thought it.
-- A thought or a plan scores less than a deed. Rows saved before this keep 'done'.
alter table public.actions add column if not exists mode text not null default 'done';
alter table public.actions drop constraint if exists actions_mode_check;
alter table public.actions add constraint actions_mode_check check (mode in ('done', 'refrained', 'regret', 'intended', 'thought'));
notify pgrst, 'reload schema';
