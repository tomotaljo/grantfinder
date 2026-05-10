-- migration_036: Rename single_parent → with_children in eligibility rules.
--
-- The single_parent tag was being used as a proxy for "household includes
-- a minor child" across 62 rows: 8 non-expansion Medicaid rows (gated
-- [single_parent, pregnant, disability]), 50 TANF/state cash assistance
-- rows (gated [single_parent, low_income]), 1 WIC row, 1 CHIP row, 1
-- childcare row, and 1 school-meal row. None of those programs actually
-- require the user to be unmarried — they require a minor child in the
-- household. The single_parent proxy was false-negativing two-parent
-- low-income families with kids.
--
-- This migration replaces single_parent with with_children in every row
-- where it appears, preserving any other tags. The quiz UI is updated in
-- the matching commit (Step6Situation.tsx now offers "I have a child
-- under 18 in my household" → with_children). Quiz.tsx adds a
-- backwards-compat mapping that converts single_parent → with_children
-- for any in-flight session resumed from localStorage.
--
-- Verification: test/eligibility.mjs profiles + watchpoints renamed
-- ahead of the migration to use with_children. Pre-migration run showed
-- 10 expected failures (8 non-expansion-Medicaid positive cases + 2 TX
-- CHIP positive cases). Post-migration run is expected green.

update programs
   set eligibility_rules = jsonb_set(
     eligibility_rules,
     '{required_situations}',
     (
       select to_jsonb(
         array_agg(
           case when val = 'single_parent' then 'with_children' else val end
         )
       )
       from jsonb_array_elements_text(eligibility_rules->'required_situations') as val
     )
   )
 where eligibility_rules->'required_situations' ? 'single_parent';
