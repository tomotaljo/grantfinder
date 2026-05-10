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
  { id: "FL-low-fam",  desc: "FL, 25, $800/mo, [with_children, low_income]",   state: "FL", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "FL-70-sen",   desc: "FL, 70, $1000/mo, [senior]",                     state: "FL", age: 70, income: 1000, sit: ["senior"] },
  { id: "NY-22-6k",    desc: "NY, 22, $6000/mo, []",                           state: "NY", age: 22, income: 6000, sit: [] },
  { id: "NY-low-fam",  desc: "NY, 25, $800/mo, [with_children, low_income]",   state: "NY", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "NY-70-sen",   desc: "NY, 70, $1000/mo, [senior]",                     state: "NY", age: 70, income: 1000, sit: ["senior"] },

  // NV/AL/AK/AZ coverage (added with migration_022).
  { id: "NV-22-6k",    desc: "NV, 22, $6000/mo, []",                           state: "NV", age: 22, income: 6000, sit: [] },
  { id: "NV-low-fam",  desc: "NV, 25, $800/mo, [with_children, low_income]",   state: "NV", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "NV-70-sen",   desc: "NV, 70, $1000/mo, [senior]",                     state: "NV", age: 70, income: 1000, sit: ["senior"] },
  { id: "AL-22-6k",    desc: "AL, 22, $6000/mo, []",                           state: "AL", age: 22, income: 6000, sit: [] },
  { id: "AL-low-fam",  desc: "AL, 25, $600/mo, [with_children, low_income]",   state: "AL", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "AL-70-sen",   desc: "AL, 70, $1000/mo, [senior]",                     state: "AL", age: 70, income: 1000, sit: ["senior"] },
  { id: "AK-22-6k",    desc: "AK, 22, $6000/mo, []",                           state: "AK", age: 22, income: 6000, sit: [] },
  { id: "AK-low-fam",  desc: "AK, 25, $1500/mo, [with_children, low_income]",  state: "AK", age: 25, income: 1500, sit: ["with_children", "low_income"] },
  { id: "AK-70-sen",   desc: "AK, 70, $1200/mo, [senior]",                     state: "AK", age: 70, income: 1200, sit: ["senior"] },
  { id: "AZ-22-6k",    desc: "AZ, 22, $6000/mo, []",                           state: "AZ", age: 22, income: 6000, sit: [] },
  { id: "AZ-low-fam",  desc: "AZ, 25, $800/mo, [with_children, low_income]",   state: "AZ", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "AZ-70-sen",   desc: "AZ, 70, $1000/mo, [senior]",                     state: "AZ", age: 70, income: 1000, sit: ["senior"] },

  // Hawaii (added with migration_023). Slightly higher incomes per profile
  // since HI has higher cost-of-living + higher TANF cap ($1,500).
  { id: "HI-22-6k",    desc: "HI, 22, $6000/mo, []",                           state: "HI", age: 22, income: 6000, sit: [] },
  { id: "HI-low-fam",  desc: "HI, 25, $1200/mo, [with_children, low_income]",  state: "HI", age: 25, income: 1200, sit: ["with_children", "low_income"] },
  { id: "HI-70-sen",   desc: "HI, 70, $1000/mo, [senior]",                     state: "HI", age: 70, income: 1000, sit: ["senior"] },

  // IL/AR/GA/MI/MS coverage (added with migration_024).
  { id: "IL-22-6k",    desc: "IL, 22, $6000/mo, []",                           state: "IL", age: 22, income: 6000, sit: [] },
  { id: "IL-low-fam",  desc: "IL, 25, $800/mo, [with_children, low_income]",   state: "IL", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "IL-70-sen",   desc: "IL, 70, $1000/mo, [senior]",                     state: "IL", age: 70, income: 1000, sit: ["senior"] },
  { id: "AR-22-6k",    desc: "AR, 22, $6000/mo, []",                           state: "AR", age: 22, income: 6000, sit: [] },
  { id: "AR-low-fam",  desc: "AR, 25, $600/mo, [with_children, low_income]",   state: "AR", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "AR-70-sen",   desc: "AR, 70, $1000/mo, [senior]",                     state: "AR", age: 70, income: 1000, sit: ["senior"] },
  { id: "GA-22-6k",    desc: "GA, 22, $6000/mo, []",                           state: "GA", age: 22, income: 6000, sit: [] },
  { id: "GA-low-fam",  desc: "GA, 25, $600/mo, [with_children, low_income]",   state: "GA", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "GA-70-sen",   desc: "GA, 70, $1000/mo, [senior]",                     state: "GA", age: 70, income: 1000, sit: ["senior"] },
  { id: "MI-22-6k",    desc: "MI, 22, $6000/mo, []",                           state: "MI", age: 22, income: 6000, sit: [] },
  { id: "MI-low-fam",  desc: "MI, 25, $800/mo, [with_children, low_income]",   state: "MI", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "MI-70-sen",   desc: "MI, 70, $1000/mo, [senior]",                     state: "MI", age: 70, income: 1000, sit: ["senior"] },
  { id: "MS-22-6k",    desc: "MS, 22, $6000/mo, []",                           state: "MS", age: 22, income: 6000, sit: [] },
  { id: "MS-low-fam",  desc: "MS, 25, $500/mo, [with_children, low_income]",   state: "MS", age: 25, income: 500,  sit: ["with_children", "low_income"] },
  { id: "MS-70-sen",   desc: "MS, 70, $1000/mo, [senior]",                     state: "MS", age: 70, income: 1000, sit: ["senior"] },

  // CO/CT/DE/ID/IN coverage (added with migration_025).
  { id: "CO-22-6k",    desc: "CO, 22, $6000/mo, []",                           state: "CO", age: 22, income: 6000, sit: [] },
  { id: "CO-low-fam",  desc: "CO, 25, $800/mo, [with_children, low_income]",   state: "CO", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "CO-70-sen",   desc: "CO, 70, $1000/mo, [senior]",                     state: "CO", age: 70, income: 1000, sit: ["senior"] },
  { id: "CT-22-6k",    desc: "CT, 22, $6000/mo, []",                           state: "CT", age: 22, income: 6000, sit: [] },
  { id: "CT-low-fam",  desc: "CT, 25, $1200/mo, [with_children, low_income]",  state: "CT", age: 25, income: 1200, sit: ["with_children", "low_income"] },
  { id: "CT-70-sen",   desc: "CT, 70, $1000/mo, [senior]",                     state: "CT", age: 70, income: 1000, sit: ["senior"] },
  { id: "DE-22-6k",    desc: "DE, 22, $6000/mo, []",                           state: "DE", age: 22, income: 6000, sit: [] },
  { id: "DE-low-fam",  desc: "DE, 25, $600/mo, [with_children, low_income]",   state: "DE", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "DE-70-sen",   desc: "DE, 70, $1000/mo, [senior]",                     state: "DE", age: 70, income: 1000, sit: ["senior"] },
  { id: "ID-22-6k",    desc: "ID, 22, $6000/mo, []",                           state: "ID", age: 22, income: 6000, sit: [] },
  { id: "ID-low-fam",  desc: "ID, 25, $600/mo, [with_children, low_income]",   state: "ID", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "ID-70-sen",   desc: "ID, 70, $1000/mo, [senior]",                     state: "ID", age: 70, income: 1000, sit: ["senior"] },
  { id: "IN-22-6k",    desc: "IN, 22, $6000/mo, []",                           state: "IN", age: 22, income: 6000, sit: [] },
  { id: "IN-low-fam",  desc: "IN, 25, $600/mo, [with_children, low_income]",   state: "IN", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "IN-70-sen",   desc: "IN, 70, $1000/mo, [senior]",                     state: "IN", age: 70, income: 1000, sit: ["senior"] },

  // IA/KS/KY/LA/WA coverage (added with migration_026).
  { id: "IA-22-6k",    desc: "IA, 22, $6000/mo, []",                           state: "IA", age: 22, income: 6000, sit: [] },
  { id: "IA-low-fam",  desc: "IA, 25, $800/mo, [with_children, low_income]",   state: "IA", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "IA-70-sen",   desc: "IA, 70, $1000/mo, [senior]",                     state: "IA", age: 70, income: 1000, sit: ["senior"] },
  { id: "KS-22-6k",    desc: "KS, 22, $6000/mo, []",                           state: "KS", age: 22, income: 6000, sit: [] },
  { id: "KS-low-fam",  desc: "KS, 25, $700/mo, [with_children, low_income]",   state: "KS", age: 25, income: 700,  sit: ["with_children", "low_income"] },
  { id: "KS-70-sen",   desc: "KS, 70, $1000/mo, [senior]",                     state: "KS", age: 70, income: 1000, sit: ["senior"] },
  { id: "KY-22-6k",    desc: "KY, 22, $6000/mo, []",                           state: "KY", age: 22, income: 6000, sit: [] },
  { id: "KY-low-fam",  desc: "KY, 25, $600/mo, [with_children, low_income]",   state: "KY", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "KY-70-sen",   desc: "KY, 70, $1000/mo, [senior]",                     state: "KY", age: 70, income: 1000, sit: ["senior"] },
  { id: "LA-22-6k",    desc: "LA, 22, $6000/mo, []",                           state: "LA", age: 22, income: 6000, sit: [] },
  { id: "LA-low-fam",  desc: "LA, 25, $500/mo, [with_children, low_income]",   state: "LA", age: 25, income: 500,  sit: ["with_children", "low_income"] },
  { id: "LA-70-sen",   desc: "LA, 70, $1000/mo, [senior]",                     state: "LA", age: 70, income: 1000, sit: ["senior"] },
  { id: "WA-22-6k",    desc: "WA, 22, $6000/mo, []",                           state: "WA", age: 22, income: 6000, sit: [] },
  { id: "WA-low-fam",  desc: "WA, 25, $1200/mo, [with_children, low_income]",  state: "WA", age: 25, income: 1200, sit: ["with_children", "low_income"] },
  { id: "WA-70-sen",   desc: "WA, 70, $1000/mo, [senior]",                     state: "WA", age: 70, income: 1000, sit: ["senior"] },

  // MT/NE/OH/OK/TN coverage (added with migration_027). 8 categories per
  // state — the housing-finance slot was deliberately omitted.
  { id: "MT-22-6k",    desc: "MT, 22, $6000/mo, []",                           state: "MT", age: 22, income: 6000, sit: [] },
  { id: "MT-low-fam",  desc: "MT, 25, $800/mo, [with_children, low_income]",   state: "MT", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "MT-70-sen",   desc: "MT, 70, $1000/mo, [senior]",                     state: "MT", age: 70, income: 1000, sit: ["senior"] },
  { id: "NE-22-6k",    desc: "NE, 22, $6000/mo, []",                           state: "NE", age: 22, income: 6000, sit: [] },
  { id: "NE-low-fam",  desc: "NE, 25, $700/mo, [with_children, low_income]",   state: "NE", age: 25, income: 700,  sit: ["with_children", "low_income"] },
  { id: "NE-70-sen",   desc: "NE, 70, $1000/mo, [senior]",                     state: "NE", age: 70, income: 1000, sit: ["senior"] },
  { id: "OH-22-6k",    desc: "OH, 22, $6000/mo, []",                           state: "OH", age: 22, income: 6000, sit: [] },
  { id: "OH-low-fam",  desc: "OH, 25, $1000/mo, [with_children, low_income]",  state: "OH", age: 25, income: 1000, sit: ["with_children", "low_income"] },
  { id: "OH-70-sen",   desc: "OH, 70, $1000/mo, [senior]",                     state: "OH", age: 70, income: 1000, sit: ["senior"] },
  { id: "OK-22-6k",    desc: "OK, 22, $6000/mo, []",                           state: "OK", age: 22, income: 6000, sit: [] },
  { id: "OK-low-fam",  desc: "OK, 25, $600/mo, [with_children, low_income]",   state: "OK", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "OK-70-sen",   desc: "OK, 70, $1000/mo, [senior]",                     state: "OK", age: 70, income: 1000, sit: ["senior"] },
  { id: "TN-22-6k",    desc: "TN, 22, $6000/mo, []",                           state: "TN", age: 22, income: 6000, sit: [] },
  { id: "TN-low-fam",  desc: "TN, 25, $700/mo, [with_children, low_income]",   state: "TN", age: 25, income: 700,  sit: ["with_children", "low_income"] },
  { id: "TN-70-sen",   desc: "TN, 70, $1000/mo, [senior]",                     state: "TN", age: 70, income: 1000, sit: ["senior"] },

  // WY/MA/PA/NJ/NC coverage (added with migration_029). WY is non-expansion;
  // NC expanded Medicaid Dec 2023 — senior on NC should match NC Medicaid
  // (no tag gate), senior on WY should NOT match WY Medicaid (gated).
  { id: "WY-22-6k",    desc: "WY, 22, $6000/mo, []",                           state: "WY", age: 22, income: 6000, sit: [] },
  { id: "WY-low-fam",  desc: "WY, 25, $1000/mo, [with_children, low_income]",  state: "WY", age: 25, income: 1000, sit: ["with_children", "low_income"] },
  { id: "WY-70-sen",   desc: "WY, 70, $1100/mo, [senior]",                     state: "WY", age: 70, income: 1100, sit: ["senior"] },
  { id: "MA-22-6k",    desc: "MA, 22, $6000/mo, []",                           state: "MA", age: 22, income: 6000, sit: [] },
  { id: "MA-low-fam",  desc: "MA, 25, $1200/mo, [with_children, low_income]",  state: "MA", age: 25, income: 1200, sit: ["with_children", "low_income"] },
  { id: "MA-70-sen",   desc: "MA, 70, $1000/mo, [senior]",                     state: "MA", age: 70, income: 1000, sit: ["senior"] },
  { id: "PA-22-6k",    desc: "PA, 22, $6000/mo, []",                           state: "PA", age: 22, income: 6000, sit: [] },
  { id: "PA-low-fam",  desc: "PA, 25, $800/mo, [with_children, low_income]",   state: "PA", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "PA-70-sen",   desc: "PA, 70, $1000/mo, [senior]",                     state: "PA", age: 70, income: 1000, sit: ["senior"] },
  { id: "NJ-22-6k",    desc: "NJ, 22, $6000/mo, []",                           state: "NJ", age: 22, income: 6000, sit: [] },
  { id: "NJ-low-fam",  desc: "NJ, 25, $1000/mo, [with_children, low_income]",  state: "NJ", age: 25, income: 1000, sit: ["with_children", "low_income"] },
  { id: "NJ-70-sen",   desc: "NJ, 70, $1000/mo, [senior]",                     state: "NJ", age: 70, income: 1000, sit: ["senior"] },
  { id: "NC-22-6k",    desc: "NC, 22, $6000/mo, []",                           state: "NC", age: 22, income: 6000, sit: [] },
  { id: "NC-low-fam",  desc: "NC, 25, $700/mo, [with_children, low_income]",   state: "NC", age: 25, income: 700,  sit: ["with_children", "low_income"] },
  { id: "NC-70-sen",   desc: "NC, 70, $1000/mo, [senior]",                     state: "NC", age: 70, income: 1000, sit: ["senior"] },

  // texas-chip gate fix (migration_031, migration_036). Pre-fix: TX-CHIP
  // matched any TX user under $5300/mo regardless of household composition.
  // Post-fix: gated on with_children (originally single_parent, renamed in
  // migration_036).
  { id: "TX-30-2.5k-nokids", desc: "TX, 30, $2500/mo, [], hh=1 (childless adult)", state: "TX", age: 30, income: 2500, sit: [], hh: 1 },
  { id: "TX-25-2k-wc",       desc: "TX, 25, $2000/mo, [with_children], hh=2",     state: "TX", age: 25, income: 2000, sit: ["with_children"], hh: 2 },
  { id: "TX-30-4.5k-wc",     desc: "TX, 30, $4500/mo, [with_children], hh=4",     state: "TX", age: 30, income: 4500, sit: ["with_children"], hh: 4 },

  // ME/MD/ND/OR/SC coverage (added with migration_032). SC is non-expansion;
  // ME/MD/ND/OR are expansion. Maine 2019, ND 2014, MD/OR 2014.
  { id: "ME-22-6k",    desc: "ME, 22, $6000/mo, []",                           state: "ME", age: 22, income: 6000, sit: [] },
  { id: "ME-low-fam",  desc: "ME, 25, $1000/mo, [with_children, low_income]",  state: "ME", age: 25, income: 1000, sit: ["with_children", "low_income"] },
  { id: "ME-70-sen",   desc: "ME, 70, $1000/mo, [senior]",                     state: "ME", age: 70, income: 1000, sit: ["senior"] },
  { id: "MD-22-6k",    desc: "MD, 22, $6000/mo, []",                           state: "MD", age: 22, income: 6000, sit: [] },
  { id: "MD-low-fam",  desc: "MD, 25, $1200/mo, [with_children, low_income]",  state: "MD", age: 25, income: 1200, sit: ["with_children", "low_income"] },
  { id: "MD-70-sen",   desc: "MD, 70, $1000/mo, [senior]",                     state: "MD", age: 70, income: 1000, sit: ["senior"] },
  { id: "ND-22-6k",    desc: "ND, 22, $6000/mo, []",                           state: "ND", age: 22, income: 6000, sit: [] },
  { id: "ND-low-fam",  desc: "ND, 25, $800/mo, [with_children, low_income]",   state: "ND", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "ND-70-sen",   desc: "ND, 70, $1000/mo, [senior]",                     state: "ND", age: 70, income: 1000, sit: ["senior"] },
  { id: "OR-22-6k",    desc: "OR, 22, $6000/mo, []",                           state: "OR", age: 22, income: 6000, sit: [] },
  { id: "OR-low-fam",  desc: "OR, 25, $1000/mo, [with_children, low_income]",  state: "OR", age: 25, income: 1000, sit: ["with_children", "low_income"] },
  { id: "OR-70-sen",   desc: "OR, 70, $1000/mo, [senior]",                     state: "OR", age: 70, income: 1000, sit: ["senior"] },
  { id: "SC-22-6k",    desc: "SC, 22, $6000/mo, []",                           state: "SC", age: 22, income: 6000, sit: [] },
  { id: "SC-low-fam",  desc: "SC, 25, $600/mo, [with_children, low_income]",   state: "SC", age: 25, income: 600,  sit: ["with_children", "low_income"] },
  { id: "SC-70-sen",   desc: "SC, 70, $1000/mo, [senior]",                     state: "SC", age: 70, income: 1000, sit: ["senior"] },

  // MN/MO/NM/NH coverage (added with migration_033). All four are expansion
  // states — MO recent (Amendment 2 in 2020, coverage took effect 2021-2022).
  { id: "MN-22-6k",    desc: "MN, 22, $6000/mo, []",                           state: "MN", age: 22, income: 6000, sit: [] },
  { id: "MN-low-fam",  desc: "MN, 25, $1000/mo, [with_children, low_income]",  state: "MN", age: 25, income: 1000, sit: ["with_children", "low_income"] },
  { id: "MN-70-sen",   desc: "MN, 70, $1000/mo, [senior]",                     state: "MN", age: 70, income: 1000, sit: ["senior"] },
  { id: "MO-22-6k",    desc: "MO, 22, $6000/mo, []",                           state: "MO", age: 22, income: 6000, sit: [] },
  { id: "MO-low-fam",  desc: "MO, 25, $700/mo, [with_children, low_income]",   state: "MO", age: 25, income: 700,  sit: ["with_children", "low_income"] },
  { id: "MO-70-sen",   desc: "MO, 70, $1000/mo, [senior]",                     state: "MO", age: 70, income: 1000, sit: ["senior"] },
  { id: "NM-22-6k",    desc: "NM, 22, $6000/mo, []",                           state: "NM", age: 22, income: 6000, sit: [] },
  { id: "NM-low-fam",  desc: "NM, 25, $800/mo, [with_children, low_income]",   state: "NM", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "NM-70-sen",   desc: "NM, 70, $1000/mo, [senior]",                     state: "NM", age: 70, income: 1000, sit: ["senior"] },
  { id: "NH-22-6k",    desc: "NH, 22, $6000/mo, []",                           state: "NH", age: 22, income: 6000, sit: [] },
  { id: "NH-low-fam",  desc: "NH, 25, $1300/mo, [with_children, low_income]",  state: "NH", age: 25, income: 1300, sit: ["with_children", "low_income"] },
  { id: "NH-70-sen",   desc: "NH, 70, $1000/mo, [senior]",                     state: "NH", age: 70, income: 1000, sit: ["senior"] },

  // RI/SD/UT/VT coverage (added with migration_034). All four are expansion
  // states — SD recent (Constitutional Amendment D 2022, effective Jul 2023).
  { id: "RI-22-6k",    desc: "RI, 22, $6000/mo, []",                           state: "RI", age: 22, income: 6000, sit: [] },
  { id: "RI-low-fam",  desc: "RI, 25, $1100/mo, [with_children, low_income]",  state: "RI", age: 25, income: 1100, sit: ["with_children", "low_income"] },
  { id: "RI-70-sen",   desc: "RI, 70, $1000/mo, [senior]",                     state: "RI", age: 70, income: 1000, sit: ["senior"] },
  { id: "SD-22-6k",    desc: "SD, 22, $6000/mo, []",                           state: "SD", age: 22, income: 6000, sit: [] },
  { id: "SD-low-fam",  desc: "SD, 25, $900/mo, [with_children, low_income]",   state: "SD", age: 25, income: 900,  sit: ["with_children", "low_income"] },
  { id: "SD-70-sen",   desc: "SD, 70, $1000/mo, [senior]",                     state: "SD", age: 70, income: 1000, sit: ["senior"] },
  { id: "UT-22-6k",    desc: "UT, 22, $6000/mo, []",                           state: "UT", age: 22, income: 6000, sit: [] },
  { id: "UT-low-fam",  desc: "UT, 25, $800/mo, [with_children, low_income]",   state: "UT", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "UT-70-sen",   desc: "UT, 70, $1000/mo, [senior]",                     state: "UT", age: 70, income: 1000, sit: ["senior"] },
  { id: "VT-22-6k",    desc: "VT, 22, $6000/mo, []",                           state: "VT", age: 22, income: 6000, sit: [] },
  { id: "VT-low-fam",  desc: "VT, 25, $1300/mo, [with_children, low_income]",  state: "VT", age: 25, income: 1300, sit: ["with_children", "low_income"] },
  { id: "VT-70-sen",   desc: "VT, 70, $1000/mo, [senior]",                     state: "VT", age: 70, income: 1000, sit: ["senior"] },

  // VA/WI/WV/DC coverage (added with migration_035) — final state batch.
  // Wisconsin is a unique BadgerCare case (100% FPL Medicaid waiver, not
  // the ACA 138% expansion). DC has unusually generous Medicaid (we model
  // at the conservative 138% baseline).
  { id: "VA-22-6k",    desc: "VA, 22, $6000/mo, []",                           state: "VA", age: 22, income: 6000, sit: [] },
  { id: "VA-low-fam",  desc: "VA, 25, $800/mo, [with_children, low_income]",   state: "VA", age: 25, income: 800,  sit: ["with_children", "low_income"] },
  { id: "VA-70-sen",   desc: "VA, 70, $1000/mo, [senior]",                     state: "VA", age: 70, income: 1000, sit: ["senior"] },
  { id: "WI-22-6k",    desc: "WI, 22, $6000/mo, []",                           state: "WI", age: 22, income: 6000, sit: [] },
  { id: "WI-low-fam",  desc: "WI, 25, $1000/mo, [with_children, low_income]",  state: "WI", age: 25, income: 1000, sit: ["with_children", "low_income"] },
  { id: "WI-22-1k",    desc: "WI, 22, $1000/mo, [], hh=1 (under 100% FPL)",    state: "WI", age: 22, income: 1000, sit: [], hh: 1 },
  { id: "WI-22-1.6k",  desc: "WI, 22, $1600/mo, [], hh=1 (in 100-138% gap)",   state: "WI", age: 22, income: 1600, sit: [], hh: 1 },
  { id: "WI-70-sen",   desc: "WI, 70, $1000/mo, [senior]",                     state: "WI", age: 70, income: 1000, sit: ["senior"] },
  { id: "WV-22-6k",    desc: "WV, 22, $6000/mo, []",                           state: "WV", age: 22, income: 6000, sit: [] },
  { id: "WV-low-fam",  desc: "WV, 25, $900/mo, [with_children, low_income]",   state: "WV", age: 25, income: 900,  sit: ["with_children", "low_income"] },
  { id: "WV-70-sen",   desc: "WV, 70, $1000/mo, [senior]",                     state: "WV", age: 70, income: 1000, sit: ["senior"] },
  { id: "DC-22-6k",    desc: "DC, 22, $6000/mo, []",                           state: "DC", age: 22, income: 6000, sit: [] },
  { id: "DC-low-fam",  desc: "DC, 25, $1200/mo, [with_children, low_income]",  state: "DC", age: 25, income: 1200, sit: ["with_children", "low_income"] },
  { id: "DC-70-sen",   desc: "DC, 70, $1000/mo, [senior]",                     state: "DC", age: 70, income: 1000, sit: ["senior"] },
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

// Florida Medicaid is gated on with_children/pregnant/disability — must NOT
// match a non-tagged 22yo, MUST match the with-children low-income family.
expect(!has("FL-22-6k",  "Florida Medicaid"),                                      "FL Medicaid excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("FL-low-fam", "Florida Medicaid"),                                      "FL Medicaid matches with-children low-income family");

// Florida TCA (TANF) — strict tag gate
expect(!has("FL-22-6k",  "Florida Temporary Cash Assistance (TCA)"),               "FL TCA excluded for childless adult");
expect(has("FL-low-fam", "Florida Temporary Cash Assistance (TCA)"),               "FL TCA matches with-children low-income family");

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
//
// Migration_030 deactivated the federal SNAP row, so these probes now
// anchor on Alabama SNAP (state-scope, 130% FPL, no required_situations) —
// same FPL boundary the federal row used to enforce. AL was chosen because
// it's a 130%-FPL row in a state with mostly tag-gated other programs, so
// the boundary-crossing of SNAP itself is the dominant signal.
const SNAP_AL = "Alabama SNAP (Food Assistance)";

const hhBase = { p_state: "AL", p_monthly_income: 3000, p_age: 30, p_situation: [] };
const hhProbe1 = await sb.rpc("get_eligible_programs", { ...hhBase, p_household_size: 1 });
const hhProbe4 = await sb.rpc("get_eligible_programs", { ...hhBase, p_household_size: 4 });
expect(!hhProbe1.error && !hhProbe4.error,                                          "RPC accepts p_household_size for HH=1 and HH=4");
expect(hhProbe4.data.length > hhProbe1.data.length,                                  "AL HH=4 at $3000 matches more programs than HH=1 (FPL caps scale up)");

// Headline bug fix: HH=4 family at $3000/mo matches the state SNAP row.
// Cap = 130% × $2600 (HH=4 FPL) = $3380. Was a false negative pre-migration_020.
expect(hhProbe4.data.some((p) => p.name === SNAP_AL),                                "Alabama SNAP matches AL HH=4 at $3000 (FPL filter passes)");
expect(!hhProbe1.data.some((p) => p.name === SNAP_AL),                               "Alabama SNAP does NOT match AL HH=1 at $3000 (130% × $1330 = $1729 cap)");

// ── NV/AL/AK/AZ coverage (migration_022) ────────────────────────────────

// Working-age $6k profiles: small result sets, no senior/disability leaks.
for (const code of ["NV", "AL", "AK", "AZ", "HI", "IL", "AR", "GA", "MI", "MS", "CO", "CT", "DE", "ID", "IN", "IA", "KS", "KY", "LA", "WA", "MT", "NE", "OH", "OK", "TN", "WY", "MA", "PA", "NJ", "NC", "ME", "MD", "ND", "OR", "SC", "MN", "MO", "NM", "NH", "RI", "SD", "UT", "VT", "VA", "WI", "WV", "DC"]) {
  const rows = all[`${code}-22-6k`];
  expect(rows.length <= 4,                                                           `${code}-22-6k row count ≤ 4 (got ${rows.length})`);
  expect(!rows.some((p) => sit(p).includes("senior") || sit(p).includes("disability")),
                                                                                      `${code}-22-6k contains no senior/disability programs`);
  // State isolation
  const otherState = rows.filter((p) => p.scope === "state" && p.state !== code);
  expect(otherState.length === 0,                                                    `${code}-22-6k has no non-${code} state programs`);
}

// Alabama Medicaid is gated like FL — must NOT match a non-tagged 22yo,
// MUST match a with-children low-income family.
expect(!has("AL-22-6k",  "Alabama Medicaid"),                                       "AL Medicaid excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("AL-low-fam", "Alabama Medicaid"),                                       "AL Medicaid matches with-children low-income family");

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
expect(has("WY-70-sen", "Wyoming Aging Division"),                                  "WY Aging matches WY 70yo with senior tag");
expect(has("MA-70-sen", "Massachusetts Executive Office of Aging & Independence"),  "MA Aging matches MA 70yo with senior tag");
expect(has("PA-70-sen", "Pennsylvania Department of Aging"),                        "PA Aging matches PA 70yo with senior tag");
expect(has("NJ-70-sen", "New Jersey Division of Aging Services"),                   "NJ Aging matches NJ 70yo with senior tag");
expect(has("NC-70-sen", "North Carolina Division of Aging"),                        "NC Aging matches NC 70yo with senior tag");
expect(has("ME-70-sen", "Maine Office of Aging and Disability Services (OADS)"),    "ME OADS matches ME 70yo with senior tag");
expect(has("MD-70-sen", "Maryland Department of Aging"),                            "MD Aging matches MD 70yo with senior tag");
expect(has("ND-70-sen", "North Dakota Aging Services Division"),                    "ND Aging matches ND 70yo with senior tag");
expect(has("OR-70-sen", "Oregon Aging and People with Disabilities (APD)"),         "OR APD matches OR 70yo with senior tag");
expect(has("SC-70-sen", "South Carolina Department on Aging"),                      "SC Aging matches SC 70yo with senior tag");
expect(has("MN-70-sen", "Minnesota Board on Aging"),                                "MN Board on Aging matches MN 70yo with senior tag");
expect(has("MO-70-sen", "Missouri Senior and Disability Services"),                 "MO Senior Services matches MO 70yo with senior tag");
expect(has("NM-70-sen", "New Mexico Aging and Long-Term Services Department (ALTSD)"), "NM ALTSD matches NM 70yo with senior tag");
expect(has("NH-70-sen", "New Hampshire Bureau of Elderly and Adult Services (BEAS)"),  "NH BEAS matches NH 70yo with senior tag");
expect(has("RI-70-sen", "Rhode Island Office of Healthy Aging (OHA)"),              "RI OHA matches RI 70yo with senior tag");
expect(has("SD-70-sen", "South Dakota Adult Services and Aging"),                   "SD Adult Services & Aging matches SD 70yo with senior tag");
expect(has("UT-70-sen", "Utah Aging and Adult Services"),                           "UT Aging matches UT 70yo with senior tag");
expect(has("VT-70-sen", "Vermont Department of Disabilities, Aging and Independent Living (DAIL)"), "VT DAIL matches VT 70yo with senior tag");
expect(has("VA-70-sen", "Virginia Department for Aging and Rehabilitative Services (DARS)"), "VA DARS matches VA 70yo with senior tag");
expect(has("WI-70-sen", "Wisconsin Bureau of Aging and Disability Resources (BADR)"),       "WI BADR matches WI 70yo with senior tag");
expect(has("WV-70-sen", "West Virginia Bureau of Senior Services"),                          "WV Aging matches WV 70yo with senior tag");
expect(has("DC-70-sen", "DC Department of Aging and Community Living (DACL)"),               "DC DACL matches DC 70yo with senior tag");

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
expect(!has("KS-22-6k",  "KanCare (Kansas Medicaid)"),                               "KS KanCare excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("KS-low-fam", "KanCare (Kansas Medicaid)"),                               "KS KanCare matches with-children low-income family");

// migration_027 expansion states (MT/NE/OH/OK): no tag gate, low-income family matches.
expect(has("MT-low-fam", "Montana Medicaid"),                                        "MT Medicaid matches low-income family");
expect(has("NE-low-fam", "Heritage Health (Nebraska Medicaid)"),                     "NE Heritage Health matches low-income family");
expect(has("OH-low-fam", "Ohio Medicaid"),                                           "OH Medicaid matches low-income family");
expect(has("OK-low-fam", "SoonerCare (Oklahoma Medicaid)"),                          "OK SoonerCare matches low-income family");

// Tennessee (non-expansion, gated like FL/AL/GA/MS/KS).
expect(!has("TN-22-6k",  "TennCare (Tennessee Medicaid)"),                           "TN TennCare excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("TN-low-fam", "TennCare (Tennessee Medicaid)"),                           "TN TennCare matches with-children low-income family");
// Senior with senior tag in non-expansion state: TennCare doesn't gate on senior, so won't match.
// Federal Medicare programs cover this case (consistent with MS/AL behavior).
expect(!has("TN-70-sen", "TennCare (Tennessee Medicaid)"),                           "TN TennCare not surfaced for non-tagged senior — federal Medicare programs cover this case");
expect(has("TN-70-sen", "Medicare Extra Help - Part D Low Income Subsidy"),          "TN senior matches federal Medicare Extra Help instead");

// migration_029 expansion states (MA/PA/NJ/NC): no tag gate on Medicaid.
expect(has("MA-low-fam", "MassHealth (Massachusetts Medicaid)"),                     "MA MassHealth matches low-income family");
expect(has("PA-low-fam", "Pennsylvania Medical Assistance (Medicaid)"),              "PA Medical Assistance matches low-income family");
expect(has("NJ-low-fam", "NJ FamilyCare (New Jersey Medicaid)"),                     "NJ FamilyCare matches low-income family");
expect(has("NC-low-fam", "North Carolina Medicaid"),                                 "NC Medicaid matches low-income family");

// Wyoming (non-expansion, gated like FL/AL/GA/MS/KS/TN). The senior asymmetry
// vs. NC is the headline regression-catcher for this batch:
//   WY senior (non-expansion + no parent/pregnancy/disability tag) → no state Medicaid
//   NC senior (expansion as of Dec 2023, ungated)                  → state Medicaid + federal Medicare
expect(!has("WY-22-6k",  "Wyoming Medicaid"),                                        "WY Medicaid excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("WY-low-fam", "Wyoming Medicaid"),                                        "WY Medicaid matches with-children low-income family");
expect(!has("WY-70-sen", "Wyoming Medicaid"),                                        "WY Medicaid not surfaced for non-tagged senior (non-expansion state)");
expect(has("WY-70-sen", "Medicare Extra Help - Part D Low Income Subsidy"),          "WY senior matches federal Medicare Extra Help instead");

// NC senior (expansion state, ungated): state Medicaid AND federal Medicare both surface.
// If NC ever rolls expansion back, this watchpoint will catch the regression.
expect(has("NC-70-sen", "North Carolina Medicaid"),                                  "NC Medicaid matches NC 70yo (expansion state, no tag gate) — regression check on NC's Dec 2023 expansion");
expect(has("NC-70-sen", "Medicare Extra Help - Part D Low Income Subsidy"),          "NC senior also matches federal Medicare Extra Help");

// migration_032 expansion states (ME/MD/ND/OR): no tag gate on Medicaid.
expect(has("ME-low-fam", "MaineCare (Maine Medicaid)"),                              "ME MaineCare matches low-income family");
expect(has("MD-low-fam", "Maryland Medicaid (HealthChoice)"),                        "MD HealthChoice matches low-income family");
expect(has("ND-low-fam", "North Dakota Medicaid Expansion"),                         "ND Medicaid matches low-income family");
expect(has("OR-low-fam", "Oregon Health Plan (Oregon Medicaid)"),                    "OR OHP matches low-income family");

// SC (non-expansion, gated like FL/AL/GA/MS/KS/TN/WY).
expect(!has("SC-22-6k",  "South Carolina Healthy Connections (Medicaid)"),           "SC Healthy Connections excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("SC-low-fam", "South Carolina Healthy Connections (Medicaid)"),           "SC Healthy Connections matches with-children low-income family");
expect(!has("SC-70-sen", "South Carolina Healthy Connections (Medicaid)"),           "SC Healthy Connections not surfaced for non-tagged senior (non-expansion state)");
expect(has("SC-70-sen", "Medicare Extra Help - Part D Low Income Subsidy"),          "SC senior matches federal Medicare Extra Help instead");

// migration_033 expansion states (MN/MO/NM/NH): no tag gate on Medicaid.
expect(has("MN-low-fam", "Minnesota Medical Assistance (MA)"),                       "MN Medical Assistance matches low-income family");
expect(has("MO-low-fam", "MO HealthNet (Missouri Medicaid)"),                        "MO HealthNet matches low-income family — regression check on MO's 2021-2022 expansion");
expect(has("NM-low-fam", "Centennial Care (New Mexico Medicaid)"),                   "NM Centennial Care matches low-income family");
expect(has("NH-low-fam", "Granite Advantage Health Care Program (NH Medicaid)"),     "NH Granite Advantage matches low-income family");

// MO senior (expansion as of 2021-2022, ungated): state Medicaid + federal Medicare both surface.
// If MO ever rolls expansion back, this watchpoint will catch the regression.
expect(has("MO-70-sen", "MO HealthNet (Missouri Medicaid)"),                         "MO HealthNet matches MO 70yo (expansion state, no tag gate)");
expect(has("MO-70-sen", "Medicare Extra Help - Part D Low Income Subsidy"),          "MO senior also matches federal Medicare Extra Help");

// migration_034 expansion states (RI/SD/UT/VT): no tag gate on Medicaid.
expect(has("RI-low-fam", "Rhode Island Medicaid"),                                   "RI Medicaid matches low-income family");
expect(has("SD-low-fam", "South Dakota Medicaid"),                                   "SD Medicaid matches low-income family — regression check on SD's July 2023 expansion");
expect(has("UT-low-fam", "Utah Medicaid"),                                           "UT Medicaid matches low-income family");
expect(has("VT-low-fam", "Vermont Medicaid (Green Mountain Care)"),                  "VT Medicaid matches low-income family");

// SD senior (expansion as of July 2023, ungated): state Medicaid + federal Medicare both surface.
// If SD ever rolls expansion back, this watchpoint will catch the regression.
expect(has("SD-70-sen", "South Dakota Medicaid"),                                    "SD Medicaid matches SD 70yo (expansion state, no tag gate)");
expect(has("SD-70-sen", "Medicare Extra Help - Part D Low Income Subsidy"),          "SD senior also matches federal Medicare Extra Help");

// migration_035 expansion states (VA/WV/DC): no tag gate on Medicaid.
expect(has("VA-low-fam", "Virginia Medicaid (Cover Virginia)"),                      "VA Medicaid matches low-income family");
expect(has("WV-low-fam", "West Virginia Medicaid"),                                  "WV Medicaid matches low-income family");
expect(has("DC-low-fam", "DC Medicaid (DC Healthy Families / Healthcare Alliance)"), "DC Medicaid matches low-income family");

// Wisconsin BadgerCare unique case — adults 0-100% FPL qualify (childless ungated),
// adults 100-138% FPL fall in the coverage gap. HH=1 100% FPL = $1330; the boundary
// sits between WI-22-1k ($1000, under 100%) and WI-22-1.6k ($1600, over 100%).
expect(has("WI-22-1k", "BadgerCare Plus (Wisconsin Medicaid)"),                      "WI BadgerCare matches childless adult under 100% FPL");
expect(!has("WI-22-1.6k", "BadgerCare Plus (Wisconsin Medicaid)"),                   "WI BadgerCare excludes childless adult in 100-138% FPL gap");
expect(has("WI-low-fam", "BadgerCare Plus (Wisconsin Medicaid)"),                    "WI BadgerCare matches with-children low-income family");

// Ohio HEAP at 175% FPL — verify the boundary. HH=2 cap = (1803 * 1.75)::int = 3155.
// Test profile: HH=2 user at $3000 should match (within 175% but over 150%).
const ohHeap = await sb.rpc("get_eligible_programs", { p_state: "OH", p_monthly_income: 3000, p_age: 30, p_situation: [], p_household_size: 2 });
expect(ohHeap.data?.some((p) => p.name === "Ohio HEAP (Home Energy Assistance Program)"),
                                                                                      "OH HEAP matches HH=2 user at $3000 (175% FPL cap is more generous than federal 150%)");

// Non-expansion states (GA, MS) Medicaid: gated like FL/AL — must NOT match
// a non-tagged 22yo, MUST match a with-children low-income family.
expect(!has("GA-22-6k",  "Georgia Medicaid"),                                        "GA Medicaid excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("GA-low-fam", "Georgia Medicaid"),                                        "GA Medicaid matches with-children low-income family");
expect(!has("MS-22-6k",  "Mississippi Medicaid"),                                    "MS Medicaid excluded for childless/non-pregnant/non-disabled 22yo");
expect(has("MS-low-fam", "Mississippi Medicaid"),                                    "MS Medicaid matches with-children low-income family");

// Illinois LIHEAP uses 200% FPL (more generous than the 150% other states use).
// At HH=2, 200% × $1803 = $3606 cap. An IL HH=2 user at $3000 should match;
// Federal LIHEAP at 150% × $1803 = $2705 would exclude that same user.
const ilLiheapProbe = await sb.rpc("get_eligible_programs", {
  p_state: "IL", p_monthly_income: 3000, p_age: 30, p_situation: [], p_household_size: 2,
});
expect(ilLiheapProbe.data?.some((p) => p.name === "Illinois LIHEAP"),                 "IL LIHEAP matches HH=2 user at $3000 (200% FPL cap is more generous than federal 150%)");

// Each new state's 211 row is no-constraint — should match every profile in the state
for (const code of ["NV", "AL", "AK", "AZ", "HI", "IL", "AR", "GA", "MI", "MS", "CO", "CT", "DE", "ID", "IN", "IA", "KS", "KY", "LA", "WA", "MT", "NE", "OH", "OK", "TN", "WY", "MA", "PA", "NJ", "NC", "ME", "MD", "ND", "OR", "SC", "MN", "MO", "NM", "NH", "RI", "SD", "UT", "VT", "VA", "WI", "WV", "DC"]) {
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
    WY: "Wyoming 211", MA: "Mass 2-1-1", PA: "Pennsylvania 211",
    NJ: "NJ 211", NC: "NC 211",
    ME: "Maine 211", MD: "Maryland 211", ND: "North Dakota 211",
    OR: "Oregon 211 (211info)", SC: "South Carolina 211",
    MN: "Minnesota 211 (United Way)", MO: "Missouri 211",
    NM: "New Mexico 211", NH: "New Hampshire 211",
    RI: "Rhode Island 211 (United Way)", SD: "South Dakota 211 (Helpline Center)",
    UT: "Utah 211 (United Way)", VT: "Vermont 211",
    VA: "Virginia 211", WI: "Wisconsin 211", WV: "West Virginia 211",
    DC: "DC 211 (Answers, Please!)",
  };
  const name = stateNames[code];
  expect(has(`${code}-22-6k`, name) && has(`${code}-low-fam`, name) && has(`${code}-70-sen`, name),
                                                                                      `${name} matches all ${code} profiles`);
}

// FPL-percent boundary: HH=1, 130% FPL cap = (1330 * 1.30)::int = 1729
// per 2026 federal poverty guidelines. At $1729 user passes (≤); at $1730
// user fails. Inclusive at the threshold. Anchored on Alabama SNAP since
// migration_030 deactivated the federal SNAP row. AL SNAP is a clean
// 130%-FPL row.
// (Refresh these literals in January when current_fpl_monthly() is updated
// to the new year's guidelines — see TODO.md.)
const boundaryAt   = await sb.rpc("get_eligible_programs", { p_state: "AL", p_monthly_income: 1729, p_age: 30, p_situation: [], p_household_size: 1 });
const boundaryOver = await sb.rpc("get_eligible_programs", { p_state: "AL", p_monthly_income: 1730, p_age: 30, p_situation: [], p_household_size: 1 });
expect(boundaryAt.data.some((p) => p.name === SNAP_AL),                              "Alabama SNAP includes AL HH=1 user at 2026 FPL boundary income $1729");
expect(!boundaryOver.data.some((p) => p.name === SNAP_AL),                           "Alabama SNAP excludes AL HH=1 user at $1730 (just over 130% FPL)");

// ── texas-chip gate fix (migration_031 / migration_036) ─────────────────
// Pre-fix: Texas CHIP matched any TX user under $5300/mo regardless of
// household composition (including childless adults). Post-fix: gated on
// with_children (originally single_parent in migration_031; renamed to
// with_children in migration_036 along with all other family-targeted rows).
const TX_CHIP = "Texas CHIP (Children's Health Insurance Program)";
expect(!has("TX-30-2.5k-nokids", TX_CHIP),                                          "TX CHIP excluded for HH=1 childless adult, $2500/mo, no tags (the false-positive fix)");
expect(has("TX-25-2k-wc", TX_CHIP),                                                 "TX CHIP matches HH=2 user with children at $2000/mo");
expect(has("TX-30-4.5k-wc", TX_CHIP),                                               "TX CHIP matches HH=4 user with children at $4500/mo");

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
