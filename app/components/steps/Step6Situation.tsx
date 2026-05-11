"use client";

import QuizCard from "../QuizCard";

const OPTIONS = [
  { value: "unemployed", label: "Unemployed or recently laid off" },
  { value: "veteran", label: "Veteran or active military" },
  { value: "disability", label: "Living with a disability" },
  { value: "pregnant", label: "Pregnant or recently gave birth" },
  { value: "student", label: "Enrolled in college or vocational school" },
  { value: "with_children", label: "Child under 18 in my household" },
  { value: "senior", label: "Senior citizen (65+)" },
  { value: "homeless", label: "Experiencing housing instability" },
  { value: "rural", label: "Living in a rural area" },
  { value: "low_income", label: "Low income household" },
  { value: "caregiver", label: "Caregiver for an elderly or disabled family member" },
];

interface Props {
  values: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  householdSize: string;
}

export default function Step6Situation({ values, onChange, onNext, onBack, householdSize }: Props) {
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
          // with_children is contradictory with HH=1. Render the option as
          // a real <button disabled> so it's visible in the grid (users see
          // the option exists and learn that children count toward household
          // size) but non-interactive. Opacity-reduced, keyboard-skipped via
          // disabled, screen-reader-announced as disabled.
          if (opt.value === "with_children" && householdSize === "1") {
            return (
              <button
                key={opt.value}
                type="button"
                disabled
                aria-disabled="true"
                className="flex items-start gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-left opacity-60 cursor-not-allowed"
              >
                <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 border-gray-300 bg-white mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-gray-700">
                    {opt.label}
                  </span>
                  <span className="text-xs leading-snug text-gray-500">
                    Update your household size to 2 or more to enable this option.
                  </span>
                </div>
              </button>
            );
          }

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
