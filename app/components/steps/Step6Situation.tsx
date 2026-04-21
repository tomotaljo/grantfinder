"use client";

import QuizCard from "../QuizCard";

const OPTIONS = [
  { value: "unemployed", label: "I am currently unemployed or recently laid off" },
  { value: "veteran", label: "Veteran or active military" },
  { value: "disability", label: "Living with a disability" },
  { value: "pregnant", label: "Pregnant or recently gave birth" },
  { value: "student", label: "I am currently enrolled in college or vocational school" },
  { value: "single_parent", label: "Single parent" },
  { value: "senior", label: "Senior citizen (65+)" },
  { value: "homeless", label: "Experiencing housing instability" },
  { value: "rural", label: "Living in a rural area" },
  { value: "low_income", label: "Low income household" },
  { value: "caregiver", label: "I am a caregiver for an elderly or disabled family member" },
];

interface Props {
  values: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step6Situation({ values, onChange, onNext, onBack }: Props) {
  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  return (
    <QuizCard
      title="Which of these apply to your situation?"
      subtitle="Select all that apply. This helps us find targeted programs."
      onNext={onNext}
      onBack={onBack}
      nextLabel={values.length === 0 ? "None apply — Skip" : "Continue"}
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
