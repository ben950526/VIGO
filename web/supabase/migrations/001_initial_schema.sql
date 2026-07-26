-- Vigo MVP schema
-- Run in Supabase SQL Editor after creating a project

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'creator' check (role in ('creator', 'client', 'admin')),
  real_name text,
  created_at timestamptz not null default now()
);

create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  studio_name text not null,
  bio text,
  region text,
  service_types text[] not null default '{}',
  style_tags text[] not null default '{}',
  price_min integer,
  price_max integer,
  contact_email text,
  line_id text,
  phone text,
  show_email boolean not null default true,
  show_line boolean not null default true,
  show_phone boolean not null default true,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro', 'studio')),
  featured boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  title text not null,
  description text,
  embed_url text not null,
  embed_type text not null check (embed_type in ('youtube', 'vimeo', 'instagram', 'other')),
  thumbnail_url text,
  style_tags text[] not null default '{}',
  sort_order integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  client_phone text,
  message text not null,
  budget_range text,
  created_at timestamptz not null default now()
);

-- Indexes
create index creator_profiles_slug_idx on public.creator_profiles(slug);
create index creator_profiles_status_idx on public.creator_profiles(verification_status);
create index portfolio_items_creator_idx on public.portfolio_items(creator_id);
create index portfolio_items_status_idx on public.portfolio_items(status);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, real_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'creator'),
    new.raw_user_meta_data->>'real_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger creator_profiles_updated_at
  before update on public.creator_profiles
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.inquiries enable row level security;

-- Profiles policies
create policy "Public read approved creator profiles via join"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Creator profiles: public read approved
create policy "Anyone can read approved creators"
  on public.creator_profiles for select
  using (verification_status = 'approved' or auth.uid() = user_id);

create policy "Creators insert own profile"
  on public.creator_profiles for insert
  with check (auth.uid() = user_id);

create policy "Creators update own profile"
  on public.creator_profiles for update
  using (auth.uid() = user_id);

-- Portfolio: public read approved items of approved creators
create policy "Anyone can read approved portfolio items"
  on public.portfolio_items for select
  using (
    status = 'approved'
    or exists (
      select 1 from public.creator_profiles cp
      where cp.id = portfolio_items.creator_id and cp.user_id = auth.uid()
    )
  );

create policy "Creators manage own portfolio"
  on public.portfolio_items for all
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = portfolio_items.creator_id and cp.user_id = auth.uid()
    )
  );

-- Inquiries: creators read own; anyone insert
create policy "Anyone can send inquiry"
  on public.inquiries for insert with check (true);

create policy "Creators read own inquiries"
  on public.inquiries for select
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = inquiries.creator_id and cp.user_id = auth.uid()
    )
  );
