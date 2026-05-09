import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { STATES } from "@/lib/states";
import StateRow, { type StateCounts } from "./StateRow";
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
  const populated: typeof STATES = [];
  const emptyStates: typeof STATES = [];
  for (const s of STATES) {
    const c = byState.get(s.code);
    if (c && c.state + c.county + c.city > 0) populated.push(s);
    else emptyStates.push(s);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse by state, or open the federal catalog at the top.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-2 bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Program
        </Link>
      </div>

      {/* Federal banner — always full width at top */}
      <Link
        href="/admin/programs/federal"
        className="block bg-white rounded-2xl border border-gray-200 hover:border-[#1D9E75] hover:shadow-sm transition p-5 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Federal</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Programs with uniform nationwide rules
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#1D9E75]">{federalCount}</div>
            <div className="text-xs text-gray-500">programs</div>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-3">
        {populated.map((s) => (
          <StateRow
            key={s.code}
            code={s.code}
            name={s.name}
            counts={byState.get(s.code) ?? { state: 0, county: 0, city: 0 }}
          />
        ))}

        {emptyStates.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
              States with no programs yet
            </h3>
            <div className="flex flex-col gap-1">
              {emptyStates.map((s) => (
                <StateRow
                  key={s.code}
                  code={s.code}
                  name={s.name}
                  counts={{ state: 0, county: 0, city: 0 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
