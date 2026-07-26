-- Price list for creators (e.g. 30 sec = 500, 60 sec = 1000)

alter table public.creator_profiles
  add column if not exists price_list jsonb not null default '[]'::jsonb;
