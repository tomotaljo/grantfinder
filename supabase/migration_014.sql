-- Fix-up for migration_013. The previous run committed partial state:
-- programs_scope_check constraint was added but some rows landed in the
-- wrong scope and one row was left null. This migration is fully
-- idempotent — safe to run multiple times.

-- 1. Correct mis-scoped rows.
update programs set scope = 'federal'
  where slug = 'medicare-extra-help-part-d-low-income-subsidy';

update programs set scope = 'county'
  where slug in (
    'chaffey-college-emergency-assistance-fund',
    'harris-health-gold-card',
    'inland-empire-211-local-resource-finder',
    'san-bernardino-county-emergency-services'
  );

update programs set scope = 'city'
  where slug = 'opportunity-home-san-antonio';

-- 2. Verify no row is still unscoped.
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

-- 3. Lock scope NOT NULL. Idempotent: a no-op if already set.
alter table programs alter column scope set not null;

-- 4. Add the two remaining constraints only if missing.
--    (programs_scope_check was added by the prior partial run.)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'programs_state_format_check'
  ) then
    alter table programs
      add constraint programs_state_format_check
      check (state is null or state ~ '^[A-Z]{2}$');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'programs_scope_state_consistency'
  ) then
    alter table programs
      add constraint programs_scope_state_consistency
      check (
        (scope = 'federal' and state is null)
        or (scope in ('state', 'county', 'city') and state is not null)
      );
  end if;
end $$;
