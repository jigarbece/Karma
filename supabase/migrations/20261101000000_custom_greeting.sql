-- A user's own greeting for Home (e.g. "Jai Mataji"), chosen in Profile.
alter table public.profiles add column if not exists custom_greeting text not null default '';
alter table public.profiles drop constraint if exists profiles_custom_greeting_len;
alter table public.profiles add constraint profiles_custom_greeting_len check (char_length(custom_greeting) <= 40);
alter table public.profiles drop constraint if exists profiles_greeting_check;
alter table public.profiles add constraint profiles_greeting_check check (greeting in ('jsk', 'jj', 'jsw', 'namaste', 'radhe', 'custom'));
notify pgrst, 'reload schema';
