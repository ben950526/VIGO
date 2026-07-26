-- Client-facing studio fields (what buyers care about when hiring)

alter table public.creator_profiles
  add column if not exists turnaround text,
  add column if not exists revision_policy text,
  add column if not exists response_time text,
  add column if not exists team_size text,
  add column if not exists platforms text[] not null default '{}',
  add column if not exists client_types text[] not null default '{}',
  add column if not exists languages text[] not null default '{}',
  add column if not exists typical_scope text,
  add column if not exists website_url text;
