-- migration_037: California catalog backfill — TANF/UI/Veterans/Aging.
--
-- Audit on 2026-05 surfaced that California — the most populous state and
-- the catalog's first-seeded jurisdiction (migration_002 era, predating
-- the standard 8-category template) — was missing 4 of 8 standard
-- categories that every other state has had since migration_018+:
--   • Cash Assistance     (no CalWORKs row)
--   • Income Assistance   (no California EDD / Unemployment row)
--   • Veteran Services    (no CalVet row)
--   • Senior Services     (no California Department of Aging row;
--                          existing IHSS row covers in-home care, not
--                          Area Agencies on Aging coordination)
--
-- This migration adds all four to bring CA to template parity.
--
-- CalWORKs cap modeling note: California uses MBSAC (Minimum Basic
-- Standard of Adequate Care) for the Income Eligibility Test. Cap
-- modeled on Assistance Unit of 3 in Region 1 (non-exempt, high-cost
-- counties) — MBSAC AU=3 R1 ≈ $1,829/mo (rounded to $1,800). Region 2
-- (low-cost) is slightly lower. The Maximum Aid Payment (MAP) is a
-- different number entirely — that's the benefit amount paid, not the
-- eligibility threshold. MAP for AU=3 R1 is ≈ $1,123/mo.
-- The row's important_notes documents the distinction so future
-- maintainers don't conflate the cap (MBSAC) with the benefit (MAP).
--
-- CalWORKs is county-administered, so the phone field is "211" — calling
-- 211 routes to the user's county welfare office, which is the correct
-- application path. The CDSS state-level numbers are press/communications
-- lines, not applicant lines.
--
-- Companion harness extension adds 18 new structural-integrity
-- watchpoints (8 category invariants + 10 tag-level invariants) so this
-- class of catalog gap surfaces automatically going forward.

insert into programs (
  name, category, description, potential_benefit, who_qualifies,
  phone_number, apply_url, benefit_value, scope, state, jurisdiction_name,
  slug, is_active, important_notes, eligibility_rules
) values

-- ── CALIFORNIA: Cash Assistance ─────────────────────────────────────
('California CalWORKs', 'Cash Assistance',
 'CalWORKs (California Work Opportunity and Responsibility to Kids) is California''s TANF program, providing monthly cash assistance for low-income families with minor children plus access to Welfare-to-Work employment and training services. Administered by California''s 58 counties through county welfare departments.',
 'Up to ~$1,123/month for a family of three (Maximum Aid Payment, Region 1)',
 'California families with minor children and limited income/resources',
 '211', 'https://benefitscal.com',
 3500, 'state', 'CA', null, 'california-calworks', true,
 'CalWORKs is administered by California counties, not the state. Apply online at BenefitsCal.com or call 211 to be routed to your county welfare office. California uses MBSAC (Minimum Basic Standard of Adequate Care) for the Income Eligibility Test. Cap modeled on AU=3 in Region 1 (high-cost counties); Region 2 (low-cost) has slightly lower thresholds. The Maximum Aid Payment ($1,123 MAP for AU=3 R1) varies by region and Assistance Unit size — different from the eligibility threshold.',
 '{"max_monthly_income": 1800, "min_age": null, "max_age": null, "required_situations": ["with_children", "low_income"]}'::jsonb),

-- ── CALIFORNIA: Income Assistance (Unemployment) ────────────────────
('California Unemployment Insurance', 'Income Assistance',
 'Weekly cash benefits for Californians who lost their job through no fault of their own. Administered by the Employment Development Department (EDD). Most claimants receive benefits for up to 26 weeks.',
 'Up to $450/week (~$23,400/year max)',
 'Workers laid off through no fault of their own with sufficient base-period earnings',
 '1-800-300-5616', 'https://edd.ca.gov/en/unemployment',
 13000, 'state', 'CA', null, 'california-unemployment', true, null,
 '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["unemployed"]}'::jsonb),

-- ── CALIFORNIA: Veteran Services ────────────────────────────────────
('California Department of Veterans Affairs (CalVet)', 'Veteran Services',
 'The state agency that helps California veterans access VA benefits, education aid, employment, healthcare, home loans (CalVet Home Loans), and emergency assistance through County Veterans Service Officers and the eight CalVet Veterans Homes (Yountville, Chula Vista, Lancaster, Ventura, West LA, Redding, Fresno, Barstow).',
 'Free benefits counseling plus access to state veterans homes',
 'California veterans, active-duty service members, and their dependents',
 '1-800-952-5626', 'https://www.calvet.ca.gov',
 5000, 'state', 'CA', null, 'california-veterans-affairs', true, null,
 '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["veteran"]}'::jsonb),

-- ── CALIFORNIA: Senior Services ─────────────────────────────────────
('California Department of Aging (CDA)', 'Senior Services',
 'The California Department of Aging coordinates the state''s 33 Area Agencies on Aging through the Aging and Disability Resource Connection (ADRC), connecting seniors and family caregivers to local services — meals, transportation, in-home care, caregiver support, and benefits counseling.',
 '~$2,000/year in services (meals, transport, care coordination)',
 'Californians 60 and older and their family caregivers',
 '1-800-510-2020', 'https://aging.ca.gov',
 2000, 'state', 'CA', null, 'california-aging', true, null,
 '{"max_monthly_income": null, "min_age": 60, "max_age": null, "required_situations": ["senior", "caregiver"]}'::jsonb);
