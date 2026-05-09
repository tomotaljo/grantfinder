import { supabaseAdmin } from "@/lib/supabase-admin";
import { STATES } from "@/lib/states";
import ProgramsLanding from "./ProgramsLanding";
import type { StateCounts } from "./StateRow";
import type { Scope } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ProgramsLandingPage() {
  const { data } = await supabaseAdmin
    .from("programs")
    .select("scope, state");

  // One pass: federal total + per-state-per-scope counts.
  let federalCount = 0;
  const byState = new Map<string, StateCounts>();
  for (const r of (data ?? []) as { scope: Scope; state: string | null }[]) {
    if (r.scope === "federal") {
      federalCount += 1;
      continue;
    }
    if (!r.state) continue;
    const cur = byState.get(r.state) ?? { state: 0, county: 0, city: 0 };
    if (r.scope === "state")  cur.state  += 1;
    if (r.scope === "county") cur.county += 1;
    if (r.scope === "city")   cur.city   += 1;
    byState.set(r.state, cur);
  }

  // Split states into populated (any programs) vs empty, alphabetical within each.
  const populated: { code: string; name: string; counts: StateCounts }[] = [];
  const emptyStates: { code: string; name: string; counts: StateCounts }[] = [];
  for (const s of STATES) {
    const counts = byState.get(s.code);
    if (counts && counts.state + counts.county + counts.city > 0) {
      populated.push({ code: s.code, name: s.name, counts });
    } else {
      emptyStates.push({ code: s.code, name: s.name, counts: { state: 0, county: 0, city: 0 } });
    }
  }

  return (
    <ProgramsLanding
      federalCount={federalCount}
      populated={populated}
      emptyStates={emptyStates}
    />
  );
}
