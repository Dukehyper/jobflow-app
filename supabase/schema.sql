-- =============================================================================
-- AI Job Application System — Supabase Schema
-- Run this in the Supabase SQL editor
-- =============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  email       text,
  phone       text,
  location    text,
  linkedin    text,
  portfolio   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can delete own profile"
  on profiles for delete using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── experiences ─────────────────────────────────────────────────────────────
create table if not exists experiences (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  role        text not null,
  company     text not null,
  start_date  date,
  end_date    date,
  is_current  boolean default false,
  bullets     text[] default '{}'
);

alter table experiences enable row level security;

create policy "Users access own experiences"
  on experiences for all using (auth.uid() = user_id);

-- ─── skills ──────────────────────────────────────────────────────────────────
create table if not exists skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  name        text not null,
  category    text
);

alter table skills enable row level security;

create policy "Users access own skills"
  on skills for all using (auth.uid() = user_id);

-- ─── education ───────────────────────────────────────────────────────────────
create table if not exists education (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  institution text not null,
  degree      text not null,
  field       text,
  start_date  date,
  end_date    date
);

alter table education enable row level security;

create policy "Users access own education"
  on education for all using (auth.uid() = user_id);

-- ─── projects ────────────────────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  name        text not null,
  description text,
  tech_stack  text[] default '{}',
  outcome     text,
  url         text
);

alter table projects enable row level security;

create policy "Users access own projects"
  on projects for all using (auth.uid() = user_id);

-- ─── cvs ─────────────────────────────────────────────────────────────────────
create table if not exists cvs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade not null,
  type         text check (type in ('career', 'temp')) not null,
  template_id  text,
  base_content jsonb,
  updated_at   timestamptz default now(),
  unique(user_id, type)
);

alter table cvs enable row level security;

create policy "Users access own cvs"
  on cvs for all using (auth.uid() = user_id);

-- ─── jobs ────────────────────────────────────────────────────────────────────
create table if not exists jobs (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       uuid references profiles(id) on delete cascade not null,
  source_url                    text,
  title                         text not null,
  company                       text not null,
  description                   text,
  cv_type                       text check (cv_type in ('career', 'temp')),
  status                        text check (status in ('saved','applied','interview','rejected')) default 'saved',
  applied_at                    timestamptz,
  created_at                    timestamptz default now(),
  notes                         text,
  generated_cv                  text,
  generated_cv_edited           text,
  cv_manually_edited            boolean default false,
  generated_cover_letter        text,
  generated_cover_letter_edited text,
  cover_letter_manually_edited  boolean default false,
  duplicate_hash                text
);

alter table jobs enable row level security;

create policy "Users access own jobs"
  on jobs for all using (auth.uid() = user_id);

create index if not exists jobs_user_status_idx on jobs(user_id, status);
create index if not exists jobs_duplicate_hash_idx on jobs(user_id, duplicate_hash);

-- ─── interview_prep ───────────────────────────────────────────────────────────
create table if not exists interview_prep (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references jobs(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  round       text check (round in ('basic','intermediate','advanced')) not null,
  question    text not null,
  answer      text,
  created_at  timestamptz default now()
);

alter table interview_prep enable row level security;

create policy "Users access own interview prep"
  on interview_prep for all using (auth.uid() = user_id);

-- ─── follow_ups ───────────────────────────────────────────────────────────────
create table if not exists follow_ups (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid references jobs(id) on delete cascade not null,
  user_id         uuid references profiles(id) on delete cascade not null,
  generated_email text,
  status          text check (status in ('pending','sent')) default 'pending',
  due_at          timestamptz,
  sent_at         timestamptz
);

alter table follow_ups enable row level security;

create policy "Users access own follow ups"
  on follow_ups for all using (auth.uid() = user_id);

-- ─── collection ───────────────────────────────────────────────────────────────
create table if not exists collection (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references profiles(id) on delete cascade not null,
  url       text,
  title     text not null,
  company   text,
  notes     text,
  status    text check (status in ('saved','shortlisted')) default 'saved',
  saved_at  timestamptz default now()
);

alter table collection enable row level security;

create policy "Users access own collection"
  on collection for all using (auth.uid() = user_id);
