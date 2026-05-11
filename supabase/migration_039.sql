-- migration_039: Caregiver + rural catalog backfill, plus senior auto-derive.
--
-- Audit on 2026-05 surfaced that the quiz's caregiver and rural situation
-- tags were doing zero matching work — no active row in the catalog had
-- either tag in required_situations. Initially looked like dead tags;
-- audit revealed it was catalog incompleteness (same shape as the
-- California gap fixed by migration_037), not tag obsolescence:
--   • Federal caregiver-eligible programs exist (VA PCAFC, VA PGCSS,
--     Medicaid HCBS waivers in nearly every state, paid family leave
--     in 13 states + DC, etc.)
--   • Federal rural-eligible programs exist (USDA Rural Development
--     runs dozens of housing/utility programs gated on rural area
--     eligibility)
--
-- This migration adds 4 federal rows to clear the catalog gap and bring
-- the new structural invariant ("every quiz situation tag should appear
-- in ≥ 1 active row") to green. Future expansion can add state-level
-- caregiver tax credits, state rural LIHEAP variants, etc. — this seed
-- is intentionally minimal to surface the architectural pattern.
--
-- Excluded per migration_028's catalog inclusion principle (consumption
-- support, not wealth-building):
--   • USDA Section 502 Single Family Housing Direct Loans (homebuyer)
--   • USDA High Energy Cost Grant Program (grants to utility providers,
--     not individuals)
--
-- Companion changes in the same commit (not SQL):
--   • lib/supabase.ts: auto-derive 'senior' tag when ageRange=65_plus
--     so a 70yo who doesn't tick the senior checkbox still matches
--     Medicare-style rows (those 7 rows where 'senior' is doing real
--     OR-semantic work with disability — see migration_038 comment).
--   • Step6Situation.tsx: voice consistency on 4 label updates (drop
--     first-person framing on unemployed/student/caregiver/with_children
--     to match the descriptor-only style of the other 7 options).
--   • test/eligibility.mjs: 2 new structural invariants (every quiz tag
--     in catalog; every catalog tag in quiz) + 1 behavioral watchpoint
--     for the senior auto-derive path.
--
-- Phone number verification status: VA Caregiver Support Line
-- (1-855-260-3274) is high-confidence per long-standing VA documentation.
-- USDA RD SFH Customer Service Center (1-800-414-1226) attempted live
-- verification but both WebFetch and curl paths to rd.usda.gov timed out
-- / refused connection. Shipping with the cited number and the
-- apply_url as the authoritative fallback if the phone is stale. Same
-- precedent as CalVet (1-800-952-5626) in migration_037.

insert into programs (
  name, category, description, potential_benefit, who_qualifies,
  phone_number, apply_url, benefit_value, scope, state, jurisdiction_name,
  slug, is_active, important_notes, eligibility_rules
) values

-- ── VA PCAFC (Program of Comprehensive Assistance for Family Caregivers) ──
('VA PCAFC - Program of Comprehensive Assistance for Family Caregivers', 'Veteran Services',
 'Federal program providing financial and clinical support to primary family caregivers of veterans seriously injured in the line of duty. Includes monthly stipends, CHAMPVA health insurance, mental health services, respite care, and caregiver training. Administered by the VA Caregiver Support Program.',
 'Monthly stipend (~$1,800-$3,500/mo depending on caregiver tier and location), free CHAMPVA health insurance, respite care, and training',
 'Primary family caregivers of eligible veterans with serious service-connected injuries',
 '1-855-260-3274', 'https://www.caregiver.va.gov/support/PCAFC.asp',
 25000, 'federal', null, null, 'va-pcafc-comprehensive-family-caregivers', true,
 'Eligibility requires the caregiver to support a veteran with a serious service-connected injury (post-9/11 era or pre-May 1975 under the comprehensive expansion). The schema gates on the caregiver tag because we don''t model "caregiver of a specific population"; the description carries the veteran-specific gating detail.',
 '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": ["caregiver"]}'::jsonb),

-- ── VA PGCSS (Program of General Caregiver Support Services) ──────────────
('VA PGCSS - Program of General Caregiver Support Services', 'Veteran Services',
 'Federal program providing free supportive services to caregivers of veterans of any era — peer support mentoring, skills training, Building Better Caregivers workshops, telephone support, respite care, and caregiver-specific case management. Less restrictive than PCAFC; open to all caregivers of enrolled veterans.',
 'Free caregiver support services (training, peer mentoring, respite care, telephone support)',
 'Caregivers of any enrolled veteran, regardless of when the veteran served',
 '1-855-260-3274', 'https://www.caregiver.va.gov/Care_Caregivers.asp',
 5000, 'federal', null, null, 'va-pgcss-general-caregiver-support', true, null,
 '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": ["caregiver"]}'::jsonb),

-- ── USDA Section 521 Rural Rental Assistance ──────────────────────────────
('USDA Section 521 Rural Rental Assistance', 'Housing Assistance',
 'Federal rent subsidy paid directly to USDA-financed multi-family rural housing landlords on behalf of low-income tenants. Tenants pay 30% of adjusted income for rent; USDA covers the gap up to fair-market rent. Administered by USDA Rural Development.',
 '~$8,000/year in rent subsidy (tenant pays 30% of adjusted income)',
 'Low-income tenants living in USDA-financed Section 515 multi-family rural housing properties',
 '1-800-414-1226', 'https://www.rd.usda.gov/programs-services/multi-family-housing-programs/multi-family-housing-rental-assistance',
 8000, 'federal', null, null, 'usda-section-521-rural-rental-assistance', true,
 'Only available in USDA-financed Section 515 multi-family rural housing properties. Use the USDA Rural Rentals Directory (rdmfhrentals.sc.egov.usda.gov) to find participating properties in your area. Income limits vary by location — typically below 80% of Area Median Income (AMI).',
 '{"max_monthly_income": null, "min_age": null, "max_age": null, "required_situations": ["rural", "low_income"]}'::jsonb),

-- ── USDA Section 504 Home Repair Loans and Grants ─────────────────────────
('USDA Section 504 Home Repair Loans and Grants', 'Housing Assistance',
 'Federal home repair assistance for very-low-income rural homeowners. Loans up to $40,000 at 1% interest with 20-year term. Grants up to $10,000 reserved for homeowners 62 and older who cannot repay a loan. Used for repairs that improve safety, accessibility, or remove health/safety hazards. Administered by USDA Rural Development.',
 'Loans up to $40,000 at 1% interest for home repairs; grants up to $10,000 for homeowners 62 and older unable to repay',
 'Very-low-income rural homeowners; grant component restricted to homeowners 62 and older',
 '1-800-414-1226', 'https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-repair-loans-grants',
 25000, 'federal', null, null, 'usda-section-504-home-repair', true,
 'Income limits (typically below 50% Area Median Income for very-low-income) vary by location — verify with local USDA Rural Development field office. The grant component is restricted to homeowners 62 and older who lack repayment ability; loans are available to all qualifying rural very-low-income homeowners aged 18+.',
 '{"max_monthly_income": null, "min_age": 18, "max_age": null, "required_situations": ["rural", "low_income"]}'::jsonb);
