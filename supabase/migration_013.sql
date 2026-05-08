-- Add scope dimension to programs (federal, state, county, city).
-- The state column already holds 2-letter codes or NULL; this migration
-- locks that in via check constraints. No state-value rewrites needed.

-- 1. Add scope column (nullable so the backfill can populate it)
alter table programs add column if not exists scope text;

-- 2. Backfill scope per row, by slug.
--    Classifications were reviewed individually before this migration ran.

-- FEDERAL (7) — federal programs with uniform nationwide rules
update programs set scope = 'federal' where slug in (
  'california-pell-grant-federal-student-aid',
  'liheap-low-income-home-energy-assistance-program',
  'medicare-extra-help-part-d-low-income-subsidy',
  'medicare-savings-program',
  'snap-supplemental-nutrition-assistance-program',
  'ssi-supplemental-security-income',
  'weatherization-assistance-program'
);

-- STATE (42) — state-administered programs, including federal block-grant
-- programs run by the state (SNAP, TANF, LIHEAP, etc.) and statewide
-- utility-company assistance programs.
update programs set scope = 'state' where slug in (
  -- California (16)
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
  -- Texas — state government (22)
  'healthy-texas-women',
  'my-first-texas-home',
  'texas-area-agencies-on-aging',
  'texas-chip',
  'texas-ccad',
  'texas-ceap',
  'texas-tefap',
  'texas-lifeline',
  'texas-medicaid-star',
  'texas-medicare-savings',
  'texas-homestead-65',
  'texas-rental-assistance',
  'texas-section-8',
  'texas-snap',
  'texas-star-plus',
  'texas-summer-ebt',
  'texas-tanf',
  'texas-unemployment-insurance',
  'texas-veterans-commission',
  'texas-wap',
  'texas-wic',
  'texas-child-care-services',
  -- Texas — utility companies (4)
  'aep-texas-neighbor-to-neighbor',
  'centerpoint-energy-assistance',
  'oncor-energy-assistance',
  'txu-energy-aid'
);

-- COUNTY (11) — county agencies, county hospital districts, and
-- multi-county / sub-state regional programs.
update programs set scope = 'county' where slug in (
  -- California (3)
  'chaffey-college-emergency-assistance-fund',
  'inland-empire-211-local-resource-finder',
  'san-bernardino-county-emergency-services',
  -- Texas (8)
  'bexar-county-community-resources',
  'dallas-county-hhs',
  'harris-county-community-services',
  'harris-health-gold-card',
  'jps-connection-program',
  'parkland-financial-assistance',
  'tarrant-county-community-development',
  'university-health-carelink'
);

-- CITY (1) — chartered by a municipality
update programs set scope = 'city' where slug in (
  'opportunity-home-san-antonio'
);

-- 3. Fail loud if any row is still unscoped (catches new rows added
--    between when this migration was written and when it was run).
do $$
declare
  unscoped_count int;
  unscoped_slugs text;
begin
  select count(*), string_agg(slug, ', ')
    into unscoped_count, unscoped_slugs
    from programs where scope is null;
  if unscoped_count > 0 then
    raise exception
      'Backfill incomplete: % programs still have null scope (%)',
      unscoped_count, unscoped_slugs;
  end if;
end $$;

-- 4. Lock scope in
alter table programs alter column scope set not null;

alter table programs
  add constraint programs_scope_check
  check (scope in ('federal', 'state', 'county', 'city'));

-- 5. Lock state format. Existing data already conforms (CA, TX, NULL);
--    this prevents future drift to lowercase or non-standard values.
alter table programs
  add constraint programs_state_format_check
  check (state is null or state ~ '^[A-Z]{2}$');

-- 6. Cross-column invariant: federal scope must have null state;
--    every other scope must have a state.
alter table programs
  add constraint programs_scope_state_consistency
  check (
    (scope = 'federal' and state is null)
    or (scope in ('state', 'county', 'city') and state is not null)
  );
