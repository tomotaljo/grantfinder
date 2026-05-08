# TODO

Backlog items called out during recent work. Not tracked in any external system —
this file is the source of truth until one is set up.

## Done

### FPL-aware income filter — landed in migration_020 (2026-05)
Income caps on FPL-eligible programs now scale by household size. RPC
reads `max_income_percent_fpl` (when present) and compares user income
against `current_fpl_monthly(hh) * pct/100`; falls back to flat-dollar
`max_monthly_income` for non-FPL rows (TX state, FL TCA, SONYMA, NY
HEAP, NY Family Assistance). 26 rows converted from migration_017 +
migration_018 to use FPL-percent caps. Verified in browser: HH=4 family
at $3,000/mo now matches SNAP/Medicaid (was a false negative); HH=1
user at same income correctly excluded. Test harness covers boundary,
HH-sensitivity, and headline counts (36 watchpoints, all green).

**Annual maintenance:** `current_fpl_monthly()` hard-codes 2024
guidelines. When the new federal poverty guidelines drop each January,
update with a one-statement migration (CREATE OR REPLACE FUNCTION).

## Eligibility & data quality

### Pell Grant slug rename
`california-pell-grant-federal-student-aid` is a federal program with a
misleading slug. Rename to `pell-grant-federal-student-aid` (or similar).
Slug-only change — no logic, no eligibility shift.

### Federal seed rules quality
migration_017 patched the federal seed rows to a usable schema. The FPL
percentages assigned in migration_020 are reasonable but not all
double-checked against current program rule books (e.g., SSI's actual
2024 federal benefit rate is $943/mo single / $1,415/mo couple — we
modelled it as 100% FPL which is close but not exact). Worth a pass
when accuracy matters.

### Texas state programs not on FPL
The 26 Texas state-scope rows from migration_012 were not converted to
`max_income_percent_fpl` in migration_020. Their flat-dollar caps were
TX-specific guesses (some clearly off — e.g., texas-medicaid-star at
$3,200 when actual TX Medicaid is ~16% FPL for adults). HH=4 false
negatives still possible on these rows. Worth a re-audit; many are
straightforward FPL conversions (TX SNAP at 165%, TX CHIP at 200%,
WIC/TEFAP at 185%, etc.).

## Catalog completeness

### Information & Referral coverage
Every state in the catalog should have a "[State] 211" row when added:
`scope=state`, `jurisdiction_name=NULL`, `name=[State Name] 211`,
`category="Information & Referral"`, `apply_url=` official 211 site,
`phone=211`, `benefit_value=0`. Currently 4 states (CA, TX, FL, NY).

## Admin / form

### Form CATEGORIES list is incomplete
`app/admin/components/ProgramForm.tsx` hardcodes 5 categories
(Food / Health / Financial / Utility / Information & Referral). Real data
uses 14+ categories: Housing Assistance, Healthcare, County Services,
Tax Relief, Senior Services, Cash Assistance, Income Assistance,
Phone & Internet, Childcare Assistance, Veteran Services, etc. Editing
one of those rows in the admin form silently snaps its category to the
first dropdown value on save. Fix: build the dropdown from distinct DB
categories, or expand the hardcoded list to cover everything in use.

## Branding & polish

### Branding consistency — BenefitsFinder vs MyPublicAid
Admin layout (`app/admin/layout.tsx`, login page) says **BenefitsFinder**.
Public site & feedback inbox (`contact@mypublicaid.com`) says **MyPublicAid**.
Pick one and unify globally — header text, page metadata, copy
references, the SITE_NAME constant in `Results.tsx`, etc.

### Open Peeps illustration on zero-state
`app/components/ZeroResults.tsx` has a TODO ring placeholder. Drop a
hand-picked Open Peeps SVG (calm/thoughtful pose) at
`public/illustrations/zero-state.svg` and wire it in during the visual
polish pass.

## Testing

### Automated end-to-end browser tests
`test/eligibility.mjs` covers the RPC level only. Extend (or add a
sibling) to cover full quiz-to-results browser flows — Playwright or
similar. Catches regressions like "the page renders but the wrong
programs show," "Edit your answers doesn't preserve state," "ZeroResults
contact cards don't render," etc.

## Legacy schema cleanup

### Drop the unused `states text[]` column
migration_002 added `programs.states` as a text[] array. The application
moved to a singular `state` text column shortly after (visible in
migration_011 onward) but the old column was never dropped. It's
ignored by the current RPC and form, but it's dead weight in the schema
and is a footgun for future readers.

### `get_eligible_programs` parameter naming and contract
The RPC has 5 `p_`-prefixed parameters and no docstring. The contract
is currently spread across migration_016, migration_019, and
migration_020. Worth a single CREATE OR REPLACE that adds a header
comment explaining the schema (`max_income_percent_fpl` vs
`max_monthly_income` precedence; required_situations behavior;
boundary inclusivity). No functional change.

### Vestigial RLS / fallback paths in `lib/supabase.ts`
`fetchEligiblePrograms` has a fallback that runs a direct
`select * from programs where is_active=true` if the RPC errors. With
the RPC now correct and granted to anon, that fallback should never
fire. Worth deleting once we're confident — keeping it makes silent
data-quality bugs harder to spot (the user sees "all programs" instead
of an error).
