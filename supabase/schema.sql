-- faraghe database schema for Supabase.
-- Run this file in Supabase Dashboard > SQL Editor.

create table if not exists public.service_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  profession text not null default '',
  city text not null default '',
  bio text not null default '',
  years_experience integer not null default 0 check (years_experience between 0 and 60),
  travels_to_client boolean not null default false,
  availability jsonb not null default '[]'::jsonb,
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  color text not null default 'mint',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_profiles
  add column if not exists availability jsonb not null default '[]'::jsonb;

create table if not exists public.match_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  provider_id uuid not null references public.service_profiles (id) on delete cascade,
  client_name text not null,
  message text not null check (char_length(message) between 8 and 2000),
  preferred_date date,
  preferred_time time,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

alter table public.match_requests
  add column if not exists preferred_time time;

create index if not exists service_profiles_city_profession_idx
  on public.service_profiles (city, profession);
create index if not exists match_requests_client_created_idx
  on public.match_requests (client_id, created_at desc);
create index if not exists match_requests_provider_created_idx
  on public.match_requests (provider_id, created_at desc);

alter table public.service_profiles enable row level security;
alter table public.match_requests enable row level security;

drop policy if exists "Profiles are visible to everyone" on public.service_profiles;
create policy "Profiles are visible to everyone"
  on public.service_profiles for select
  using (true);

drop policy if exists "Providers create their own profile" on public.service_profiles;
create policy "Providers create their own profile"
  on public.service_profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Providers update their own profile" on public.service_profiles;
create policy "Providers update their own profile"
  on public.service_profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Clients and providers can read their requests" on public.match_requests;
create policy "Clients and providers can read their requests"
  on public.match_requests for select to authenticated
  using (auth.uid() = client_id or auth.uid() = provider_id);

drop policy if exists "Clients create their own requests" on public.match_requests;
create policy "Clients create their own requests"
  on public.match_requests for insert to authenticated
  with check (auth.uid() = client_id);

drop policy if exists "Providers update request status" on public.match_requests;
create policy "Providers update request status"
  on public.match_requests for update to authenticated
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

grant select on public.service_profiles to anon, authenticated;
grant insert, update on public.service_profiles to authenticated;
grant select, insert on public.match_requests to authenticated;
grant update (status) on public.match_requests to authenticated;
