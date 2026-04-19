"use client";

import QuizCard from "../QuizCard";

const SIZES = ["1", "2", "3", "4", "5", "6", "7", "8+"];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4HouseholdSize({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuizCard
      title="How many people are in your household?"
      subtitle="Include yourself, your spouse or partner, and any dependents."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!value}
    >
      <div className="grid grid-cols-4 gap-3">
        {SIZES.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`aspect-square rounded-xl border-2 text-lg font-bold transition-all flex items-center justify-center
              ${value === s
                ? "border-[#1D9E75] bg-[#e6f7f1] text-[#1D9E75]"
                : "border-gray-200 text-gray-700 hover:border-[#1D9E75] hover:bg-[#f0fbf7]"
              }`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">Number of people</p>
    </QuizCard>
  );
}
