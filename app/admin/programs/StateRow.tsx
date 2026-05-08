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
  const [expanded, setExpanded] = useState(!empty);

  if (empty && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between px-4 py-2 text-left rounded-xl hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-500">{name}</span>
        <span className="text-xs text-gray-400">no programs yet · click to add</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">{name}</h2>
        {empty && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            collapse
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ScopeCard code={code} scope="state"  count={counts.state}  label="State" />
        <ScopeCard code={code} scope="county" count={counts.county} label="County" />
        <ScopeCard code={code} scope="city"   count={counts.city}   label="City" />
      </div>
    </div>
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
