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
];

const all = {};
for (const p of profiles) {
  const { data, error } = await sb.rpc("get_eligible_programs", {
    p_state: p.state, p_monthly_income: p.income, p_age: p.age, p_situation: p.sit,
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
