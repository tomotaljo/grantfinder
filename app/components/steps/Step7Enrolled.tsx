"use client";

import QuizCard from "../QuizCard";

const OPTIONS = [
  { value: "medicaid", label: "Medicaid / CHIP" },
  { value: "snap", label: "SNAP (Food Stamps)" },
  { value: "wic", label: "WIC" },
  { value: "ssdi", label: "SSDI / SSI" },
  { value: "housing", label: "Section 8 / Housing Assistance" },
  { value: "tanf", label: "TANF (Cash Assistance)" },
  { value: "liheap", label: "LIHEAP (Energy Assistance)" },
  { value: "none", label: "None of the above" },
];

interface Props {
  values: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step7Enrolled({ values, onChange, onNext, onBack }: Props) {
  const toggle = (v: string) => {
    if (v === "none") {
      onChange(values.includes("none") ? [] : ["none"]);
      return;
    }
    const without = values.filter((x) => x !== "none");
    onChange(without.includes(v) ? without.filter((x) => x !== v) : [...without, v]);
  };

  return (
    <QuizCard
      title="What programs are you already enrolled in?"
      subtitle="This helps us avoid suggesting programs you already have."
      onNext={onNext}
      onBack={onBack}
      nextLabel="See my results"
      nextDisabled={values.length === 0}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const checked = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl border-2 text-left transition-all
                ${checked
                  ? "border-[#1D9E75] bg-[#e6f7f1]"
                  : "border-gray-200 hover:border-[#1D9E75] hover:bg-[#f0fbf7]"
                }`}
            >
              <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all
                ${checked ? "bg-[#1D9E75] border-[#1D9E75]" : "border-gray-300"}`}
              >
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-medium ${checked ? "text-[#1D9E75]" : "text-gray-700"}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </QuizCard>
  );
}
