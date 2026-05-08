-- migration_017: Patch eligibility_rules for federal and California rows.
--
-- Federal and CA-state rows were previously seeded with a different schema:
-- {min_age, max_income_percent_fpl} where max_monthly_income was a no-op
-- placeholder (9999999) or absent. The function only reads max_monthly_income,
-- not max_income_percent_fpl, so those rows effectively had no income gate
-- and matched every user.
--
-- This migration rewrites those rows to the standard schema:
--   {max_monthly_income, min_age, max_age, required_situations}
--
-- Income caps use 150% FPL household-of-2 ($2,550/mo) as baseline; per-row
-- caps are derived from the FPL% the row originally encoded. This is an
-- approximation — see the "FPL-aware filter" item on the backlog.
--
-- For "65+ OR disabled" programs (Medicare Extra Help, IHSS, SSI, etc.),
-- the function's AND-only logic is approximated with min_age=null +
-- required_situations=["senior","disability"]. A 65+ user self-identifies
-- via the "senior" quiz tag; a younger disabled user matches via "disability".
--
-- Texas state/county/city rows already use the correct schema and are not
-- touched by this migration.

-- Sanity check: migration_015 must have been applied first.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='programs' and column_name='jurisdiction_name'
  ) then
    raise exception
      'migration_017 requires migration_015 to be applied first (jurisdiction_name column not found)';
  end if;
end $$;

-- ── Federal (7 rows) ─────────────────────────────────────────────────────

update programs set eligibility_rules = '{"max_monthly_income": 2200, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'snap-supplemental-nutrition-assistance-program';

update programs set eligibility_rules = '{"max_monthly_income": 2550, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'liheap-low-income-home-energy-assistance-program';

update programs set eligibility_rules = '{"max_monthly_income": 3400, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'weatherization-assistance-program';

update programs set eligibility_rules = '{"max_monthly_income": 2550, "min_age": null, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
  where slug = 'medicare-extra-help-part-d-low-income-subsidy';

update programs set eligibility_rules = '{"max_monthly_income": 2300, "min_age": null, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
  where slug = 'medicare-savings-program';

update programs set eligibility_rules = '{"max_monthly_income": 1700, "min_age": null, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
  where slug = 'ssi-supplemental-security-income';

update programs set eligibility_rules = '{"max_monthly_income": 5000, "min_age": 17, "max_age": null, "required_situations": ["student"]}'::jsonb
  where slug = 'california-pell-grant-federal-student-aid';
  -- Note: name still says "California" — slug rename is deferred to a separate change.

-- ── California state (16 rows) ───────────────────────────────────────────

update programs set eligibility_rules = '{"max_monthly_income": 5100, "min_age": 17, "max_age": null, "required_situations": ["student"]}'::jsonb
  where slug = 'cal-grant-california-student-aid';

update programs set eligibility_rules = '{"max_monthly_income": 2200, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'calfresh-california-food-assistance';

update programs set eligibility_rules = '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": ["low_income"]}'::jsonb
  where slug = 'california-food-bank-network-emergency-food';

update programs set eligibility_rules = '{"max_monthly_income": 2350, "min_age": null, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
  where slug = 'california-in-home-supportive-services-ihss';

update programs set eligibility_rules = '{"max_monthly_income": 2300, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'california-lifeline-discounted-phone-service';

update programs set eligibility_rules = '{"max_monthly_income": 2550, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'california-low-income-home-energy-assistance-liheap-ca';

update programs set eligibility_rules = '{"max_monthly_income": 4300, "min_age": null, "max_age": null, "required_situations": ["senior", "disability"]}'::jsonb
  where slug = 'california-property-tax-postponement-program';

update programs set eligibility_rules = '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": ["homeless", "low_income"]}'::jsonb
  where slug = 'california-rental-assistance';

update programs set eligibility_rules = '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior"]}'::jsonb
  where slug = 'california-senior-nutrition-program';

update programs set eligibility_rules = '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": ["disability"]}'::jsonb
  where slug = 'california-telephone-access-program-ctap';

update programs set eligibility_rules = '{"max_monthly_income": 3400, "min_age": null, "max_age": null, "required_situations": ["low_income"]}'::jsonb
  where slug = 'california-utility-assistance-reach-program';

update programs set eligibility_rules = '{"max_monthly_income": 6800, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'covered-california-health-insurance';

update programs set eligibility_rules = '{"max_monthly_income": 2550, "min_age": 17, "max_age": null, "required_situations": ["student"]}'::jsonb
  where slug = 'eops-extended-opportunity-programs-and-services';

update programs set eligibility_rules = '{"max_monthly_income": 2350, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'medi-cal-california-medicaid';

update programs set eligibility_rules = '{"max_monthly_income": 2300, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'sce-care-program-california-alternate-rates-for-energy';

update programs set eligibility_rules = '{"max_monthly_income": 3400, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
  where slug = 'sce-fera-program-family-electric-rate-assistance';

-- ── California county (2 rows; assumes migration_015 already moved
--    inland-empire-211 to state scope as 'california-211') ────────────────

update programs set eligibility_rules = '{"max_monthly_income": 3400, "min_age": 17, "max_age": null, "required_situations": ["student"]}'::jsonb
  where slug = 'chaffey-college-emergency-assistance-fund';

update programs set eligibility_rules = '{"max_monthly_income": 3400, "min_age": null, "max_age": null, "required_situations": ["low_income"]}'::jsonb
  where slug = 'san-bernardino-county-emergency-services';

-- ── Verify all 25 patched rows now use the standard schema ───────────────
do $$
declare
  loose_count int;
  loose_slugs text;
begin
  select count(*), string_agg(slug, ', ')
    into loose_count, loose_slugs
    from programs
    where slug in (
      -- Federal
      'snap-supplemental-nutrition-assistance-program',
      'liheap-low-income-home-energy-assistance-program',
      'weatherization-assistance-program',
      'medicare-extra-help-part-d-low-income-subsidy',
      'medicare-savings-program',
      'ssi-supplemental-security-income',
      'california-pell-grant-federal-student-aid',
      -- California state
      'cal-grant-california-student-aid',
      'calfresh-california-food-assistance',
      'california-food-bank-network-emergency-food',
      'california-in-home-supportive-services-ihss',
      'california-lifeline-discounted-phone-service',
      'california-low-income-home-energy-assistance-liheap-ca',
      'california-property-tax-postponement-program',
      'california-rental-assistance',
      'california-senior-nutrition-program',
      'california-telephone-access-program-ctap',
      'california-utility-assistance-reach-program',
      'covered-california-health-insurance',
      'eops-extended-opportunity-programs-and-services',
      'medi-cal-california-medicaid',
      'sce-care-program-california-alternate-rates-for-energy',
      'sce-fera-program-family-electric-rate-assistance',
      -- California county
      'chaffey-college-emergency-assistance-fund',
      'san-bernardino-county-emergency-services'
    )
    and not (eligibility_rules ? 'required_situations');
  if loose_count > 0 then
    raise exception
      '% rows did not get patched (missing required_situations key): %',
      loose_count, loose_slugs;
  end if;
end $$;
