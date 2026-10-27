-- Rubric v2 (Hindu dharma): graded points 1-50 per act, plus the dharma principle behind each score.

alter table public.actions drop constraint if exists actions_weight_check;
alter table public.actions add constraint actions_weight_check check (weight between 0 and 100);

alter table public.actions add column if not exists basis text not null default '';
comment on column public.actions.basis is 'Dharma principle id from rubric v2 (e.g. paropakara, satya, himsa)';
