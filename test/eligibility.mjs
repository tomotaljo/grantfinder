// Eligibility-filter regression harness.
//
// Calls get_eligible_programs RPC against production with a fixed set of
// profiles and verifies watchpoints that catch the bugs migration_016 and
// migration_017 fixed (broken filters, leaky senior programs, off-by-one
// boundaries). Run after any migration that touches eligibility logic.
//
// Usage (from repo root):
//   set -a; . ./.env.local; set +a
//   NODE_OPTIONS=--use-system-ca node --no-warnings test/eligibility.mjs
//
// Exits non-zero if any watchpoint fails.

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// Quiz bucket caps — `lib/supabase.ts` maps "4501_6000" → 6000, etc.
const profiles = [
  { id: "TX-22-6k",    desc: "TX, 22, $6000/mo, [], no kids",                  state: "TX", age: 22, income: 6000, sit: [] },
  { id: "CA-22-6k",    desc: "CA, 22, $6000/mo, [], no kids",                  state: "CA", age: 22, income: 6000, sit: [] },
  { id: "TX-70-1k",    desc: "TX, 70, $1000/mo, [senior]",                     state: "TX", age: 70, income: 1000, sit: ["senior"] },
  { id: "CA-70-1k",    desc: "CA, 70, $1000/mo, [senior]",                     state: "CA", age: 70, income: 1000, sit: ["senior"] },
  { id: "TX-25-1.2k",  desc: "TX, 25, $1200/mo, []",                           state: "TX", age: 25, income: 1200, sit: [] },
  { id: "CA-25-1.2k",  desc: "CA, 25, $1200/mo, []",                           state: "CA", age: 25, income: 1200, sit: [] },
  { id: "TX-25-3.2k",  desc: "TX, 25, $3200/mo, []  (income boundary low)",    state: "TX", age: 25, income: 3200, sit: [] },
  { id: "TX-25-3.2k+", desc: "TX, 25, $3201/mo, [] (income boundary high)",    state: "TX", age: 25, income: 3201, sit: [] },
  { id: "TX-64-sen",   desc: "TX, 64, $0, [senior]    (under min age)",        state: "TX", age: 64, income: 0,    sit: ["senior"] },
  { id: "TX-65-sen",   desc: "TX, 65, $0, [senior]    (at min age)",           state: "TX", age: 65, income: 0,    sit: ["senior"] },

  // FL + NY coverage (added with migration_018). Three profiles per state:
  // working-age default, low-income family, senior.
  { id: "FL-22-6k",    desc: "FL, 22, $6000/mo, []",                           state: "FL", age: 22, income: 6000, sit: [] },
  { id: "FL-low-fam",  desc: "FL, 25, $800/mo, [single_parent, low_income]",   state: "FL", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "FL-70-sen",   desc: "FL, 70, $1000/mo, [senior]",                     state: "FL", age: 70, income: 1000, sit: ["senior"] },
  { id: "NY-22-6k",    desc: "NY, 22, $6000/mo, []",                           state: "NY", age: 22, income: 6000, sit: [] },
  { id: "NY-low-fam",  desc: "NY, 25, $800/mo, [single_parent, low_income]",   state: "NY", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "NY-70-sen",   desc: "NY, 70, $1000/mo, [senior]",                     state: "NY", age: 70, income: 1000, sit: ["senior"] },

  // NV/AL/AK/AZ coverage (added with migration_022).
  { id: "NV-22-6k",    desc: "NV, 22, $6000/mo, []",                           state: "NV", age: 22, income: 6000, sit: [] },
  { id: "NV-low-fam",  desc: "NV, 25, $800/mo, [single_parent, low_income]",   state: "NV", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "NV-70-sen",   desc: "NV, 70, $1000/mo, [senior]",                     state: "NV", age: 70, income: 1000, sit: ["senior"] },
  { id: "AL-22-6k",    desc: "AL, 22, $6000/mo, []",                           state: "AL", age: 22, income: 6000, sit: [] },
  { id: "AL-low-fam",  desc: "AL, 25, $600/mo, [single_parent, low_income]",   state: "AL", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "AL-70-sen",   desc: "AL, 70, $1000/mo, [senior]",                     state: "AL", age: 70, income: 1000, sit: ["senior"] },
  { id: "AK-22-6k",    desc: "AK, 22, $6000/mo, []",                           state: "AK", age: 22, income: 6000, sit: [] },
  { id: "AK-low-fam",  desc: "AK, 25, $1500/mo, [single_parent, low_income]",  state: "AK", age: 25, income: 1500, sit: ["single_parent", "low_income"] },
  { id: "AK-70-sen",   desc: "AK, 70, $1200/mo, [senior]",                     state: "AK", age: 70, income: 1200, sit: ["senior"] },
  { id: "AZ-22-6k",    desc: "AZ, 22, $6000/mo, []",                           state: "AZ", age: 22, income: 6000, sit: [] },
  { id: "AZ-low-fam",  desc: "AZ, 25, $800/mo, [single_parent, low_income]",   state: "AZ", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "AZ-70-sen",   desc: "AZ, 70, $1000/mo, [senior]",                     state: "AZ", age: 70, income: 1000, sit: ["senior"] },

  // Hawaii (added with migration_023). Slightly higher incomes per profile
  // since HI has higher cost-of-living + higher TANF cap ($1,500).
  { id: "HI-22-6k",    desc: "HI, 22, $6000/mo, []",                           state: "HI", age: 22, income: 6000, sit: [] },
  { id: "HI-low-fam",  desc: "HI, 25, $1200/mo, [single_parent, low_income]",  state: "HI", age: 25, income: 1200, sit: ["single_parent", "low_income"] },
  { id: "HI-70-sen",   desc: "HI, 70, $1000/mo, [senior]",                     state: "HI", age: 70, income: 1000, sit: ["senior"] },
];

const all = {};
for (const p of profiles) {
  const { data, error } = await sb.rpc("get_eligible_programs", {
    p_state: p.state, p_monthly_income: p.income, p_age: p.age, p_situation: p.sit,
    p_household_size: p.hh ?? 2,  // accepted by the RPC since migration_019; unused until FPL-aware filter lands
  });
  if (error) {
    console.error(`profile ${p.id}: ERROR ${error.message}`);
    process.exit(1);
  }
  all[p.id] = data ?? [];
}

const failures = [];
const passes = [];

function expect(condition, label) {
  (condition ? passes : failures).push(label);
}

const has = (id, name) => (all[id] ?? []).some((p) => p.name === name);
const sit = (p) => p.eligibility_rules?.required_situations ?? [];

// Headline counts and senior/disability leakage on the high-income, no-tags profiles.
const ca22 = all["CA-22-6k"];
const tx22 = all["TX-22-6k"];

expect(ca22.length <= 4,                                              `CA-22-6k row count ≤ 4 (got ${ca22.length})`);
expect(!ca22.some((p) => sit(p).includes("senior") || sit(p).includes("disability")),
                                                                       "CA-22-6k contains no senior/disability programs");
expect(tx22.length <= 4,                                              `TX-22-6k row count ≤ 4 (got ${tx22.length})`);
expect(!tx22.some((p) => /\bsnap\b/i.test(p.name)),                   "TX-22-6k contains no SNAP rows");
expect(!tx22.some((p) => p.scope === "state" && p.state === "CA"),    "TX-22-6k contains no California state programs");

// Boundary tests — income (inclusive at cap)
expect(has("TX-25-3.2k",  "Texas SNAP (Lone Star Card)"),              "Texas SNAP includes user at income=cap (3200)");
expect(!has("TX-25-3.2k+","Texas SNAP (Lone Star Card)"),              "Texas SNAP excludes user at income=cap+1 (3201)");

// Boundary tests — min_age (inclusive at min)
expect(!has("TX-64-sen", "Texas Property Tax Homestead Exemption (Over 65)"), "Homestead-65 excludes age 64");
expect(has("TX-65-sen",  "Texas Property Tax Homestead Exemption (Over 65)"), "Homestead-65 includes age 65");

// Bug-fix probes
expect(!has("CA-22-6k", "California In-Home Supportive Services - IHSS"),         "IHSS no longer matches CA 22yo");
expect(!has("TX-22-6k", "Medicare Extra Help - Part D Low Income Subsidy"),       "Medicare Extra Help no longer matches TX 22yo");
expect(has("CA-70-1k",  "California In-Home Supportive Services - IHSS"),         "IHSS still matches CA 70yo with senior tag");
expect(has("CA-70-1k",  "Medicare Extra Help - Part D Low Income Subsidy"),       "Medicare Extra Help still matches CA 70yo");

// Required-situations gates
expect(!has("TX-22-6k", "Texas TANF (Temporary Assistance for Needy Families)"),  "TX TANF gated by required tags (no match for empty situation)");
expect(!has("TX-22-6k", "Texas Veterans Commission"),                              "TX Veterans Commission gated by veteran tag");

// ── FL/NY coverage (migration_018) ──────────────────────────────────────

// Working-age default profiles: small result sets, no senior/disability leaks
const fl22 = all["FL-22-6k"];
const ny22 = all["NY-22-6k"];
expect(fl22.length <= 4,                                                           `FL-22-6k row count ≤ 4 (got ${fl22.length})`);
expect(!fl22.some((p) => sit(p).includes("senior") || sit(p).includes("disability")),
                                                                                    "FL-22-6k contains no senior/disability programs");
expect(ny22.length <= 4,                                                           `NY-22-6k row count ≤ 4 (got ${ny22.length})`);
expect(!ny22.some((p) => sit(p).includes("senior") || sit(p).includes("disability")),
                                                                                    "NY-22-6k contains no senior/disability programs");

// Florida Medicaid is gated on single_parent/pregnant/disability — must NOT
// match a non-tagged 22yo, MUST match the single-parent low-income family.
expect(!has("FL-22-6k",  "Florida Medicaid"),                                      "FL Medicaid excluded for non-parent/non-pregnant/non-disabled 22yo");
expect(has("FL-low-fam", "Florida Medicaid"),                                      "FL Medicaid matches single-parent low-income family");

// Florida TCA (TANF) — strict tag gate
expect(!has("FL-22-6k",  "Florida Temporary Cash Assistance (TCA)"),               "FL TCA excluded for non-parent");
expect(has("FL-low-fam", "Florida Temporary Cash Assistance (TCA)"),               "FL TCA matches single-parent low-income family");

// NY HEAP cap is calibrated to 60% SMI ($5,100), not 150% FPL — verify a
// $4,500 income still matches (would fail the FPL-based cap).
const heapAt4500 = all["NY-low-fam"]?.some((p) => p.name === "New York HEAP (Home Energy Assistance Program)");
expect(heapAt4500,                                                                 "NY HEAP matches low-income family (cap is 60% SMI ≈ $5,100)");

// Senior profile — Office for the Aging matches with senior tag
expect(has("NY-70-sen", "New York State Office for the Aging"),                    "NY Office for the Aging matches NY 70yo with senior tag");
expect(has("FL-70-sen", "Florida Elder Helpline"),                                 "FL Elder Helpline matches FL 70yo with senior tag");

// Both 211 rows are no-constraint — should match every profile in their state
expect(has("FL-22-6k", "Florida 211")  && has("FL-low-fam", "Florida 211")  && has("FL-70-sen", "Florida 211"),
                                                                                    "Florida 211 matches all FL profiles");
expect(has("NY-22-6k", "New York 211") && has("NY-low-fam", "New York 211") && has("NY-70-sen", "New York 211"),
                                                                                    "New York 211 matches all NY profiles");

// Cross-state isolation: FL profile shouldn't see TX or NY state programs
const flState22 = fl22.filter((p) => p.scope === "state" && p.state !== "FL");
expect(flState22.length === 0,                                                     "FL-22-6k has no non-FL state programs");
const nyState22 = ny22.filter((p) => p.scope === "state" && p.state !== "NY");
expect(nyState22.length === 0,                                                     "NY-22-6k has no non-NY state programs");

// Household-size sensitivity (migration_020): FPL-aware income filter now
// scales caps by household size. Was a no-op until migration_019 plumbed
// the param; now it actually affects results.
const SNAP_FED = "SNAP - Supplemental Nutrition Assistance Program";

const hhBase = { p_state: "TX", p_monthly_income: 3000, p_age: 30, p_situation: [] };
const hhProbe1 = await sb.rpc("get_eligible_programs", { ...hhBase, p_household_size: 1 });
const hhProbe4 = await sb.rpc("get_eligible_programs", { ...hhBase, p_household_size: 4 });
expect(!hhProbe1.error && !hhProbe4.error,                                          "RPC accepts p_household_size for HH=1 and HH=4");
expect(hhProbe4.data.length > hhProbe1.data.length,                                  "HH=4 at $3000 matches more programs than HH=1 (FPL caps scale up)");

// Headline bug fix: HH=4 family at $3000/mo now matches federal SNAP.
// Cap = 130% × $2600 (HH=4 FPL) = $3380. Was a false negative pre-migration_020.
expect(hhProbe4.data.some((p) => p.name === SNAP_FED),                               "Federal SNAP matches HH=4 at $3000 (the false-negative fix)");
expect(!hhProbe1.data.some((p) => p.name === SNAP_FED),                              "Federal SNAP does NOT match HH=1 at $3000 (130% × $1330 = $1729 cap)");

// ── NV/AL/AK/AZ coverage (migration_022) ────────────────────────────────

// Working-age $6k profiles: small result sets, no senior/disability leaks.
for (const code of ["NV", "AL", "AK", "AZ", "HI"]) {
  const rows = all[`${code}-22-6k`];
  expect(rows.length <= 4,                                                           `${code}-22-6k row count ≤ 4 (got ${rows.length})`);
  expect(!rows.some((p) => sit(p).includes("senior") || sit(p).includes("disability")),
                                                                                      `${code}-22-6k contains no senior/disability programs`);
  // State isolation
  const otherState = rows.filter((p) => p.scope === "state" && p.state !== code);
  expect(otherState.length === 0,                                                    `${code}-22-6k has no non-${code} state programs`);
}

// Alabama Medicaid is gated like FL — must NOT match a non-tagged 22yo,
// MUST match a single-parent low-income family.
expect(!has("AL-22-6k",  "Alabama Medicaid"),                                       "AL Medicaid excluded for non-parent/non-pregnant/non-disabled 22yo");
expect(has("AL-low-fam", "Alabama Medicaid"),                                       "AL Medicaid matches single-parent low-income family");

// Expansion-state Medicaids match a low-income family without a tag gate.
expect(has("NV-low-fam", "Nevada Medicaid"),                                        "NV Medicaid matches low-income family (expansion state, no tag gate)");
expect(has("AZ-low-fam", "Arizona AHCCCS (Arizona Medicaid)"),                      "AZ AHCCCS matches low-income family");
expect(has("AK-low-fam", "Alaska Medicaid"),                                        "AK Medicaid matches low-income family");

// Each new state's senior aging program matches with senior tag
expect(has("NV-70-sen", "Nevada Aging and Disability Services Division"),           "NV ADSD matches NV 70yo with senior tag");
expect(has("AL-70-sen", "Alabama Department of Senior Services"),                   "AL Senior Services matches AL 70yo with senior tag");
expect(has("AK-70-sen", "Alaska Senior and Disabilities Services"),                 "AK SDS matches AK 70yo with senior tag");
expect(has("AZ-70-sen", "Arizona Aging and Adult Services"),                        "AZ Aging and Adult Services matches AZ 70yo with senior tag");
expect(has("HI-70-sen", "Hawaii Executive Office on Aging"),                        "HI EOA matches HI 70yo with senior tag");

// Hawaii Med-QUEST is an expansion-state Medicaid (no required tags) — must
// match a low-income family.
expect(has("HI-low-fam", "Hawaii Med-QUEST"),                                        "HI Med-QUEST matches low-income family");

// Each new state's 211 row is no-constraint — should match every profile in the state
for (const code of ["NV", "AL", "AK", "AZ", "HI"]) {
  const stateNames = {
    NV: "Nevada 211", AL: "Alabama 211", AK: "Alaska 211", AZ: "Arizona 211",
    HI: "Hawaii 211 (Aloha United Way)",
  };
  const name = stateNames[code];
  expect(has(`${code}-22-6k`, name) && has(`${code}-low-fam`, name) && has(`${code}-70-sen`, name),
                                                                                      `${name} matches all ${code} profiles`);
}

// FPL-percent boundary: HH=1, federal SNAP cap = (1330 * 1.30)::int = 1729
// per 2026 federal poverty guidelines. At $1729 user passes (≤); at $1730
// user fails. Inclusive at the threshold.
// (Refresh these literals in January when current_fpl_monthly() is updated
// to the new year's guidelines — see TODO.md.)
const boundaryAt   = await sb.rpc("get_eligible_programs", { p_state: "TX", p_monthly_income: 1729, p_age: 30, p_situation: [], p_household_size: 1 });
const boundaryOver = await sb.rpc("get_eligible_programs", { p_state: "TX", p_monthly_income: 1730, p_age: 30, p_situation: [], p_household_size: 1 });
expect(boundaryAt.data.some((p) => p.name === SNAP_FED),                             "Federal SNAP includes HH=1 user at 2026 FPL boundary income $1729");
expect(!boundaryOver.data.some((p) => p.name === SNAP_FED),                          "Federal SNAP excludes HH=1 user at $1730 (just over 130% FPL)");

// ── Report ──────────────────────────────────────────────────────────────
console.log("\n=== Profile row counts ===");
for (const p of profiles) {
  console.log(`  ${p.id.padEnd(12)} ${all[p.id].length.toString().padStart(3)} rows  (${p.desc})`);
}

console.log("\n=== Watchpoints ===");
for (const label of passes) console.log(`  ✓ ${label}`);
for (const label of failures) console.log(`  ✗ ${label}`);

if (failures.length > 0) {
  console.log(`\n${failures.length} watchpoint(s) failed.`);
  process.exit(1);
} else {
  console.log(`\nAll ${passes.length} watchpoints passed.`);
}
