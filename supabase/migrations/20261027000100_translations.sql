-- Each scored act keeps its summary and reason in English, Gujarati and Hindi so the UI can switch language instantly.
alter table public.actions add column if not exists translations jsonb not null default '{}'::jsonb;
comment on column public.actions.translations is 'e.g. {"en":{"summary":"","reason":""},"gu":{...},"hi":{...}}';
