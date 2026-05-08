-- Schema and data changes:
--   1. Add jurisdiction_name column for county/city scope rows.
--   2. Reclassify + rebrand the Inland Empire 211 row as California 211
--      (scope=state, jurisdiction_name=NULL). Multi-county programs don't fit
--      a single-jurisdiction column, and 211 is best modeled per-state.
--   3. Backfill 11 county/city rows with jurisdiction names.
--   4. Insert Texas 211 (new statewide referral row). Going forward, every
--      state should have one such row: scope=state, jurisdiction_name=NULL,
--      name "[State] 211", category "Information & Referral", phone "211".
--   5. Lock the cross-column invariant (jurisdiction_name presence ↔ scope).

-- 1. Add jurisdiction_name column (nullable; populated by backfill below)
alter table programs add column if not exists jurisdiction_name text;

-- 2. Rebrand the multi-county Inland Empire row as the California 211 entry.
--    Slug renames to 'california-211' (catalog clarity > theoretical URL
--    stability for a project still in development).
update programs
   set scope             = 'state',
       slug              = 'california-211',
       name              = 'California 211',
       category          = 'Information & Referral',
       description       = 'California 211 is the statewide health and human services helpline. Call 2-1-1 or visit 211california.org to find local programs for rental and utility assistance, food, healthcare, mental health, childcare, and crisis support. Free, confidential, available 24/7.',
       potential_benefit = 'Free referral to local assistance programs',
       who_qualifies     = 'Anyone in California needing help finding local services',
       phone_number      = '211',
       apply_url         = 'https://www.211california.org',
       benefit_value     = 0,
       important_notes   = null,
       eligibility_rules = '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
 where slug = 'inland-empire-211-local-resource-finder';

-- 3. Backfill the 11 county/city rows with jurisdiction names.
--    Convention: "[County] County" / "City of [Name]". Not enforced by
--    constraint (US local government has too many edge cases — parishes,
--    boroughs, independent cities, D.C.). Form placeholder/hint enforces it.

update programs set jurisdiction_name = 'Harris County'
  where slug in ('harris-county-community-services', 'harris-health-gold-card');

update programs set jurisdiction_name = 'Dallas County'
  where slug in ('dallas-county-hhs', 'parkland-financial-assistance');

update programs set jurisdiction_name = 'Tarrant County'
  where slug in ('tarrant-county-community-development', 'jps-connection-program');

update programs set jurisdiction_name = 'Bexar County'
  where slug in ('bexar-county-community-resources', 'university-health-carelink');

update programs set jurisdiction_name = 'San Bernardino County'
  where slug in ('san-bernardino-county-emergency-services',
                 'chaffey-college-emergency-assistance-fund');

update programs set jurisdiction_name = 'City of San Antonio'
  where slug = 'opportunity-home-san-antonio';

-- 4. Insert Texas 211 (new statewide referral row).
insert into programs (
  name, category, description, potential_benefit, who_qualifies,
  phone_number, apply_url, benefit_value, scope, state, jurisdiction_name,
  slug, is_active, important_notes, eligibility_rules
) values (
  'Texas 211',
  'Information & Referral',
  'Texas 211 is the statewide health and human services helpline. Call 2-1-1 or visit 211texas.org to find local programs for rental and utility assistance, food, healthcare, mental health, childcare, and crisis support. Free, confidential, available 24/7.',
  'Free referral to local assistance programs',
  'Anyone in Texas needing help finding local services',
  '211',
  'https://www.211texas.org',
  0,
  'state',
  'TX',
  null,
  'texas-211',
  true,
  null,
  '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": []}'::jsonb
);

-- 5. Verify integrity before locking the constraint.
do $$
declare
  bad_count int;
  bad_slugs text;
begin
  select count(*), string_agg(slug, ', ')
    into bad_count, bad_slugs
    from programs
    where scope in ('county', 'city') and jurisdiction_name is null;
  if bad_count > 0 then
    raise exception
      'Backfill incomplete: % county/city rows missing jurisdiction_name (%)',
      bad_count, bad_slugs;
  end if;

  select count(*), string_agg(slug, ', ')
    into bad_count, bad_slugs
    from programs
    where scope in ('federal', 'state') and jurisdiction_name is not null;
  if bad_count > 0 then
    raise exception
      'Federal/state rows should not have jurisdiction_name (%)', bad_slugs;
  end if;
end $$;

-- 6. Cross-column invariant: jurisdiction_name presence matches scope.
alter table programs
  add constraint programs_jurisdiction_scope_consistency
  check (
    (scope in ('federal', 'state') and jurisdiction_name is null)
    or (scope in ('county', 'city') and jurisdiction_name is not null)
  );
