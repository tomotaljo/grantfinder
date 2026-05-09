"use client";

import { useState } from "react";
import Link from "next/link";

export interface StateCounts {
  state: number;
  county: number;
  city: number;
}

interface Props {
  code: string;        // 2-letter, e.g. "CA"
  name: string;        // "California"
  counts: StateCounts;
}

export default function StateRow({ code, name, counts }: Props) {
  const total = counts.state + counts.county + counts.city;
  const empty = total === 0;
  // Default: populated states open, empty states collapsed.
  const [expanded, setExpanded] = useState(!empty);
  const toggle = () => setExpanded((e) => !e);

  if (!expanded) {
    return (
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Chevron expanded={false} />
          <span className={`font-medium ${empty ? "text-sm text-gray-500" : "text-gray-900"}`}>
            {name}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {empty
            ? "no programs yet · click to add"
            : `${counts.state} state · ${counts.county} county · ${counts.city} city`}
        </span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 mb-3 text-left hover:opacity-80 transition-opacity"
      >
        <Chevron expanded={true} />
        <h2 className="font-semibold text-gray-900">{name}</h2>
      </button>
      <div className="grid grid-cols-3 gap-3">
        <ScopeCard code={code} scope="state"  count={counts.state}  label="State" />
        <ScopeCard code={code} scope="county" count={counts.county} label="County" />
        <ScopeCard code={code} scope="city"   count={counts.city}   label="City" />
      </div>
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ScopeCard({
  code, scope, count, label,
}: {
  code: string;
  scope: "state" | "county" | "city";
  count: number;
  label: string;
}) {
  return (
    <Link
      href={`/admin/programs/${code}/${scope}`}
      className="block bg-gray-50 hover:bg-[#e6f7f1] rounded-xl p-3 transition-colors text-center"
    >
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{count}</div>
    </Link>
  );
}
