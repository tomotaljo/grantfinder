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

// Build a fresh empty draft
function emptyDraft(): Partial<GuideContent> {
  return {};
}

function AccordionItem({
  sectionKey,
  value,
  streamingLine,
  isStreaming,
  isOpen,
  onToggle,
}: {
  sectionKey: SectionKey;
  value: string | string[] | undefined;
  streamingLine: string;
  isStreaming: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const hasContent = Array.isArray(value) ? value.length > 0 : !!value;
  const showCursor = isStreaming;

  return (
    <div className="bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{ICONS[sectionKey]}</span>
        <span className="flex-1 font-semibold text-gray-900">{TITLES[sectionKey]}</span>
        {isStreaming && (
          <span className="text-xs text-[#1D9E75] font-medium animate-pulse mr-2">generating…</span>
        )}
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
              {(value as string[] | undefined ?? []).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#e6f7f1] text-[#1D9E75] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
              {isStreaming && streamingLine && (
                <li className="flex items-start gap-2 text-gray-400 italic">
                  <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center">
                    {(value as string[] | undefined ?? []).length + 1}
                  </span>
                  {streamingLine}<span className="animate-pulse">▌</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-gray-700 leading-relaxed">
              {(value as string | undefined) ?? ""}
              {isStreaming && streamingLine && (
                <span className="text-gray-400"> {streamingLine}<span className="animate-pulse">▌</span></span>
              )}
              {isStreaming && !streamingLine && hasContent && (
                <span className="animate-pulse">▌</span>
              )}
            </p>
          )}
        </div>
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
  const [draft, setDraft] = useState<Partial<GuideContent>>(emptyDraft());
  const [streamingSection, setStreamingSection] = useState<SectionKey | null>(null);
  const [streamingLine, setStreamingLine] = useState("");
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set());
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

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
            const { done: streamDone, value } = await reader.read();
            if (streamDone) break;

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
                setStreamingSection(markerKey);
                setStreamingLine("");
                setOpenSections((prev) => new Set([...prev, markerKey]));
              } else if (currentSection) {
                if (LIST_SECTIONS.has(currentSection)) {
                  const item = trimmed.replace(/^[•\-*]\s*/, "");
                  if (item) (live[currentSection] as string[]).push(item);
                } else {
                  const existing = (live as Record<string, string>)[currentSection];
                  (live as Record<string, string>)[currentSection] = existing ? existing + " " + trimmed : trimmed;
                }
                setStreamingLine("");
                setDraft({ ...live });
              }
            }
            if (currentSection && buffer.trim()) {
              setStreamingLine(buffer.trim().replace(/^[•\-*]\s*/, ""));
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
            setDraft({ ...live });
          }

          if (isValidGuide(live)) {
            localStorage.setItem(lsKey, JSON.stringify(live));
            setContent(live as GuideContent);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => { setStreamingSection(null); setStreamingLine(""); setDone(true); });
    }

    async function load() {
      // 1. localStorage
      const cached = localStorage.getItem(lsKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (isValidGuide(parsed)) { setContent(parsed); setDone(true); return; }
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
            setDone(true);
            return;
          }
        }
      } catch { /* fall through */ }

      // 3. Generate via Claude
      streamGuide();
    }

    load();
  }, [slug, programName, description, whoQualifies, phoneNumber, applyUrl, potentialBenefit, category]);

  if (error) return null;

  const display = content ?? draft;
  const hasAnyContent = SECTION_ORDER.some((k) => {
    const v = display[k];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });

  if (!hasAnyContent && done) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h2 className="text-2xl font-bold text-gray-900">Your Complete Guide</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">AI-generated</span>
      </div>

      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        {SECTION_ORDER.map((key) => {
          const value = display[key];
          const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
          const isStreaming = streamingSection === key;
          if (!hasValue && !isStreaming) return null;

          return (
            <AccordionItem
              key={key}
              sectionKey={key}
              value={value}
              streamingLine={isStreaming ? streamingLine : ""}
              isStreaming={isStreaming}
              isOpen={openSections.has(key)}
              onToggle={() => toggleSection(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
