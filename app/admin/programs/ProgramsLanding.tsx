"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import StateRow, { type StateCounts } from "./StateRow";

interface StateEntry {
  code: string;
  name: string;
  counts: StateCounts;
}

interface Props {
  federalCount: number;
  populated: StateEntry[];
  emptyStates: StateEntry[];  // counts will be all-zero, kept for type uniformity
}

export default function ProgramsLanding({ federalCount, populated, emptyStates }: Props) {
  // All rows start collapsed on every mount (no "default expanded for populated").
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => new Set());

  const anyExpanded = expandedCodes.size > 0;

  const toggle = (code: string) =>
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });

  const collapseAll = () => setExpandedCodes(new Set());

  // Memoized lookup avoids creating a new closure per render in the row loop
  const isExpanded = useMemo(
    () => (code: string) => expandedCodes.has(code),
    [expandedCodes]
  );

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
            counts={s.counts}
            expanded={isExpanded(s.code)}
            onToggle={() => toggle(s.code)}
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
                  expanded={isExpanded(s.code)}
                  onToggle={() => toggle(s.code)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
