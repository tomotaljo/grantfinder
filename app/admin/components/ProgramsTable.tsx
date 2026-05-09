"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toggleActive, clearGuideCache } from "../actions";
import type { Program, Scope } from "@/lib/supabase";
import { STATE_NAME_BY_CODE } from "@/lib/states";

const SCOPE_LABEL: Record<Scope, string> = {
  federal: "Federal",
  state: "State",
  county: "County",
  city: "City",
};

const STATUS_OPTIONS = [
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all",      label: "All" },
];

const CACHE_OPTIONS = [
  { value: "all",      label: "All" },
  { value: "cached",   label: "Cached" },
  { value: "uncached", label: "Uncached" },
];

const DEFAULTS = { q: "", category: "", status: "active", cache: "all", jurisdiction: "" } as const;
type FilterKey = keyof typeof DEFAULTS;

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${active ? "bg-[#e6f7f1] text-[#157a5a]" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

interface Props {
  scope: Scope;
  state: string | null;  // 2-letter state code, or null for federal
  programs: Program[];
  guides: { program_slug: string; generated_at: string }[];
}

export default function ProgramsTable(props: Props) {
  // useSearchParams suspends during prerender; wrap with Suspense per Next.js docs.
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
      <ProgramsTableInner {...props} />
    </Suspense>
  );
}

function ProgramsTableInner({ scope, state, programs, guides }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qParam            = searchParams.get("q")            ?? DEFAULTS.q;
  const categoryParam     = searchParams.get("category")     ?? DEFAULTS.category;
  const statusParam       = searchParams.get("status")       ?? DEFAULTS.status;
  const cacheParam        = searchParams.get("cache")        ?? DEFAULTS.cache;
  const jurisdictionParam = searchParams.get("jurisdiction") ?? DEFAULTS.jurisdiction;

  // Debounce text input — selects update URL immediately.
  const [qLocal, setQLocal] = useState(qParam);
  useEffect(() => setQLocal(qParam), [qParam]);
  useEffect(() => {
    if (qLocal === qParam) return;
    const id = setTimeout(() => setParam("q", qLocal), 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qLocal]);

  function setParam(key: FilterKey, value: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === DEFAULTS[key] || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const cachedSet = useMemo(
    () => new Map(guides.map((g) => [g.program_slug, g.generated_at])),
    [guides]
  );

  const categories = useMemo(
    () => Array.from(new Set(programs.map((p) => p.category))).sort(),
    [programs]
  );

  const showJurisdictionFilter = scope === "county" || scope === "city";

  const jurisdictions = useMemo(() => {
    if (!showJurisdictionFilter) return [];
    return Array.from(
      new Set(programs.map((p) => p.jurisdiction_name).filter((j): j is string => !!j))
    ).sort();
  }, [programs, showJurisdictionFilter]);

  const filtered = useMemo(() => {
    const q = qParam.trim().toLowerCase();
    return programs.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (categoryParam && p.category !== categoryParam) return false;
      if (statusParam === "active"   && !p.is_active) return false;
      if (statusParam === "inactive" &&  p.is_active) return false;
      if (cacheParam !== "all") {
        const isCached = !!(p.slug && cachedSet.has(p.slug));
        if (cacheParam === "cached"   && !isCached) return false;
        if (cacheParam === "uncached" &&  isCached) return false;
      }
      if (jurisdictionParam && p.jurisdiction_name !== jurisdictionParam) return false;
      return true;
    });
  }, [programs, qParam, categoryParam, statusParam, cacheParam, jurisdictionParam, cachedSet]);

  const filterControl =
    "px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent bg-white";

  const hasNonDefaultFilters =
    qParam !== DEFAULTS.q ||
    categoryParam !== DEFAULTS.category ||
    statusParam !== DEFAULTS.status ||
    cacheParam !== DEFAULTS.cache ||
    jurisdictionParam !== DEFAULTS.jurisdiction;

  function clearAllFilters() {
    router.replace(pathname, { scroll: false });
  }

  // Round-trip the landing-page expanded set: the scope card on the landing
  // forwards `?from=CA,TX,FL`; we read it here and rebuild the landing URL
  // so "← Programs" returns the user to the same expanded set they came from.
  const fromParam = searchParams.get("from") ?? "";
  const backHref = fromParam
    ? `/admin/programs?expanded=${encodeURIComponent(fromParam)}`
    : "/admin/programs";

  const heading =
    scope === "federal"
      ? "Federal"
      : `${state ? STATE_NAME_BY_CODE[state] ?? state : ""} · ${SCOPE_LABEL[scope]}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link href={backHref} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Programs
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
      </div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {filtered.length} of {programs.length} {programs.length === 1 ? "program" : "programs"}
          {hasNonDefaultFilters && (
            <>
              {" "}·{" "}
              <button
                onClick={clearAllFilters}
                className="text-[#1D9E75] hover:text-[#157a5a] font-medium"
              >
                Clear filters
              </button>
            </>
          )}
        </p>
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

      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search name</label>
          <input
            type="search"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            placeholder="Type to filter…"
            className={`${filterControl} w-full`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            value={categoryParam}
            onChange={(e) => setParam("category", e.target.value)}
            className={filterControl}
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusParam}
            onChange={(e) => setParam("status", e.target.value)}
            className={filterControl}
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">AI Cache</label>
          <select
            value={cacheParam}
            onChange={(e) => setParam("cache", e.target.value)}
            className={filterControl}
          >
            {CACHE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {showJurisdictionFilter && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {scope === "county" ? "County" : "City"}
            </label>
            <select
              value={jurisdictionParam}
              onChange={(e) => setParam("jurisdiction", e.target.value)}
              className={filterControl}
            >
              <option value="">All</option>
              {jurisdictions.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                {scope === "federal" ? null : (
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    {showJurisdictionFilter ? (scope === "county" ? "County" : "City") : "State"}
                  </th>
                )}
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Benefit Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">AI Cache</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Edit</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Change Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Clear Cache</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((prog) => (
                <tr
                  key={prog.id}
                  className={prog.is_active ? "hover:bg-gray-50" : "opacity-50 hover:bg-gray-50"}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                    {prog.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{prog.category}</td>
                  {scope === "federal" ? null : (
                    <td className="px-4 py-3 text-gray-600">
                      {showJurisdictionFilter
                        ? (prog.jurisdiction_name ?? "—")
                        : (prog.state ?? "—")}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-gray-700 font-mono">
                    ${prog.benefit_value.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={prog.is_active} />
                  </td>
                  <td className="px-4 py-3">
                    {prog.slug && cachedSet.has(prog.slug) ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-[#157a5a] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] inline-block" />
                          Cached
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(cachedSet.get(prog.slug)!).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center min-w-[80px]">
                    <Link
                      href={`/admin/programs/edit/${prog.id}`}
                      className="text-xs font-medium text-[#1D9E75] hover:text-[#157a5a] px-3 py-1.5 rounded-lg border border-[#1D9E75] hover:bg-[#e6f7f1] transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center min-w-[110px]">
                    <form action={toggleActive.bind(null, prog.id, !prog.is_active)}>
                      <button
                        type="submit"
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                          ${prog.is_active
                            ? "text-gray-500 border-gray-200 hover:bg-gray-100"
                            : "text-[#1D9E75] border-[#1D9E75] hover:bg-[#e6f7f1]"
                          }`}
                      >
                        {prog.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-center min-w-[110px]">
                    {prog.slug && cachedSet.has(prog.slug) ? (
                      <form action={clearGuideCache.bind(null, prog.slug)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-orange-500 border-orange-200 hover:bg-orange-50 px-3 py-1.5 rounded-lg border transition-colors"
                        >
                          Clear Cache
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="No cache to clear"
                        className="text-xs font-medium text-gray-300 border-gray-100 px-3 py-1.5 rounded-lg border cursor-not-allowed opacity-50"
                      >
                        Clear Cache
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={scope === "federal" ? 8 : 9} className="px-4 py-12 text-center text-gray-400">
                    {programs.length === 0
                      ? "No programs in this scope yet. Add one above."
                      : "No programs match the current filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
