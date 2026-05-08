# TODO

Backlog items called out during recent work. Not tracked in any external system —
this file is the source of truth until one is set up.

## Eligibility & data quality

### FPL-aware income filter
The RPC currently compares user monthly income against flat-dollar
`max_monthly_income` caps. Caps were calibrated to ~150% FPL household-of-2
(~$2,550/mo) as a baseline in migration_017. This produces meaningful **false
negatives for households of 3+** — e.g., a HH=4 family at $3,500/mo is denied
SNAP / CalFresh / Medi-Cal even though their real 130% FPL ceiling is
~$4,165/mo.

**Fix shape:**
- Add a household-size step to the quiz (Step5 currently captures household
  size already — wire it through to `lib/supabase.ts:fetchEligiblePrograms`).
- Migrate `eligibility_rules.max_monthly_income` back to
  `max_income_percent_fpl` as the canonical field (or store both).
- Rewrite `get_eligible_programs` to compute the user's income-as-%-of-FPL
  using a current FPL table and the user's household size, then compare
  against the program's percentage cap.
- An FPL table or a small Postgres function returning monthly FPL by HH size
  (federal poverty guidelines update annually).

**Until then:** results page should mention the limitation in the disclaimer
(see "Quiz disclaimer" item below).

### Quiz disclaimer line about HH approximation
The results-page disclaimer (`app/components/Results.tsx`) currently doesn't
acknowledge the household-of-2 baseline. Until the FPL-aware filter lands,
add a sentence like:

> Income limits use a household-of-2 baseline. If your household is larger,
> you may qualify for more programs than shown — call 211 to check.

### Pell Grant slug rename
`california-pell-grant-federal-student-aid` is a federal program with a
misleading slug. Rename to `pell-grant-federal-student-aid` (or similar).
Slug-only change — no logic, no eligibility shift.

## Catalog completeness

### Information & Referral coverage
Per migration_015 we have one "[State] 211" row per state for which the
catalog has any programs. Two states currently have rows (TX and CA). As
new states get added, every one should get a "[State] 211" row at the
same time: scope=state, jurisdiction_name=NULL, name format `[State Name] 211`,
category "Information & Referral", apply_url is the official 211 site,
phone is `211`, benefit_value 0.

### Federal seed rules quality
migration_017 patched the federal seed rows to a usable schema, but the
caps are best-guess approximations. Worth a pass with an eye on the actual
program rule books (e.g., SSI's actual 2024 federal benefit rate is $943/mo
single / $1,415/mo couple, not the rounded $1,700 we wrote).

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

### `get_eligible_programs` parameter naming
The RPC parameters are `p_state, p_monthly_income, p_age, p_situation`.
The `p_` prefix is a Postgres convention for avoiding column-name
collisions, but if we're touching the function for FPL-aware logic
anyway, it's an opportunity to also rename consistently and document
the contract in a header comment.

### Vestigial RLS / fallback paths in `lib/supabase.ts`
`fetchEligiblePrograms` has a fallback that runs a direct
`select * from programs where is_active=true` if the RPC errors. With
the RPC now correct and granted to anon, that fallback should never
fire. Worth deleting once we're confident — keeping it makes silent
data-quality bugs harder to spot (the user sees "all programs" instead
of an error).
