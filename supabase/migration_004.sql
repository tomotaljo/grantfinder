-- 1. Create subscribers table
create table subscribers (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null unique,
  state       text,
  age_range   text,
  income_range text,
  situation   text[]      not null default '{}',
  created_at  timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table subscribers enable row level security;

-- 3. Anyone (including unauthenticated visitors) can insert their own email
create policy "Anyone can subscribe"
  on subscribers for insert
  with check (true);

-- 4. Only authenticated users (admins) can read the subscriber list
create policy "Authenticated users can read subscribers"
  on subscribers for select
  using (auth.role() = 'authenticated');
