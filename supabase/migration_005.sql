-- 1. Add slug column (unique, used as the URL path for SEO program pages)
alter table programs add column if not exists slug text unique;

-- 2. Auto-generate slugs for existing programs.
--    Rule: if the name contains an all-caps acronym in parentheses (e.g. "(SNAP)"),
--    use that as the slug. Otherwise slugify the full name.
update programs
set slug = (
  case
    when name ~ '\(([A-Z]{2,})\)'
    then lower((regexp_match(name, '\(([A-Z]{2,})\)'))[1])
    else lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
  end
)
where slug is null;

-- Results for seed data:
--   "Supplemental Nutrition Assistance Program (SNAP)"  → snap
--   "Low Income Home Energy Assistance Program (LIHEAP)" → liheap
--   "Medicaid Health Coverage"                           → medicaid-health-coverage
