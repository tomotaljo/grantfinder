-- migration_038: Drop tag proxies — senior/caregiver and low_income.
--
-- Two architectural-cleanup fixes following the same pattern as
-- migration_036's single_parent → with_children rename: drop a
-- required_situations tag where a dedicated eligibility_rules field
-- already serves as source of truth.
--
-- ── Senior fix ──────────────────────────────────────────────────────
-- Pre-fix: every Senior Services row had min_age=60 (or 65 for some
-- Medicaid LTSS waivers) AND required_situations=["senior", "caregiver"].
-- The senior tag was redundant with min_age. The bug: a 70-year-old user
-- who didn't tick the "Senior citizen (65+)" checkbox in the quiz failed
-- the tag gate even though they obviously meet the senior threshold.
-- Confirmed via probe: age=70, no tags → 0 senior rows fire across
-- CA/TX/NY/AR.
--
-- Drop both senior AND caregiver from these 56 rows. Drop both because
-- RPC semantics for required_situations is OR (user must have ≥ 1 of
-- the listed tags); dropping ONLY senior would leave [caregiver],
-- making the bug worse for plain seniors. Trade-off: a 50-year-old
-- caregiver of a 70-year-old parent no longer matches senior-services
-- rows (fails min_age=60). Documented loss; the row's who_qualifies
-- text still describes caregivers, and 211 routes them to support.
--
-- Out of scope (kept active): 7 rows where senior is doing real work
-- (no min_age set). Those are federal Medicare programs, federal SSI,
-- and a few state rows like california-in-home-supportive-services-ihss
-- that legitimately gate purely on the senior tag.
--
-- ── Low-income fix ──────────────────────────────────────────────────
-- Pre-fix: 70 rows had an income cap (max_monthly_income or
-- max_income_percent_fpl) AND low_income in required_situations. The
-- low_income tag was redundant with the income cap, AND because of the
-- OR semantics, it was actively widening the gate: a TANF row gated
-- ["with_children", "low_income"] would match a CHILDLESS low-income
-- adult (false positive — TANF requires children). Confirmed via probe:
-- TX TANF (cap $800) gated [with_children, low_income] fires for a
-- HH=1 user at $200/mo with sit=[low_income] alone — wrong.
--
-- Drop low_income from these 70 rows. The income cap (dedicated field)
-- handles means-testing; the low_income tag was both redundant and
-- harmful via OR semantics.
--
-- Out of scope (kept active): 2 rows where low_income is doing real
-- work (no income cap set):
--   • california-food-bank-network-emergency-food
--   • california-rental-assistance
-- These rely on low_income as the sole means-test signal.

-- Senior fix: drop senior and caregiver from rows where min_age is set
update programs
set eligibility_rules = jsonb_set(
  eligibility_rules,
  '{required_situations}',
  coalesce(
    (
      select to_jsonb(array_agg(val))
      from jsonb_array_elements_text(eligibility_rules->'required_situations') as val
      where val not in ('senior', 'caregiver')
    ),
    '[]'::jsonb
  )
)
where eligibility_rules ? 'min_age'
  and (eligibility_rules->>'min_age')::int is not null
  and (
    eligibility_rules->'required_situations' ? 'senior'
    or eligibility_rules->'required_situations' ? 'caregiver'
  );

-- Low-income fix: drop low_income from rows where any income cap is set
update programs
set eligibility_rules = jsonb_set(
  eligibility_rules,
  '{required_situations}',
  coalesce(
    (
      select to_jsonb(array_agg(val))
      from jsonb_array_elements_text(eligibility_rules->'required_situations') as val
      where val <> 'low_income'
    ),
    '[]'::jsonb
  )
)
where (
        (eligibility_rules->>'max_monthly_income') is not null
        or (eligibility_rules->>'max_income_percent_fpl') is not null
      )
  and eligibility_rules->'required_situations' ? 'low_income';
