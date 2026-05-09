"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StateRow, { type StateCounts } from "./StateRow";

interface StateEntry {
  code: string;
  name: string;
  counts: StateCounts;
}

interface Props {
  federalCount: number;
  populated: StateEntry[];
  emptyStates: StateEntry[];
}

export default function ProgramsLanding(props: Props) {
  // useSearchParams suspends during prerender; wrap with Suspense per Next.js docs.
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
      <ProgramsLandingInner {...props} />
    </Suspense>
  );
}

function ProgramsLandingInner({ federalCount, populated, emptyStates }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL on mount. The initializer fn runs once; subsequent
  // renders use local state. Hard-refresh of /admin/programs (no param)
  // gives an empty Set → all collapsed.
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => {
    const param = searchParams.get("expanded");
    return new Set(param ? param.split(",").filter(Boolean) : []);
  });

  // Sync URL when expandedCodes changes. Skip the initial mount sync —
  // state already matches the URL (we initialized from it), so replacing
  // would be a no-op that just adds router noise.
  const skipNextSync = useRef(true);
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (expandedCodes.size === 0) {
      params.delete("expanded");
    } else {
      // Sort so toggling A then B produces the same URL as B then A.
      params.set("expanded", [...expandedCodes].sort().join(","));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedCodes]);

  const anyExpanded = expandedCodes.size > 0;

  const toggle = (code: string) =>
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });

  const collapseAll = () => setExpandedCodes(new Set());

  // Forwarded to scope cards as ?from=CA,TX,FL so the scope page's "← Programs"
  // link can rebuild the landing URL with the same set still expanded.
  const fromQuery = anyExpanded ? [...expandedCodes].sort().join(",") : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse by state, or open the federal catalog at the top.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {anyExpanded && (
            <button
              onClick={collapseAll}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse all
            </button>
          )}
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
      </div>

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
            counts={s.counts}
            expanded={expandedCodes.has(s.code)}
            onToggle={() => toggle(s.code)}
            fromQuery={fromQuery}
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
                  counts={s.counts}
                  expanded={expandedCodes.has(s.code)}
                  onToggle={() => toggle(s.code)}
                  fromQuery={fromQuery}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
