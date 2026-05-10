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

**Annual maintenance:** `current_fpl_monthly()` is hard-coded to the
2026 federal poverty guidelines (HHS ASPE, Federal Register notice
2026-00755, published 2026-01-13). When the 2027 guidelines drop in
January 2027, refresh with a one-statement migration
(CREATE OR REPLACE FUNCTION). The shape of the function doesn't change
year-to-year — only the literal values.

## Catalog inclusion principles

Resolved during the migration_028 housing-finance cleanup (2026-05).
Recording the rule here so it's preserved for future state additions
and category decisions.

**MyPublicAid is for consumption support, not wealth-building.** The
catalog should index programs that help people in immediate need pay
for things they need *right now* — food, healthcare, rent, utilities,
cash assistance, crisis services. Wealth-building, long-term financial
planning, and capital-formation programs belong in a separate consumer
grants/loans engine that hasn't been built yet.

**Include:**
- Programs providing direct consumption support to people in difficulty
  (food, healthcare, rent, utilities, cash assistance, energy bills,
  emergency services, referrals).

**Exclude — route to the future grants/loans engine:**
- Homebuyer assistance and down-payment grants
- Mortgage credit certificates
- First-time buyer programs
- Small business grants and loans
- Education savings accounts and 529 contributions
- Retirement-planning programs
- Other wealth-building or long-term financial-planning programs

**Reference precedent:** migration_028 deactivated 23 state housing
finance authority programs (My First Texas Home, SONYMA, Florida
Hometown Heroes, IHDA, MSHDA, etc.) under this rule. Rental assistance,
public housing waitlists, eviction prevention, and Section 8 vouchers
were kept — those are consumption support.

## Catalog research projects

### State-level rental and eviction assistance — Phase 1
After migration_028 deactivated the homebuyer-focused state housing
finance rows, 21+ of currently-populated states have **no state-administered
rental assistance row**. Users in those states only see federal options
plus the 211 row for housing help.

**Goal:** every populated state has at least one state-administered
rental assistance row, or honest documentation that no such program
exists ("no state-administered program — call 211").

**Scope:** state-level only. County and city-level are separate phases
(see below). State scope means programs administered statewide, or by
an entity covering ≥50% of state population.

**Methodology:**
- Use FindHelp.org's directory as a discovery tool (search by ZIP code
  in 2-3 cities per state to surface candidates).
- Verify each candidate against the program's authoritative source
  (state agency website, nonprofit homepage). Don't enter rows from
  FindHelp's listing — only from the authoritative source.
- Claude Code produces a research dossier per state; the human
  verifies candidates and approves the subset for catalog inclusion.
- Single migration per batch of 3-5 states.

**Categories to research per state:**
- **Emergency Rental Assistance Program (ERAP) residuals** — many states
  still have small pockets of rental aid funded by leftover federal dollars.
- **State-funded eviction prevention / homelessness prevention** — separate
  from ERAP; many states stood these up post-pandemic.
- **State Section 8 / Housing Choice Voucher waitlist application portals**
  — federal funding, but the entry point is the state housing authority's
  waitlist (not the homebuyer arm we just removed).
- **Tenant-based rental assistance (TBRA) administered through the state**
  rather than local PHAs.
- **State Continuum of Care entry points** — only if they provide actual
  benefits, not just referrals.

**Inclusion criteria** — a candidate must meet ALL of:
1. Administered at state level, statewide, or by an entity covering
   ≥50% of state population.
2. Currently accepting applications as of 2026 (verify via web check).
3. Provides direct rental assistance, eviction prevention, or housing
   stability support to consumers.
4. Eligibility rules can be encoded in our schema (income threshold,
   household sensitivity, situation tags).
5. Phone number and web URL that resolve as of today.

If a state has no programs meeting all 5 criteria, add an honest
"no state-administered program — call 211" note rather than
manufacturing a marginal row.

**Effort:** ~50-70 minutes of human verification time per state,
~25-30 hours total across 24 states. 10-12 focused sessions.

**Pilot recommendation:** Run California first as a single-state pilot
to calibrate the methodology before scaling. The catalog owner knows
California reasonably well, so the pilot's findings can be sanity-
checked against intuition before the methodology is locked in.

### County and city-level rental assistance — Phases 2 and 3
**Phase 2:** add city-scope rental assistance for the top 30-50 US
cities by population (NYC, LA, Chicago, Houston, Phoenix, Philadelphia,
San Antonio, San Diego, Dallas, San Jose, Austin, Jacksonville, Fort
Worth, Columbus, Charlotte, Indianapolis, San Francisco, Seattle,
Denver, Washington DC, etc.). Estimated 15-20 hours.

**Phase 3:** add county-scope rental assistance for the top 50-100
high-population counties (LA County, Cook County, Harris County,
Maricopa County, San Diego County, Orange County, Miami-Dade, etc.).
Estimated 30+ hours.

**UX prerequisite for Phases 2 and 3:** the public quiz currently
captures only state. Without city/county-granular location capture,
city/county-scope programs can't be properly filtered to the right
users. Probably a ZIP-code input that resolves to county/city via a
lookup table. **Don't tackle Phases 2 or 3 until Phase 1 is complete
and the location-capture UX update is in place.**

## Program guides

### "What you'll receive" section
Add a standard section to every program guide that describes what
the benefit actually provides once received, distinct from the
existing "how to apply" content.

**Goals:**
- Help users decide whether to apply (understanding what they'd get).
- Help users maximize the benefit once received (e.g., SNAP at farmers
  markets, Medicaid preventive dental, LIHEAP weatherization).
- Reduce the dignity cost of applying by making abstract help tangible.

**Content requirements:**
- State-specific where coverage varies (Medicaid dental/vision are
  state-specific).
- Avoid specific dollar amounts — defer to ranges with "varies based on
  income/household".
- Anchor to authoritative sources (federal program docs, state agency
  materials).
- Include "varies by county/region — call to confirm" hedges where
  applicable.

**Implementation:**
- New section in the existing AI guide generation flow.
- Prompt design needs state-specific context, not just program-specific.
- Cache key needs to invalidate if state coverage rules change (annual
  review item — see Annual maintenance section).

**Sources to draw from:**
- **SNAP**: USDA FNS coverage rules, state-specific add-ons (Double Up
  Food Bucks, etc.)
- **Medicaid**: state Medicaid plan documents, MACPAC summaries
- **LIHEAP**: state LIHEAP plans, weatherization program inclusion
- **TANF**: state-specific work-support and child-care benefits
- **WIC**: federal nutrition package + state add-ons

## Annual maintenance (January cadence)

A short list of items to refresh each January when the new HHS guidelines
drop. Federal and state Medicaid policy is volatile enough that a yearly
pass is warranted.

### FPL guidelines refresh
`current_fpl_monthly()` is currently on 2026 values (HHS ASPE Federal
Register notice 2026-00755). When the 2027 guidelines drop in January
2027, refresh with a one-statement migration (CREATE OR REPLACE FUNCTION).
Shape doesn't change year-to-year — only the literal values.

### State Medicaid policy verification
Walk every Medicaid row in the catalog and confirm:
- **Expansion status** — has any non-expansion state expanded? Has any
  expansion state contracted? Adjust the row's required_situations gate.
  (At time of writing: FL, AL, GA, MS, KS, TN, WY, SC are non-expansion;
  Wisconsin is a hybrid case via BadgerCare 1115 waiver capped at 100%
  FPL for adults; everyone else in the catalog is full ACA expansion.
  Recent expansions with `important_notes` flags for annual re-verification:
  NC — December 2023; MO — 2021-2022 via Amendment 2;
  SD — July 2023 via Constitutional Amendment D.)
- **Indiana HIP work requirement status** — Healthy Indiana Plan has had
  on-again/off-again work requirements over the years; current row
  assumes none. Re-check.
- **Georgia Pathways requirements** — currently 80 hrs/mo of work, study,
  or community service. Verify the threshold and the categories haven't
  changed; update `important_notes` on `georgia-medicaid` if so.
- **Any new state programs** — partial-expansion or experimental coverage
  programs (Pathways-style) may have launched elsewhere.
- **Any state agency renames** — a few states reorganize their human
  services agencies regularly; spot-check phone numbers and apply URLs.

**Sources to consult:**
- **HHS ASPE Federal Register notice** — annual FPL update with the new
  monthly values for `current_fpl_monthly()`.
- **KFF state Medicaid expansion tracker** — definitive list of which
  states have expanded vs. not, refreshed continuously.
- **State Medicaid agency homepages** for any flagged programs (Indiana
  HIP, Georgia Pathways, etc.) — check for posted policy changes.
- **LIHEAP Clearinghouse** (`liheapch.acf.gov`) for state-by-state
  income thresholds (FPL% vs SMI%, current year's tables).

## Eligibility & data quality

### Schema gap: no `with_children` situation tag
WIC, TANF, CHIP, childcare, and school-meal rows currently use `single_parent`
as a proxy gate for "household includes a minor child." That false-negatives
two-parent low-income families with kids. The quiz has no `with_children`
or `has_minor_child` tag a married parent can select.

**Fix shape:**
1. Add a `with_children` situation tag to the quiz (Yes/No: "Do you have
   a child under 18 in your household?").
2. Re-gate the affected rows: 1 WIC + 1 childcare + 1 school-meal +
   27 TANF + 1 CHIP (texas-chip) = 31 rows today, growing as more states
   are seeded.
3. Drop `single_parent` from those rows where it's currently a proxy (it's
   a strict subset of `with_children`, so keeping both is redundant —
   though `single_parent` may stay as a separate distinct tag if any row
   is genuinely single-parent-only).

### "Potential Benefit" text doesn't adapt to household size
Every state SNAP row says "Up to ~$975/month for a family of four"
regardless of the user's actual household size. Same hard-coded language
across other income-scaled programs. For HH=1 it's misleading (~$292/mo
max); for HH=4 accurate; for HH=2/HH=8 misleading.

**Fix shape:** make the displayed `potential_benefit` text adaptive at
render time based on the user's household_size answer. Either compute it
client-side from a max-per-household-member table, or store an array of
benefit values keyed by household size on each row. Affects SNAP,
WIC, school meals, LIHEAP, and any other row whose dollar figure scales
with household size.

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

### State-aware FPL function (Alaska / Hawaii)
`current_fpl_monthly(p_household_size int)` only encodes the 48-state +
DC guidelines. Alaska's 2026 FPL is ~25% higher across all household
sizes, and Hawaii's is ~15% higher. Migration_022 deliberately uses
`max_income_percent_fpl` for Alaska programs (alaska-medicaid,
alaska-snap, alaska-heating-assistance), accepting a known ~25%
under-estimate of AK eligibility caps.

**Fix shape:**
- Change function signature to
  `current_fpl_monthly(p_household_size int, p_state text default null)`.
  Return Alaska/Hawaii values when `p_state` is `'AK'`/`'HI'`,
  contiguous-states values otherwise.
- Update `get_eligible_programs` body to forward `p_state` into the
  helper call.
- Add Alaska + Hawaii FPL tables (2026 values from HHS ASPE).
- The Alaska `important_notes` warnings on AK rows can come off once
  the function is state-aware. Same for the Hawaii rows when added.

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
