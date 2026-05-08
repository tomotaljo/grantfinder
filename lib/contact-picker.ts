import type { Program } from "./supabase";

// Categories surfaced on the zero-state, in priority order.
// First 5 render prominently; the rest collapse into "Show more contacts."
// Order: specific over generic — direct-need categories before referral routers.
export const ZERO_STATE_CATEGORIES = [
  "Health Insurance",
  "Food Assistance",
  "Housing Assistance",
  "Income Assistance",
  "Information & Referral",
  "Senior Services",
  "Veteran Services",
] as const;

export const PROMINENT_CONTACT_COUNT = 5;

export interface ContactSlot {
  category: string;
  program: Program;
}

// A rule takes the candidate pool, the user's state code, and a category, and
// returns either a single program (the chosen contact) or null. The picker
// applies rules in order, and the first non-null result wins.
//
// Adding a future `is_primary_contact_for_category` admin override means
// inserting a new rule at the top of CONTACT_RULES — no rewrite of the picker
// or the consumers needed.
export type ContactRule = (
  programs: Program[],
  stateCode: string,
  category: string,
) => Program | null;

const stateMatchRule: ContactRule = (programs, stateCode, category) =>
  programs
    .filter(
      (p) =>
        p.is_active &&
        p.category === category &&
        p.scope === "state" &&
        p.state === stateCode
    )
    .sort((a, b) => b.benefit_value - a.benefit_value)[0] ?? null;

const federalFallbackRule: ContactRule = (programs, _stateCode, category) =>
  programs
    .filter((p) => p.is_active && p.category === category && p.scope === "federal")
    .sort((a, b) => b.benefit_value - a.benefit_value)[0] ?? null;

export const CONTACT_RULES: ContactRule[] = [
  // Future: admin override (uncomment once the column exists)
  // (programs, stateCode, category) =>
  //   programs.find(
  //     (p) =>
  //       p.is_active &&
  //       p.is_primary_contact_for_category === category &&
  //       (p.state === stateCode || p.scope === "federal")
  //   ) ?? null,
  stateMatchRule,
  federalFallbackRule,
];

export function pickContact(
  programs: Program[],
  stateCode: string,
  category: string,
): Program | null {
  for (const rule of CONTACT_RULES) {
    const hit = rule(programs, stateCode, category);
    if (hit) return hit;
  }
  return null;
}

export function buildZeroStateContacts(
  programs: Program[],
  stateCode: string,
): ContactSlot[] {
  return ZERO_STATE_CATEGORIES
    .map<ContactSlot | null>((category) => {
      const program = pickContact(programs, stateCode, category);
      return program ? { category, program } : null;
    })
    .filter((c): c is ContactSlot => c !== null);
}
