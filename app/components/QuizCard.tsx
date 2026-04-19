"use client";

interface QuizCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export default function QuizCard({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
}: QuizCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-gray-500 text-sm sm:text-base mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}

      <div className="mb-8">{children}</div>

      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 py-3 px-4 rounded-xl bg-[#1D9E75] text-white font-semibold hover:bg-[#157a5a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
