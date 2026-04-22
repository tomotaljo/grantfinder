"use client";

import { useEffect, useState } from "react";
import { fetchEligiblePrograms, type Program, type QuizAnswers } from "@/lib/supabase";

const SITE_NAME = "BenefitsFinder";
const TOP_PICKS_COUNT = 3;

// ─── helpers ────────────────────────────────────────────────────────────────

function groupByCategory(programs: Program[]): [string, Program[]][] {
  const map = new Map<string, Program[]>();
  for (const p of programs) {
    if (!map.has(p.category)) map.set(p.category, []);
    map.get(p.category)!.push(p);
  }
  return Array.from(map.entries());
}

// ─── sub-components ─────────────────────────────────────────────────────────

function PrintHeader({ state }: { state: string }) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  return (
    <div className="print-only hidden mb-6 pb-4" style={{ borderBottom: "2pt solid black" }}>
      <p style={{ fontSize: "11pt", marginBottom: "4pt", color: "black" }}>
        Benefits you may qualify for — found at <strong>{SITE_NAME}</strong>
        {state ? ` · ${state}` : ""}
      </p>
      <p style={{ fontSize: "10pt", color: "#555" }}>Generated: {date}</p>
    </div>
  );
}

function CategoryHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <span className="text-sm font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function ProgramCard({ prog, isTopPick = false }: { prog: Program; isTopPick?: boolean }) {
  return (
    <div className={`print-card bg-white rounded-2xl border shadow-sm overflow-hidden transition-all
      ${isTopPick ? "border-[#1D9E75]" : "border-gray-100"}`}>
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {isTopPick && (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Top Pick
              </span>
            )}
            <span className="text-sm font-semibold uppercase tracking-wide text-[#1D9E75] bg-[#e6f7f1] px-3 py-1 rounded-full">
              {prog.category}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{prog.name}</h3>
        <p className="text-gray-600 text-base leading-relaxed mb-5">{prog.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-[#f8faf9] rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Potential Benefit</p>
            <p className="text-base font-semibold text-gray-800">{prog.potential_benefit}</p>
          </div>
          <div className="bg-[#f8faf9] rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Who Qualifies</p>
            <p className="text-base font-semibold text-gray-800">{prog.who_qualifies}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 print:hidden">
          <a
            href={prog.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-base"
          >
            Apply Online
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href={`tel:${prog.phone_number.replace(/-/g, "")}`}
            className="inline-flex items-center justify-center gap-2 border-2 border-[#1D9E75] text-[#1D9E75] hover:bg-[#e6f7f1] font-semibold px-5 py-3 rounded-xl transition-colors text-base"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {prog.phone_number}
          </a>

          {prog.slug && (
            <a
              href={`/programs/${prog.slug}`}
              className="inline-flex items-center justify-center gap-2 border-2 border-[#1D9E75] text-[#1D9E75] hover:bg-[#e6f7f1] font-semibold px-5 py-3 rounded-xl transition-colors text-base"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Program Guide
            </a>
          )}
        </div>

        <div className="print-only hidden" style={{ marginTop: "0.4cm", fontSize: "12pt", lineHeight: "1.8" }}>
          <div><strong>Phone:</strong> {prog.phone_number}</div>
          <div><strong>Website:</strong> {prog.apply_url}</div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded-full mb-4" />
          <div className="h-6 w-3/4 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-full bg-gray-100 rounded mb-2" />
          <div className="h-4 w-5/6 bg-gray-100 rounded mb-5" />
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 flex-1 bg-gray-200 rounded-xl" />
            <div className="h-12 flex-1 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

// ─── email capture ───────────────────────────────────────────────────────────

function EmailCapture({ answers }: { answers: QuizAnswers }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Something went wrong.");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  // suppress unused-var warning — answers kept in props for potential future use
  void answers;

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-[#e6f7f1] border border-[#a8e6d0] p-6 text-center print:hidden">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1D9E75] mb-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-bold text-[#157a5a] mb-1">You're on the list!</p>
        <p className="text-base text-[#1D9E75]">
          We'll notify you when new programs are added that match your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 print:hidden">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#e6f7f1] flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug">Get notified about new programs</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            We'll let you know when new benefits programs are added that match your profile.
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent bg-white"
        />
        <button
          type="submit"
          disabled={!valid || status === "submitting"}
          className="px-6 py-3 rounded-xl bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {status === "submitting" ? "Saving…" : "Notify Me"}
        </button>
      </form>

      {status === "error" && (
        <p className="text-sm text-red-600 mt-2">{errorMsg}</p>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

interface ResultsProps {
  onRestart: () => void;
  answers: QuizAnswers;
}

export default function Results({ onRestart, answers }: ResultsProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("quiz-answers", JSON.stringify(answers));

    fetchEligiblePrograms(answers)
      .then((data) => {
        setPrograms(data);
        // Default to first category that has programs
        const cats = Array.from(new Set(data.slice(TOP_PICKS_COUNT).map((p) => p.category)));
        if (cats.length > 0) setActiveTab(cats[0]);
      })
      .catch(() => setError("Could not load programs. Please try again."))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const topPicks = programs.slice(0, Math.min(TOP_PICKS_COUNT, programs.length));
  const remaining = programs.slice(topPicks.length);
  const categories = Array.from(new Set(remaining.map((p) => p.category)));
  const tabPrograms = remaining.filter((p) => p.category === activeTab);

  const handlePrint = () => window.print();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PrintHeader state={answers.state} />

      {/* Page header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e6f7f1] mb-4">
          <svg className="w-8 h-8 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {loading
            ? "Finding programs for you…"
            : `You may qualify for ${programs.length} program${programs.length !== 1 ? "s" : ""}`}
        </h1>
        <p className="text-lg text-gray-500">
          Based on your answers{answers.state ? ` in ${answers.state}` : ""}. Review each program below and apply today.
        </p>
      </div>

      {/* Content */}
      <div className="mb-8">
        {loading && <LoadingSkeleton />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-base">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && programs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">No programs matched your answers.</p>
            <p className="text-base">Try adjusting your responses or contact your local benefits office.</p>
          </div>
        )}

        {!loading && !error && programs.length > 0 && (
          <div className="flex flex-col gap-3">

            {/* Top Picks */}
            <div className="flex items-center gap-3 mb-1">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Top Picks</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="flex flex-col gap-5 mb-6">
              {topPicks.map((prog) => (
                <ProgramCard key={prog.id} prog={prog} isTopPick />
              ))}
            </div>

            {/* Category tabs */}
            {categories.length > 0 && (
              <>
                <div
                  className="print:hidden"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingBottom: '0px',
                  }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors
                        ${activeTab === cat
                          ? "bg-[#1D9E75] border-[#1D9E75] text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75]"
                        }`}
                    >
                      {cat}
                      <span className={`ml-1.5 text-xs font-bold ${activeTab === cat ? "text-white/80" : "text-gray-400"}`}>
                        {remaining.filter((p) => p.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-5 mt-2">
                  {tabPrograms.map((prog) => (
                    <ProgramCard key={prog.id} prog={prog} />
                  ))}
                </div>

                {/* Print: show all categories */}
                <div className="hidden print:block">
                  {categories.map((cat) => (
                    <div key={cat}>
                      <CategoryHeading label={cat} />
                      <div className="flex flex-col gap-5 mb-4">
                        {remaining.filter((p) => p.category === cat).map((prog) => (
                          <ProgramCard key={prog.id} prog={prog} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        )}
      </div>

      {/* Email capture */}
      {!loading && !error && programs.length > 0 && (
        <div className="mb-6">
          <EmailCapture answers={answers} />
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-base text-amber-800">
        <strong>Disclaimer:</strong> These results are for informational purposes only. Eligibility is determined by each program individually. We recommend contacting your local benefits office to confirm your eligibility.
      </div>

      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <button
          onClick={handlePrint}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 text-base font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print this page
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-xl border-2 border-[#1D9E75] text-[#1D9E75] text-base font-semibold hover:bg-[#e6f7f1] transition-colors"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
