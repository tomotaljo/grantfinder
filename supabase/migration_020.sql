-- migration_020: FPL-aware income filter.
--
-- Adds a current_fpl_monthly() helper that returns 2024 monthly federal
-- poverty guideline by household size, and rewrites the income clause in
-- get_eligible_programs to compute income-as-percent-of-FPL when the
-- row's eligibility_rules carries max_income_percent_fpl. Falls back to
-- flat-dollar max_monthly_income otherwise.
--
-- Then converts 26 rows from migration_017 + migration_018 (the FPL-
-- calibrated subset) from flat-dollar caps to FPL%. TX state programs,
-- TANF/AMI/SMI rows, and no-cap rows are untouched.
--
-- Backwards compatible: a row can have either field, neither, or both;
-- if both, FPL wins.

-- ── 1. FPL helper ─────────────────────────────────────────────────────────

create or replace function current_fpl_monthly(p_household_size int)
returns numeric
language sql
immutable
as $$
  -- 2024 federal poverty guidelines (48 contiguous states + DC), monthly.
  -- TODO: update annually. AK/HI use higher guidelines; add a state arg
  -- when we expand the catalog there.
  select case
    when p_household_size <= 1 then 1255.00
    when p_household_size = 2 then 1703.00
    when p_household_size = 3 then 2152.00
    when p_household_size = 4 then 2600.00
    when p_household_size = 5 then 3048.00
    when p_household_size = 6 then 3497.00
    when p_household_size = 7 then 3945.00
    when p_household_size = 8 then 4393.00
    -- Beyond 8: +$448/mo per additional person (2024 marginal)
    else 4393.00 + ((p_household_size - 8) * 448.00)
  end;
$$;

grant execute on function current_fpl_monthly(int) to anon, authenticated;

-- ── 2. RPC body change (income filter only) ──────────────────────────────

create or replace function get_eligible_programs(
  p_state          text    default null,
  p_monthly_income int     default 999999,
  p_age            int     default 30,
  p_situation      text[]  default '{}',
  p_household_size int     default 1
)
returns setof programs
language sql
stable
security definer
as $$
  select * from programs
  where is_active = true

    -- State: federal-scope rows match every user. State/county/city rows
    -- match only when the user picked a state and it matches the row's
    -- `state` column.
    and (
      scope = 'federal'
      or (p_state is not null and state = p_state)
    )

    -- Income gate: prefer max_income_percent_fpl when set; fall back to
    -- flat max_monthly_income; if neither set, no cap.
    and (
      (
        (eligibility_rules->>'max_income_percent_fpl') is not null
        and p_monthly_income <=
          (current_fpl_monthly(p_household_size)
           * (eligibility_rules->>'max_income_percent_fpl')::numeric / 100)::int
      )
      or
      (
        (eligibility_rules->>'max_income_percent_fpl') is null
        and (
          (eligibility_rules->>'max_monthly_income') is null
          or p_monthly_income <= (eligibility_rules->>'max_monthly_income')::int
        )
      )
    )

    -- Age bounds (inclusive on both sides; each side optional).
    and (
      (eligibility_rules->>'min_age') is null
      or p_age >= (eligibility_rules->>'min_age')::int
    )
    and (
      (eligibility_rules->>'max_age') is null
      or p_age <= (eligibility_rules->>'max_age')::int
    )

    -- Required situations: anyone qualifies when missing/null/empty.
    -- Otherwise the user must have at least one matching tag.
    and (
      jsonb_typeof(eligibility_rules->'required_situations') is distinct from 'array'
      or jsonb_array_length(eligibility_rules->'required_situations') = 0
      or exists (
        select 1
        from jsonb_array_elements_text(eligibility_rules->'required_situations') as tag
        where tag = any(p_situation)
      )
    )

  order by benefit_value desc;
$$;

grant execute on function get_eligible_programs(text, int, int, text[], int) to anon, authenticated;

-- ── 3. Data migration: convert 26 FPL-calibrated rows ────────────────────

-- 100% FPL (1 row)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 100}'::jsonb
where slug = 'ssi-supplemental-security-income';

-- 130% FPL (3 rows)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 130}'::jsonb
where slug in (
  'snap-supplemental-nutrition-assistance-program',
  'calfresh-california-food-assistance',
  'new-york-snap'
);

-- 135% FPL (3 rows)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 135}'::jsonb
where slug in (
  'medicare-savings-program',
  'california-lifeline-discounted-phone-service',
  'sce-care-program-california-alternate-rates-for-energy'
);

-- 138% FPL (4 rows)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 138}'::jsonb
where slug in (
  'california-in-home-supportive-services-ihss',
  'medi-cal-california-medicaid',
  'florida-medicaid',
  'new-york-medicaid'
);

-- 150% FPL (5 rows)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 150}'::jsonb
where slug in (
  'liheap-low-income-home-energy-assistance-program',
  'medicare-extra-help-part-d-low-income-subsidy',
  'california-low-income-home-energy-assistance-liheap-ca',
  'eops-extended-opportunity-programs-and-services',
  'florida-liheap'
);

-- 200% FPL (6 rows)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 200}'::jsonb
where slug in (
  'weatherization-assistance-program',
  'california-utility-assistance-reach-program',
  'sce-fera-program-family-electric-rate-assistance',
  'chaffey-college-emergency-assistance-fund',
  'san-bernardino-county-emergency-services',
  'florida-snap'
);

-- 250% FPL (1 row)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 250}'::jsonb
where slug = 'california-property-tax-postponement-program';

-- 300% FPL (2 rows)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 300}'::jsonb
where slug in (
  'cal-grant-california-student-aid',
  'california-pell-grant-federal-student-aid'
);

-- 400% FPL (1 row)
update programs set eligibility_rules =
  (eligibility_rules - 'max_monthly_income') || '{"max_income_percent_fpl": 400}'::jsonb
where slug = 'covered-california-health-insurance';

-- ── 4. Integrity check ────────────────────────────────────────────────────

do $$
declare
  expected_slugs text[] := array[
    'ssi-supplemental-security-income',
    'snap-supplemental-nutrition-assistance-program',
    'calfresh-california-food-assistance',
    'new-york-snap',
    'medicare-savings-program',
    'california-lifeline-discounted-phone-service',
    'sce-care-program-california-alternate-rates-for-energy',
    'california-in-home-supportive-services-ihss',
    'medi-cal-california-medicaid',
    'florida-medicaid',
    'new-york-medicaid',
    'liheap-low-income-home-energy-assistance-program',
    'medicare-extra-help-part-d-low-income-subsidy',
    'california-low-income-home-energy-assistance-liheap-ca',
    'eops-extended-opportunity-programs-and-services',
    'florida-liheap',
    'weatherization-assistance-program',
    'california-utility-assistance-reach-program',
    'sce-fera-program-family-electric-rate-assistance',
    'chaffey-college-emergency-assistance-fund',
    'san-bernardino-county-emergency-services',
    'florida-snap',
    'california-property-tax-postponement-program',
    'cal-grant-california-student-aid',
    'california-pell-grant-federal-student-aid',
    'covered-california-health-insurance'
  ];
  bad_count int;
  bad_slugs text;
begin
  -- All 26 expected slugs must now have max_income_percent_fpl set
  -- and max_monthly_income removed.
  select count(*), string_agg(slug, ', ')
    into bad_count, bad_slugs
    from programs
    where slug = any(expected_slugs)
      and (
        not (eligibility_rules ? 'max_income_percent_fpl')
        or (eligibility_rules ? 'max_monthly_income')
      );
  if bad_count > 0 then
    raise exception
      'FPL conversion incomplete on % rows: %', bad_count, bad_slugs;
  end if;

  if (select count(*) from programs where slug = any(expected_slugs)) <> 26 then
    raise exception
      'Expected to find all 26 target slugs in programs table; one or more is missing.';
  end if;
end $$;
