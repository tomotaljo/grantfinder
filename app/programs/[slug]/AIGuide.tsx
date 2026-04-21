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

type SectionKey = keyof GuideContent;

const LIST_SECTIONS = new Set<SectionKey>(["documents", "denialReasons", "proTips"]);

const SECTION_MARKERS: Record<string, SectionKey> = {
  "[callScript]":    "callScript",
  "[documents]":     "documents",
  "[denialReasons]": "denialReasons",
  "[afterApplying]": "afterApplying",
  "[ifDenied]":      "ifDenied",
  "[proTips]":       "proTips",
};

const SECTION_ORDER: SectionKey[] = [
  "callScript", "documents", "denialReasons", "afterApplying", "ifDenied", "proTips",
];

const ICONS: Record<SectionKey, string> = {
  callScript:    "📞",
  documents:     "📋",
  denialReasons: "⚠️",
  afterApplying: "⏳",
  ifDenied:      "⚖️",
  proTips:       "💡",
};

const TITLES: Record<SectionKey, string> = {
  callScript:    "What to Say When You Call",
  documents:     "Documents to Gather",
  denialReasons: "Common Reasons Applications Get Denied",
  afterApplying: "What to Expect After You Apply",
  ifDenied:      "If You Get Denied",
  proTips:       "Pro Tips",
};

function isValidGuide(g: Partial<GuideContent>): g is GuideContent {
  return !!(g.callScript && g.documents?.length);
}

function AccordionItem({
  sectionKey,
  value,
  isOpen,
  onToggle,
}: {
  sectionKey: SectionKey;
  value: string | string[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{ICONS[sectionKey]}</span>
        <span className="flex-1 font-semibold text-gray-900">{TITLES[sectionKey]}</span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        ref={bodyRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? (bodyRef.current?.scrollHeight ?? 1000) : 0 }}
      >
        <div className="px-6 pb-5">
          {LIST_SECTIONS.has(sectionKey) ? (
            <ul className="space-y-2">
              {(value as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#e6f7f1] text-[#1D9E75] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 leading-relaxed">{value as string}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h2 className="text-2xl font-bold text-gray-900">Your Complete Guide</h2>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center gap-4">
        <svg className="w-5 h-5 text-[#1D9E75] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-gray-500 text-sm">Generating your personalized guide…</p>
      </div>
    </div>
  );
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

export default function AIGuide(props: AIGuideProps) {
  const { slug, programName, description, whoQualifies, phoneNumber, applyUrl, potentialBenefit, category } = props;

  const [content, setContent] = useState<GuideContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set());

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  useEffect(() => {
    const lsKey = `ai-guide-v3-${slug}`;

    function streamGuide() {
      let buffer = "";
      let currentSection: SectionKey | null = null;
      const live: Partial<GuideContent> = {};

      fetch("/api/programs/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, programName, description, whoQualifies, phoneNumber, applyUrl, potentialBenefit, category }),
      })
        .then(async (res) => {
          if (!res.ok || !res.body) throw new Error("Stream failed");
          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const markerKey = SECTION_MARKERS[trimmed];
              if (markerKey) {
                currentSection = markerKey;
                live[markerKey] = LIST_SECTIONS.has(markerKey) ? ([] as never) : ("" as never);
              } else if (currentSection) {
                if (LIST_SECTIONS.has(currentSection)) {
                  const item = trimmed.replace(/^[•\-*]\s*/, "");
                  if (item) (live[currentSection] as string[]).push(item);
                } else {
                  const existing = (live as Record<string, string>)[currentSection];
                  (live as Record<string, string>)[currentSection] = existing ? existing + " " + trimmed : trimmed;
                }
              }
            }
          }

          // Flush remaining buffer
          if (currentSection && buffer.trim()) {
            const trimmed = buffer.trim();
            if (LIST_SECTIONS.has(currentSection)) {
              const item = trimmed.replace(/^[•\-*]\s*/, "");
              if (item) (live[currentSection] as string[]).push(item);
            } else {
              const existing = (live as Record<string, string>)[currentSection];
              (live as Record<string, string>)[currentSection] = existing ? existing + " " + trimmed : trimmed;
            }
          }

          if (isValidGuide(live)) {
            localStorage.setItem(lsKey, JSON.stringify(live));
            setContent(live as GuideContent);
          }
        })
        .catch(() => { /* silently hide on error */ })
        .finally(() => setLoading(false));
    }

    async function load() {
      // 1. localStorage
      const cached = localStorage.getItem(lsKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isValidGuide(parsed)) { setContent(parsed); setLoading(false); return; }
          localStorage.removeItem(lsKey);
        } catch { localStorage.removeItem(lsKey); }
      }

      // 2. Supabase DB cache
      try {
        const res = await fetch(`/api/programs/guide?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const { content: dbContent } = await res.json();
          if (isValidGuide(dbContent)) {
            localStorage.setItem(lsKey, JSON.stringify(dbContent));
            setContent(dbContent);
            setLoading(false);
            return;
          }
        }
      } catch { /* fall through */ }

      // 3. Generate via Claude
      streamGuide();
    }

    load();
  }, [slug, programName, description, whoQualifies, phoneNumber, applyUrl, potentialBenefit, category]);

  if (loading) return <LoadingIndicator />;
  if (!content) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h2 className="text-2xl font-bold text-gray-900">Your Complete Guide</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">AI-generated</span>
      </div>

      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        {SECTION_ORDER.map((key) => (
          <AccordionItem
            key={key}
            sectionKey={key}
            value={content[key]}
            isOpen={openSections.has(key)}
            onToggle={() => toggleSection(key)}
          />
        ))}
      </div>
    </div>
  );
}
