"use client";

import QuizCard from "../QuizCard";

const OPTIONS = [
  { value: "myself", label: "Myself", icon: "🙋" },
  { value: "myself_family", label: "Myself & my family", icon: "👨‍👩‍👧" },
  { value: "someone_else", label: "Someone else", icon: "🤝" },
  { value: "my_business", label: "My small business", icon: "🏢" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2ApplyingFor({ value, onChange, onNext, onBack }: Props) {
  return (
    <QuizCard
      title="Who are you applying for?"
      subtitle="Select the option that best describes your situation."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!value}
    >
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-center
              ${value === opt.value
                ? "border-[#1D9E75] bg-[#e6f7f1] text-[#1D9E75]"
                : "border-gray-200 text-gray-700 hover:border-[#1D9E75] hover:bg-[#f0fbf7]"
              }`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <span className="text-sm font-medium leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </QuizCard>
  );
}
