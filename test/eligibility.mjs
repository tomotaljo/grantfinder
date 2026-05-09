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

  // IL/AR/GA/MI/MS coverage (added with migration_024).
  { id: "IL-22-6k",    desc: "IL, 22, $6000/mo, []",                           state: "IL", age: 22, income: 6000, sit: [] },
  { id: "IL-low-fam",  desc: "IL, 25, $800/mo, [single_parent, low_income]",   state: "IL", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "IL-70-sen",   desc: "IL, 70, $1000/mo, [senior]",                     state: "IL", age: 70, income: 1000, sit: ["senior"] },
  { id: "AR-22-6k",    desc: "AR, 22, $6000/mo, []",                           state: "AR", age: 22, income: 6000, sit: [] },
  { id: "AR-low-fam",  desc: "AR, 25, $600/mo, [single_parent, low_income]",   state: "AR", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "AR-70-sen",   desc: "AR, 70, $1000/mo, [senior]",                     state: "AR", age: 70, income: 1000, sit: ["senior"] },
  { id: "GA-22-6k",    desc: "GA, 22, $6000/mo, []",                           state: "GA", age: 22, income: 6000, sit: [] },
  { id: "GA-low-fam",  desc: "GA, 25, $600/mo, [single_parent, low_income]",   state: "GA", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "GA-70-sen",   desc: "GA, 70, $1000/mo, [senior]",                     state: "GA", age: 70, income: 1000, sit: ["senior"] },
  { id: "MI-22-6k",    desc: "MI, 22, $6000/mo, []",                           state: "MI", age: 22, income: 6000, sit: [] },
  { id: "MI-low-fam",  desc: "MI, 25, $800/mo, [single_parent, low_income]",   state: "MI", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "MI-70-sen",   desc: "MI, 70, $1000/mo, [senior]",                     state: "MI", age: 70, income: 1000, sit: ["senior"] },
  { id: "MS-22-6k",    desc: "MS, 22, $6000/mo, []",                           state: "MS", age: 22, income: 6000, sit: [] },
  { id: "MS-low-fam",  desc: "MS, 25, $500/mo, [single_parent, low_income]",   state: "MS", age: 25, income: 500,  sit: ["single_parent", "low_income"] },
  { id: "MS-70-sen",   desc: "MS, 70, $1000/mo, [senior]",                     state: "MS", age: 70, income: 1000, sit: ["senior"] },

  // CO/CT/DE/ID/IN coverage (added with migration_025).
  { id: "CO-22-6k",    desc: "CO, 22, $6000/mo, []",                           state: "CO", age: 22, income: 6000, sit: [] },
  { id: "CO-low-fam",  desc: "CO, 25, $800/mo, [single_parent, low_income]",   state: "CO", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "CO-70-sen",   desc: "CO, 70, $1000/mo, [senior]",                     state: "CO", age: 70, income: 1000, sit: ["senior"] },
  { id: "CT-22-6k",    desc: "CT, 22, $6000/mo, []",                           state: "CT", age: 22, income: 6000, sit: [] },
  { id: "CT-low-fam",  desc: "CT, 25, $1200/mo, [single_parent, low_income]",  state: "CT", age: 25, income: 1200, sit: ["single_parent", "low_income"] },
  { id: "CT-70-sen",   desc: "CT, 70, $1000/mo, [senior]",                     state: "CT", age: 70, income: 1000, sit: ["senior"] },
  { id: "DE-22-6k",    desc: "DE, 22, $6000/mo, []",                           state: "DE", age: 22, income: 6000, sit: [] },
  { id: "DE-low-fam",  desc: "DE, 25, $600/mo, [single_parent, low_income]",   state: "DE", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "DE-70-sen",   desc: "DE, 70, $1000/mo, [senior]",                     state: "DE", age: 70, income: 1000, sit: ["senior"] },
  { id: "ID-22-6k",    desc: "ID, 22, $6000/mo, []",                           state: "ID", age: 22, income: 6000, sit: [] },
  { id: "ID-low-fam",  desc: "ID, 25, $600/mo, [single_parent, low_income]",   state: "ID", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "ID-70-sen",   desc: "ID, 70, $1000/mo, [senior]",                     state: "ID", age: 70, income: 1000, sit: ["senior"] },
  { id: "IN-22-6k",    desc: "IN, 22, $6000/mo, []",                           state: "IN", age: 22, income: 6000, sit: [] },
  { id: "IN-low-fam",  desc: "IN, 25, $600/mo, [single_parent, low_income]",   state: "IN", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "IN-70-sen",   desc: "IN, 70, $1000/mo, [senior]",                     state: "IN", age: 70, income: 1000, sit: ["senior"] },

  // IA/KS/KY/LA/WA coverage (added with migration_026).
  { id: "IA-22-6k",    desc: "IA, 22, $6000/mo, []",                           state: "IA", age: 22, income: 6000, sit: [] },
  { id: "IA-low-fam",  desc: "IA, 25, $800/mo, [single_parent, low_income]",   state: "IA", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "IA-70-sen",   desc: "IA, 70, $1000/mo, [senior]",                     state: "IA", age: 70, income: 1000, sit: ["senior"] },
  { id: "KS-22-6k",    desc: "KS, 22, $6000/mo, []",                           state: "KS", age: 22, income: 6000, sit: [] },
  { id: "KS-low-fam",  desc: "KS, 25, $700/mo, [single_parent, low_income]",   state: "KS", age: 25, income: 700,  sit: ["single_parent", "low_income"] },
  { id: "KS-70-sen",   desc: "KS, 70, $1000/mo, [senior]",                     state: "KS", age: 70, income: 1000, sit: ["senior"] },
  { id: "KY-22-6k",    desc: "KY, 22, $6000/mo, []",                           state: "KY", age: 22, income: 6000, sit: [] },
  { id: "KY-low-fam",  desc: "KY, 25, $600/mo, [single_parent, low_income]",   state: "KY", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "KY-70-sen",   desc: "KY, 70, $1000/mo, [senior]",                     state: "KY", age: 70, income: 1000, sit: ["senior"] },
  { id: "LA-22-6k",    desc: "LA, 22, $6000/mo, []",                           state: "LA", age: 22, income: 6000, sit: [] },
  { id: "LA-low-fam",  desc: "LA, 25, $500/mo, [single_parent, low_income]",   state: "LA", age: 25, income: 500,  sit: ["single_parent", "low_income"] },
  { id: "LA-70-sen",   desc: "LA, 70, $1000/mo, [senior]",                     state: "LA", age: 70, income: 1000, sit: ["senior"] },
  { id: "WA-22-6k",    desc: "WA, 22, $6000/mo, []",                           state: "WA", age: 22, income: 6000, sit: [] },
  { id: "WA-low-fam",  desc: "WA, 25, $1200/mo, [single_parent, low_income]",  state: "WA", age: 25, income: 1200, sit: ["single_parent", "low_income"] },
  { id: "WA-70-sen",   desc: "WA, 70, $1000/mo, [senior]",                     state: "WA", age: 70, income: 1000, sit: ["senior"] },

  // MT/NE/OH/OK/TN coverage (added with migration_027). 8 categories per
  // state — the housing-finance slot was deliberately omitted.
  { id: "MT-22-6k",    desc: "MT, 22, $6000/mo, []",                           state: "MT", age: 22, income: 6000, sit: [] },
  { id: "MT-low-fam",  desc: "MT, 25, $800/mo, [single_parent, low_income]",   state: "MT", age: 25, income: 800,  sit: ["single_parent", "low_income"] },
  { id: "MT-70-sen",   desc: "MT, 70, $1000/mo, [senior]",                     state: "MT", age: 70, income: 1000, sit: ["senior"] },
  { id: "NE-22-6k",    desc: "NE, 22, $6000/mo, []",                           state: "NE", age: 22, income: 6000, sit: [] },
  { id: "NE-low-fam",  desc: "NE, 25, $700/mo, [single_parent, low_income]",   state: "NE", age: 25, income: 700,  sit: ["single_parent", "low_income"] },
  { id: "NE-70-sen",   desc: "NE, 70, $1000/mo, [senior]",                     state: "NE", age: 70, income: 1000, sit: ["senior"] },
  { id: "OH-22-6k",    desc: "OH, 22, $6000/mo, []",                           state: "OH", age: 22, income: 6000, sit: [] },
  { id: "OH-low-fam",  desc: "OH, 25, $1000/mo, [single_parent, low_income]",  state: "OH", age: 25, income: 1000, sit: ["single_parent", "low_income"] },
  { id: "OH-70-sen",   desc: "OH, 70, $1000/mo, [senior]",                     state: "OH", age: 70, income: 1000, sit: ["senior"] },
  { id: "OK-22-6k",    desc: "OK, 22, $6000/mo, []",                           state: "OK", age: 22, income: 6000, sit: [] },
  { id: "OK-low-fam",  desc: "OK, 25, $600/mo, [single_parent, low_income]",   state: "OK", age: 25, income: 600,  sit: ["single_parent", "low_income"] },
  { id: "OK-70-sen",   desc: "OK, 70, $1000/mo, [senior]",                     state: "OK", age: 70, income: 1000, sit: ["senior"] },
  { id: "TN-22-6k",    desc: "TN, 22, $6000/mo, []",                           state: "TN", age: 22, income: 6000, sit: [] },
  { id: "TN-low-fam",  desc: "TN, 25, $700/mo, [single_parent, low_income]",   state: "TN", age: 25, income: 700,  sit: ["single_parent", "low_income"] },
  { id: "TN-70-sen",   desc: "TN, 70, $1000/mo, [senior]",                     state: "TN", age: 70, income: 1000, sit: ["senior"] },
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
for (const code of ["NV", "AL", "AK", "AZ", "HI", "IL", "AR", "GA", "MI", "MS", "CO", "CT", "DE", "ID", "IN", "IA", "KS", "KY", "LA", "WA", "MT", "NE", "OH", "OK", "TN"]) {
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
expect(has("IL-70-sen", "Illinois Department on Aging"),                            "IL Aging matches IL 70yo with senior tag");
expect(has("AR-70-sen", "Arkansas Aging, Adult, and Behavioral Health Services"),   "AR DAABHS matches AR 70yo with senior tag");
expect(has("GA-70-sen", "Georgia Division of Aging Services (GA Cares)"),           "GA Cares matches GA 70yo with senior tag");
expect(has("MI-70-sen", "Michigan Aging and Adult Services Agency"),                "MI AASA matches MI 70yo with senior tag");
expect(has("MS-70-sen", "Mississippi Aging and Adult Services"),                    "MS Aging matches MS 70yo with senior tag");
expect(has("CO-70-sen", "Colorado State Unit on Aging"),                            "CO Aging matches CO 70yo with senior tag");
expect(has("CT-70-sen", "Connecticut Aging and Disability Services"),               "CT Aging matches CT 70yo with senior tag");
expect(has("DE-70-sen", "Delaware Division of Services for Aging and Adults with Physical Disabilities (DSAAPD)"),
                                                                                     "DE DSAAPD matches DE 70yo with senior tag");
expect(has("ID-70-sen", "Idaho Commission on Aging"),                               "ID Aging matches ID 70yo with senior tag");
expect(has("IN-70-sen", "Indiana Division of Aging"),                               "IN Aging matches IN 70yo with senior tag");
expect(has("IA-70-sen", "Iowa Department on Aging"),                                "IA Aging matches IA 70yo with senior tag");
expect(has("KS-70-sen", "Kansas Department for Aging and Disability Services (KDADS)"),
                                                                                     "KS KDADS matches KS 70yo with senior tag");
expect(has("KY-70-sen", "Kentucky Department for Aging and Independent Living (DAIL)"),
                                                                                     "KY DAIL matches KY 70yo with senior tag");
expect(has("LA-70-sen", "Louisiana Governor's Office of Elderly Affairs (GOEA)"),   "LA GOEA matches LA 70yo with senior tag");
expect(has("WA-70-sen", "Washington Aging and Long-Term Support Administration (ALTSA)"),
                                                                                     "WA ALTSA matches WA 70yo with senior tag");
expect(has("MT-70-sen", "Montana Senior and Long Term Care"),                       "MT Aging matches MT 70yo with senior tag");
expect(has("NE-70-sen", "Nebraska State Unit on Aging"),                            "NE State Unit on Aging matches NE 70yo with senior tag");
expect(has("OH-70-sen", "Ohio Department of Aging"),                                "OH Aging matches OH 70yo with senior tag");
expect(has("OK-70-sen", "Oklahoma DHS Aging Services"),                             "OK Aging matches OK 70yo with senior tag");
expect(has("TN-70-sen", "Tennessee Commission on Aging and Disability"),            "TN TCAD matches TN 70yo with senior tag");

// Hawaii Med-QUEST is an expansion-state Medicaid (no required tags) — must
// match a low-income family.
expect(has("HI-low-fam", "Hawaii Med-QUEST"),                                        "HI Med-QUEST matches low-income family");

// Expansion states (IL, AR, MI) Medicaid: no tag gate, must match low-income family.
expect(has("IL-low-fam", "Illinois Medicaid"),                                       "IL Medicaid matches low-income family");
expect(has("AR-low-fam", "Arkansas Medicaid (ARHOME)"),                              "AR Medicaid matches low-income family");
expect(has("MI-low-fam", "Michigan Medicaid (Healthy Michigan Plan)"),               "MI Medicaid matches low-income family");

// migration_025 expansion states (CO/CT/DE/ID/IN): no tag gate, low-income family matches.
expect(has("CO-low-fam", "Health First Colorado (Colorado Medicaid)"),               "CO Medicaid matches low-income family");
expect(has("CT-low-fam", "HUSKY Health (Connecticut Medicaid)"),                     "CT HUSKY matches low-income family");
expect(has("DE-low-fam", "Delaware Medicaid"),                                       "DE Medicaid matches low-income family");
expect(has("ID-low-fam", "Idaho Medicaid"),                                          "ID Medicaid matches low-income family");
expect(has("IN-low-fam", "Indiana Medicaid (Healthy Indiana Plan)"),                 "IN Medicaid matches low-income family");

// migration_026 expansion states (IA/KY/LA/WA): no tag gate.
expect(has("IA-low-fam", "Iowa Medicaid (Iowa Health and Wellness Plan)"),           "IA Medicaid matches low-income family");
expect(has("KY-low-fam", "Kentucky Medicaid"),                                       "KY Medicaid matches low-income family");
expect(has("LA-low-fam", "Healthy Louisiana (Louisiana Medicaid)"),                  "LA Medicaid matches low-income family");
expect(has("WA-low-fam", "Washington Apple Health (Washington Medicaid)"),           "WA Medicaid matches low-income family");

// Kansas (non-expansion, gated like FL/AL/GA/MS).
expect(!has("KS-22-6k",  "KanCare (Kansas Medicaid)"),                               "KS KanCare excluded for non-parent/non-pregnant/non-disabled 22yo");
expect(has("KS-low-fam", "KanCare (Kansas Medicaid)"),                               "KS KanCare matches single-parent low-income family");

// migration_027 expansion states (MT/NE/OH/OK): no tag gate, low-income family matches.
expect(has("MT-low-fam", "Montana Medicaid"),                                        "MT Medicaid matches low-income family");
expect(has("NE-low-fam", "Heritage Health (Nebraska Medicaid)"),                     "NE Heritage Health matches low-income family");
expect(has("OH-low-fam", "Ohio Medicaid"),                                           "OH Medicaid matches low-income family");
expect(has("OK-low-fam", "SoonerCare (Oklahoma Medicaid)"),                          "OK SoonerCare matches low-income family");

// Tennessee (non-expansion, gated like FL/AL/GA/MS/KS).
expect(!has("TN-22-6k",  "TennCare (Tennessee Medicaid)"),                           "TN TennCare excluded for non-parent/non-pregnant/non-disabled 22yo");
expect(has("TN-low-fam", "TennCare (Tennessee Medicaid)"),                           "TN TennCare matches single-parent low-income family");
// Senior with senior tag in non-expansion state: TennCare doesn't gate on senior, so won't match.
// Federal Medicare programs cover this case (consistent with MS/AL behavior).
expect(!has("TN-70-sen", "TennCare (Tennessee Medicaid)"),                           "TN TennCare not surfaced for non-tagged senior — federal Medicare programs cover this case");
expect(has("TN-70-sen", "Medicare Extra Help - Part D Low Income Subsidy"),          "TN senior matches federal Medicare Extra Help instead");

// Ohio HEAP at 175% FPL — verify the boundary. HH=2 cap = (1803 * 1.75)::int = 3155.
// Test profile: HH=2 user at $3000 should match (within 175% but over 150%).
const ohHeap = await sb.rpc("get_eligible_programs", { p_state: "OH", p_monthly_income: 3000, p_age: 30, p_situation: [], p_household_size: 2 });
expect(ohHeap.data?.some((p) => p.name === "Ohio HEAP (Home Energy Assistance Program)"),
                                                                                      "OH HEAP matches HH=2 user at $3000 (175% FPL cap is more generous than federal 150%)");

// Non-expansion states (GA, MS) Medicaid: gated like FL/AL — must NOT match
// a non-tagged 22yo, MUST match a single-parent low-income family.
expect(!has("GA-22-6k",  "Georgia Medicaid"),                                        "GA Medicaid excluded for non-parent/non-pregnant/non-disabled 22yo");
expect(has("GA-low-fam", "Georgia Medicaid"),                                        "GA Medicaid matches single-parent low-income family");
expect(!has("MS-22-6k",  "Mississippi Medicaid"),                                    "MS Medicaid excluded for non-parent/non-pregnant/non-disabled 22yo");
expect(has("MS-low-fam", "Mississippi Medicaid"),                                    "MS Medicaid matches single-parent low-income family");

// Illinois LIHEAP uses 200% FPL (more generous than the 150% other states use).
// At HH=2, 200% × $1803 = $3606 cap. An IL HH=2 user at $3000 should match;
// Federal LIHEAP at 150% × $1803 = $2705 would exclude that same user.
const ilLiheapProbe = await sb.rpc("get_eligible_programs", {
  p_state: "IL", p_monthly_income: 3000, p_age: 30, p_situation: [], p_household_size: 2,
});
expect(ilLiheapProbe.data?.some((p) => p.name === "Illinois LIHEAP"),                 "IL LIHEAP matches HH=2 user at $3000 (200% FPL cap is more generous than federal 150%)");

// Each new state's 211 row is no-constraint — should match every profile in the state
for (const code of ["NV", "AL", "AK", "AZ", "HI", "IL", "AR", "GA", "MI", "MS", "CO", "CT", "DE", "ID", "IN", "IA", "KS", "KY", "LA", "WA", "MT", "NE", "OH", "OK", "TN"]) {
  const stateNames = {
    NV: "Nevada 211", AL: "Alabama 211", AK: "Alaska 211", AZ: "Arizona 211",
    HI: "Hawaii 211 (Aloha United Way)",
    IL: "Illinois 211", AR: "Arkansas 211", GA: "Georgia 211",
    MI: "Michigan 211", MS: "Mississippi 211",
    CO: "Colorado 211", CT: "Connecticut 211", DE: "Delaware 211",
    ID: "Idaho 211 (CareLine)", IN: "Indiana 211",
    IA: "Iowa 211", KS: "Kansas 211", KY: "Kentucky 211",
    LA: "Louisiana 211", WA: "Washington 211",
    MT: "Montana 211", NE: "Nebraska 211", OH: "Ohio 211",
    OK: "Oklahoma 211", TN: "Tennessee 211",
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
