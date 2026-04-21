"use client";

import { useState } from "react";
import ProgressBar from "./ProgressBar";
import Step1State from "./steps/Step1State";
import Step2ApplyingFor from "./steps/Step2ApplyingFor";
import Step3AgeRange from "./steps/Step3AgeRange";
import Step4HouseholdSize from "./steps/Step4HouseholdSize";
import Step5Income from "./steps/Step5Income";
import Step6Situation from "./steps/Step6Situation";
import Step7Enrolled from "./steps/Step7Enrolled";
import Results from "./Results";
import type { QuizAnswers } from "@/lib/supabase";

const TOTAL_STEPS = 7;

interface Answers extends QuizAnswers {
  applyingFor: string;
  householdSize: string;
  enrolled: string[];
}

const DEFAULT: Answers = {
  state: "",
  applyingFor: "",
  ageRange: "",
  householdSize: "",
  income: "",
  situation: [],
  enrolled: [],
};

export default function Quiz() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Answers>(DEFAULT);

  const next = () => {
    if (step === TOTAL_STEPS) { setDone(true); return; }
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => s - 1);
  const restart = () => { setStep(1); setDone(false); setAnswers(DEFAULT); };

  const set = <K extends keyof Answers>(key: K) =>
    (val: Answers[K]) => setAnswers((a) => ({ ...a, [key]: val }));

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
          <Results onRestart={restart} answers={answers} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6">
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>

        {step === 1 && (
          <Step1State value={answers.state} onChange={set("state")} onNext={next} />
        )}
        {step === 2 && (
          <Step2ApplyingFor value={answers.applyingFor} onChange={set("applyingFor")} onNext={next} onBack={back} />
        )}
        {step === 3 && (
          <Step3AgeRange value={answers.ageRange} onChange={set("ageRange")} onNext={next} onBack={back} />
        )}
        {step === 4 && (
          <Step4HouseholdSize value={answers.householdSize} onChange={set("householdSize")} onNext={next} onBack={back} />
        )}
        {step === 5 && (
          <Step5Income value={answers.income} onChange={set("income")} onNext={next} onBack={back} />
        )}
        {step === 6 && (
          <Step6Situation values={answers.situation} onChange={set("situation")} onNext={next} onBack={back} />
        )}
        {step === 7 && (
          <Step7Enrolled values={answers.enrolled} onChange={set("enrolled")} onNext={next} onBack={back} />
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="w-full border-b border-gray-100 bg-white">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-lg">BenefitsFinder</span>
      </div>
    </header>
  );
}
