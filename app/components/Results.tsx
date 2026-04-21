"use client";

import { useEffect, useState } from "react";
import { fetchEligiblePrograms, type Program, type QuizAnswers } from "@/lib/supabase";

const SITE_NAME = "BenefitsFinder";

interface ResultsProps {
  onRestart: () => void;
  answers: QuizAnswers;
}

function PrintHeader({ state }: { state: string }) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
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

function ProgramCard({ prog }: { prog: Program }) {
  return (
    <div className="print-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-[#1D9E75] bg-[#e6f7f1] px-3 py-1 rounded-full">
              {prog.category}
            </span>
            <h3 className="text-xl font-bold text-gray-900 mt-3 leading-snug">{prog.name}</h3>
          </div>
        </div>

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

        {/* CTA buttons — screen only */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
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
        </div>

        {/* Print-only contact block */}
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

export default function Results({ onRestart, answers }: ResultsProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEligiblePrograms(answers)
      .then(setPrograms)
      .catch(() => setError("Could not load programs. Please try again."))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = () => window.print();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PrintHeader state={answers.state} />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e6f7f1] mb-4">
          <svg className="w-8 h-8 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {loading ? "Finding programs for you…" : `You may qualify for ${programs.length} program${programs.length !== 1 ? "s" : ""}`}
        </h1>
        <p className="text-lg text-gray-500">
          Based on your answers{answers.state ? ` in ${answers.state}` : ""}. Review each program below and apply today.
        </p>
      </div>

      {/* Program cards */}
      <div className="mb-8">
        {loading && <LoadingSkeleton />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-base">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-5">
            {programs.map((prog) => (
              <ProgramCard key={prog.id} prog={prog} />
            ))}
          </div>
        )}
      </div>

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
