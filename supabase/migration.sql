-- 1. Create the programs table
create table programs (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  category         text        not null,
  description      text        not null,
  potential_benefit text       not null,
  who_qualifies    text        not null,
  phone_number     text        not null,
  apply_url        text        not null,
  eligibility_rules jsonb      not null default '{}',
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table programs enable row level security;

-- 3. Anyone (including unauthenticated visitors) can read active programs
create policy "Public read active programs"
  on programs for select
  using (is_active = true);

-- 4. Only authenticated users can insert, update, or delete
create policy "Authenticated users can write"
  on programs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5. Seed the initial three programs
insert into programs (name, category, description, potential_benefit, who_qualifies, phone_number, apply_url, eligibility_rules)
values
  (
    'Supplemental Nutrition Assistance Program (SNAP)',
    'Food Assistance',
    'SNAP provides monthly benefits on an EBT card that can be used to buy food at most grocery stores and farmers markets.',
    'Up to $973/month for a family of 4',
    'Households with gross income at or below 130% of the federal poverty level',
    '1-800-221-5689',
    'https://www.benefits.gov/benefit/361',
    '{}'
  ),
  (
    'Low Income Home Energy Assistance Program (LIHEAP)',
    'Utility Assistance',
    'LIHEAP helps low-income households pay for heating and cooling costs, energy crises, and home weatherization.',
    'Average $500–$1,000 per year toward energy bills',
    'Households at or below 150% of the federal poverty level',
    '1-866-674-6327',
    'https://www.benefits.gov/benefit/623',
    '{}'
  ),
  (
    'Medicaid Health Coverage',
    'Health Insurance',
    'Medicaid provides free or low-cost health coverage including doctor visits, hospital care, prescriptions, mental health services, and more.',
    'Full health coverage at little to no cost',
    'Low-income adults, children, pregnant women, elderly, and people with disabilities',
    '1-800-318-2596',
    'https://www.healthcare.gov/medicaid-chip/',
    '{}'
  );
