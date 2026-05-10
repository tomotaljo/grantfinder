-- migration_031: Fix texas-chip eligibility — gate on single_parent.
--
-- Pre-fix: required_situations=[], min/max_age=null, max_monthly_income=5300.
-- Result: any TX user with income ≤ $5300/mo matched, including childless
-- adults. Confirmed via HH=1, no tags, $2500/mo, age 30 → matched, which
-- is wrong. Texas CHIP is for children.
--
-- Post-fix: required_situations=["single_parent"]. Matches the gate
-- convention used by texas-wic, texas-tanf, texas-child-care-services,
-- texas-summer-ebt, and all 27 state TANF rows.
--
-- The deeper schema gap (no with_children tag — two-parent low-income
-- families with kids false-negative on WIC/TANF/CHIP/childcare/school
-- meals) is tracked in TODO.md "Schema gap: no with_children situation
-- tag" and deferred to its own focused session.

update programs
   set eligibility_rules =
       '{"max_monthly_income": 5300, "min_age": null, "max_age": null, "required_situations": ["single_parent"]}'::jsonb
 where slug = 'texas-chip';
