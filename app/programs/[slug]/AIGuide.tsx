"use client";

import { useEffect, useRef, useState } from "react";

interface GuideContent {
  callScript: string;
  documents: string[];
  denialReasons: string[];
  afterApplying: string;
  ifDenied: string;
  proTips: string[];
}

interface AIGuideProps {
  slug: string;
  programName: string;
  description: string;
  whoQualifies: string;
  phoneNumber: string;
  applyUrl: string;
  potentialBenefit: string;
  category: string;
}

function Skeleton() {
  return (
    <div className="space-y-6 mt-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

const ICONS: Record<keyof GuideContent, string> = {
  callScript: "📞",
  documents: "📋",
  denialReasons: "⚠️",
  afterApplying: "⏳",
  ifDenied: "⚖️",
  proTips: "💡",
};

const TITLES: Record<keyof GuideContent, string> = {
  callScript: "What to Say When You Call",
  documents: "Documents to Gather",
  denialReasons: "Common Reasons Applications Get Denied",
  afterApplying: "What to Expect After You Apply",
  ifDenied: "If You Get Denied",
  proTips: "Pro Tips",
};

const SECTION_ORDER: (keyof GuideContent)[] = [
  "callScript",
  "documents",
  "denialReasons",
  "afterApplying",
  "ifDenied",
  "proTips",
];

function AccordionItem({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string | string[];
}) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1 font-semibold text-gray-900">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        ref={bodyRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? bodyRef.current?.scrollHeight : 0 }}
      >
        <div className="px-6 pb-5">
          {typeof value === "string" ? (
            <p className="text-gray-700 leading-relaxed">{value}</p>
          ) : (
            <ul className="space-y-2">
              {value.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#e6f7f1] text-[#1D9E75] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIGuide({
  slug,
  programName,
  description,
  whoQualifies,
  phoneNumber,
  applyUrl,
  potentialBenefit,
  category,
}: AIGuideProps) {
  const [content, setContent] = useState<GuideContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cacheKey = `ai-guide-v2-${slug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.callScript && parsed.documents) {
          setContent(parsed);
          setLoading(false);
          return;
        }
        localStorage.removeItem(cacheKey);
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    let fullText = "";
    setLoading(true);

    fetch("/api/programs/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programName,
        description,
        whoQualifies,
        phoneNumber,
        applyUrl,
        potentialBenefit,
        category,
      }),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) throw new Error("Stream failed");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
        }

        const jsonStart = fullText.indexOf("{");
        const jsonEnd = fullText.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
        const parsed: GuideContent = JSON.parse(fullText.slice(jsonStart, jsonEnd + 1));
        if (!parsed.callScript || !parsed.documents) throw new Error("Invalid guide structure");
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
        setContent(parsed);
      })
      .catch((err) => {
        console.error("AIGuide error:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [slug, programName, description, whoQualifies, phoneNumber, applyUrl, potentialBenefit, category]);

  if (loading) return <Skeleton />;
  if (error || !content) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h2 className="text-2xl font-bold text-gray-900">Your Complete Guide</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">AI-generated</span>
      </div>

      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        {SECTION_ORDER.map((key) => {
          const value = content[key];
          if (!value) return null;
          return <AccordionItem key={key} icon={ICONS[key]} title={TITLES[key]} value={value} />;
        })}
      </div>
    </div>
  );
}
