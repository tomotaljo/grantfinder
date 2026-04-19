"use client";

const SITE_NAME = "BenefitsFinder";

interface Program {
  name: string;
  category: string;
  description: string;
  benefit: string;
  eligibility: string;
  ctaLabel: string;
  ctaUrl: string;
  phone: string;
  tag: string;
}

const PROGRAMS: Program[] = [
  {
    name: "Supplemental Nutrition Assistance Program (SNAP)",
    category: "Food Assistance",
    description:
      "SNAP provides monthly benefits on an EBT card that can be used to buy food at most grocery stores and farmers markets.",
    benefit: "Up to $973/month for a family of 4",
    eligibility: "Households with gross income at or below 130% of the federal poverty level",
    ctaLabel: "Apply at Benefits.gov",
    ctaUrl: "https://www.benefits.gov/benefit/361",
    phone: "1-800-221-5689",
    tag: "Federal Program",
  },
  {
    name: "Low Income Home Energy Assistance Program (LIHEAP)",
    category: "Utility Assistance",
    description:
      "LIHEAP helps low-income households pay for heating and cooling costs, energy crises, and home weatherization.",
    benefit: "Average $500–$1,000 per year toward energy bills",
    eligibility: "Households at or below 150% of the federal poverty level",
    ctaLabel: "Find your local agency",
    ctaUrl: "https://www.benefits.gov/benefit/623",
    phone: "1-866-674-6327",
    tag: "Federal Program",
  },
  {
    name: "Medicaid Health Coverage",
    category: "Health Insurance",
    description:
      "Medicaid provides free or low-cost health coverage including doctor visits, hospital care, prescriptions, mental health services, and more.",
    benefit: "Full health coverage at little to no cost",
    eligibility: "Low-income adults, children, pregnant women, elderly, and people with disabilities",
    ctaLabel: "Check eligibility at Healthcare.gov",
    ctaUrl: "https://www.healthcare.gov/medicaid-chip/",
    phone: "1-800-318-2596",
    tag: "Federal + State Program",
  },
];

interface ResultsProps {
  onRestart: () => void;
  state: string;
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

export default function Results({ onRestart, state }: ResultsProps) {
  const handlePrint = () => window.print();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PrintHeader state={state} />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e6f7f1] mb-4">
          <svg className="w-8 h-8 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          You may qualify for {PROGRAMS.length} programs
        </h1>
        <p className="text-lg text-gray-500">
          Based on your answers{state ? ` in ${state}` : ""}. Review each program below and apply today.
        </p>
      </div>

      {/* Program cards */}
      <div className="flex flex-col gap-5 mb-8">
        {PROGRAMS.map((prog, i) => (
          <div key={i} className="print-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-[#1D9E75] bg-[#e6f7f1] px-3 py-1 rounded-full">
                    {prog.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-3 leading-snug">{prog.name}</h3>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded-lg">
                  {prog.tag}
                </span>
              </div>

              <p className="text-gray-600 text-base leading-relaxed mb-5">{prog.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="bg-[#f8faf9] rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Potential Benefit</p>
                  <p className="text-base font-semibold text-gray-800">{prog.benefit}</p>
                </div>
                <div className="bg-[#f8faf9] rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Who Qualifies</p>
                  <p className="text-base font-semibold text-gray-800">{prog.eligibility}</p>
                </div>
              </div>

              {/* CTA buttons — screen only */}
              <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                <a
                  href={prog.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold px-5 py-3 rounded-xl transition-colors text-base"
                >
                  {prog.ctaLabel}
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <a
                  href={`tel:${prog.phone.replace(/-/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#1D9E75] text-[#1D9E75] hover:bg-[#e6f7f1] font-semibold px-5 py-3 rounded-xl transition-colors text-base"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {prog.phone}
                </a>
              </div>

              {/* Print-only contact block */}
              <div className="print-only hidden" style={{ marginTop: "0.4cm", fontSize: "12pt", lineHeight: "1.8" }}>
                <div><strong>Phone:</strong> {prog.phone}</div>
                <div><strong>Website:</strong> {prog.ctaUrl}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-base text-amber-800">
        <strong>Disclaimer:</strong> These results are for informational purposes only. Eligibility is determined by each program individually. We recommend contacting your local benefits office to confirm your eligibility.
      </div>

      <div className="flex flex-col sm:flex-row gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 text-base font-semibold hover:bg-gray-50 transition-colors"
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
