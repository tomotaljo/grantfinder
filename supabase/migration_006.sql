-- Program guide AI content cache
create table if not exists program_guides (
  id           uuid primary key default gen_random_uuid(),
  program_slug text unique not null,
  content      jsonb not null,
  generated_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Public can read cached guides; only service role can write
alter table program_guides enable row level security;

create policy "Public read" on program_guides
  for select using (true);

create policy "Service role write" on program_guides
  for all using (auth.role() = 'service_role');
