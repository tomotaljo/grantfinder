"use client";

import QuizCard from "../QuizCard";

const RANGES = [
  { value: "0_1000", label: "$0 – $1,000" },
  { value: "1001_2000", label: "$1,001 – $2,000" },
  { value: "2001_3000", label: "$2,001 – $3,000" },
  { value: "3001_4500", label: "$3,001 – $4,500" },
  { value: "4501_6000", label: "$4,501 – $6,000" },
  { value: "6001_plus", label: "Over $6,000" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5Income({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuizCard
      title="What is your monthly household income?"
      subtitle="Include all sources: wages, benefits, child support, etc."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!value}
    >
      <div className="flex flex-col gap-3">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={`w-full text-left py-3 px-4 rounded-xl border-2 font-medium transition-all
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
