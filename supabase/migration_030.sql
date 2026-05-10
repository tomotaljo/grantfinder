-- migration_030: Deactivate redundant federal SNAP and LIHEAP rows.
--
-- Both programs are 100% state-administered; every catalog state already
-- has a state-scope row carrying the actual phone number, apply URL, and
-- benefit details. The federal rows duplicated those state rows in 34/34
-- catalog states — confirmed by the federal/state duplication audit run
-- on 2026-05-10. Real-world impact: a Texas user saw both
-- "SNAP - Supplemental Nutrition Assistance Program" and
-- "Texas SNAP (Lone Star Card)" with near-identical content in Top Picks.
--
-- Three other federal rows audited as duplicates by category were kept
-- because they are NOT actual program duplicates of any state row:
--   * Medicare Extra Help — separate from state Medicaid (dual-eligible
--     seniors need both)
--   * Medicare Savings Program — same reasoning
--   * Weatherization Assistance Program — distinct from LIHEAP bill-payment
--     assistance; only 1 state currently has its own WAP row, so leaving
--     the federal row gives users in unrepresented states a fallback.
-- SSI and the Pell Grant federal row are also kept (federally direct
-- programs, no state equivalents).
--
-- After this migration, users in the 16 currently-unrepresented states
-- will no longer see SNAP/LIHEAP rows in their results. That is consistent
-- with their (zero) other catalog presence — those states are queued for
-- upcoming state-add migrations (ME/MD/ND/OR/SC are next, as migration_031).

update programs set is_active = false
 where slug = 'snap-supplemental-nutrition-assistance-program';

update programs set is_active = false
 where slug = 'liheap-low-income-home-energy-assistance-program';
