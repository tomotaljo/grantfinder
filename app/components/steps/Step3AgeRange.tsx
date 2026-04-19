"use client";

import QuizCard from "../QuizCard";

const RANGES = [
  { value: "under_18", label: "Under 18" },
  { value: "18_24", label: "18 – 24" },
  { value: "25_34", label: "25 – 34" },
  { value: "35_49", label: "35 – 49" },
  { value: "50_64", label: "50 – 64" },
  { value: "65_plus", label: "65 or older" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3AgeRange({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuizCard
      title="What is your age range?"
      subtitle="Some programs have age-based eligibility requirements."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!value}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={`py-3 px-4 rounded-xl border-2 font-medium transition-all
              ${value === r.value
                ? "border-[#1D9E75] bg-[#e6f7f1] text-[#1D9E75]"
                : "border-gray-200 text-gray-700 hover:border-[#1D9E75] hover:bg-[#f0fbf7]"
              }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </QuizCard>
  );
}
