"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchZeroStateContactPool,
  stateCodeFromName,
  type Program,
  type QuizAnswers,
} from "@/lib/supabase";
import {
  buildZeroStateContacts,
  PROMINENT_CONTACT_COUNT,
  type ContactSlot,
} from "@/lib/contact-picker";

const FEEDBACK_EMAIL = "contact@mypublicaid.com";

interface Props {
  answers: QuizAnswers;
  onEditAnswers: () => void;
}

export default function ZeroResults({ answers, onEditAnswers }: Props) {
  const [pool, setPool] = useState<Program[] | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    fetchZeroStateContactPool(answers.state).then(setPool);
  }, [answers.state]);

  const stateCode = stateCodeFromName(answers.state);

  const contacts = useMemo<ContactSlot[]>(() => {
    if (!pool || !stateCode) return [];
    return buildZeroStateContacts(pool, stateCode);
  }, [pool, stateCode]);

  const prominent = contacts.slice(0, PROMINENT_CONTACT_COUNT);
  const additional = contacts.slice(PROMINENT_CONTACT_COUNT);

  const reportLink = buildReportMailto(answers);

  return (
    <div className="text-center">
      {/* TODO: replace with hand-picked Open Peeps SVG during the visual polish pass.
          Drop the file at public/illustrations/zero-state.svg and swap this block. */}
      <div className="mx-auto mb-6 w-32 h-32 rounded-full bg-[#e6f7f1] flex items-center justify-center">
        <svg className="w-16 h-16 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
        No exact matches in our catalog yet
      </h1>
      <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
        We&rsquo;re still building this — your situation
        {answers.state ? ` in ${answers.state}` : ""} doesn&rsquo;t line up with anything we&rsquo;ve
        vetted yet. That doesn&rsquo;t mean help isn&rsquo;t out there. It just means we
        haven&rsquo;t catalogued the right program for you yet.
      </p>

      {pool === null ? (
        <ContactsSkeleton />
      ) : contacts.length === 0 ? (
        <NoContactsFallback stateName={answers.state} />
      ) : (
        <>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">
            These contacts can point you in the right direction
          </p>

          <div className="flex flex-col gap-3 mb-4 text-left">
            {prominent.map((c) => (
              <ContactCard key={c.category} slot={c} />
            ))}
          </div>

          {additional.length > 0 && (
            <div className="text-left">
              {!showMore ? (
                <button
                  onClick={() => setShowMore(true)}
                  className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:text-[#1D9E75] hover:border-[#1D9E75] transition-colors"
                >
                  ▼ Show {additional.length} more contact{additional.length === 1 ? "" : "s"}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  {additional.map((c) => (
                    <ContactCard key={c.category} slot={c} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-10 pt-8 border-t border-gray-200">
        <p className="text-base font-semibold text-gray-700 mb-4">
          Did we get something wrong?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onEditAnswers}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-[#1D9E75] text-[#1D9E75] hover:bg-[#e6f7f1] font-semibold text-base transition-colors"
          >
            Edit your answers
          </button>
          <a
            href={reportLink}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-base transition-colors"
          >
            Report a missing program
          </a>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
        You&rsquo;re not the first person to land here, and the contacts above have helped
        a lot of people start.
      </p>
    </div>
  );
}

function ContactCard({ slot }: { slot: ContactSlot }) {
  const { program, category } = slot;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-[#1D9E75] bg-[#e6f7f1] px-2.5 py-1 rounded-full">
            {category}
          </span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{program.name}</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={`tel:${program.phone_number.replace(/[^0-9+]/g, "")}`}
          className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {program.phone_number}
        </a>
        <a
          href={program.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl border-2 border-[#1D9E75] text-[#1D9E75] hover:bg-[#e6f7f1] font-semibold text-sm transition-colors"
        >
          Visit website
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function ContactsSkeleton() {
  return (
    <div className="flex flex-col gap-3 mb-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded-full mb-3" />
          <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 bg-gray-100 rounded-xl" />
            <div className="h-10 flex-1 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoContactsFallback({ stateName }: { stateName: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-base text-gray-600">
      We don&rsquo;t have catalogued contacts for {stateName || "your state"} yet.
      Try <a href="https://www.benefits.gov" target="_blank" rel="noopener noreferrer"
              className="text-[#1D9E75] font-semibold underline">benefits.gov</a> or
      dial <a href="tel:211" className="text-[#1D9E75] font-semibold underline">211</a> for a
      live referral to local programs.
    </div>
  );
}

// Build a mailto: link with the user's quiz answers in the body so the
// recipient has full triage context.
function buildReportMailto(answers: QuizAnswers): string {
  const subject = `Missing program — ${answers.state || "unspecified state"}`;
  const lines = [
    "Hi,",
    "",
    "I couldn't find a matching program in MyPublicAid for my situation. Here's what I entered in the quiz:",
    "",
    `State: ${answers.state || "(not provided)"}`,
    `Age range: ${answers.ageRange || "(not provided)"}`,
    `Income range: ${answers.income || "(not provided)"}`,
    `Situation tags: ${(answers.situation ?? []).join(", ") || "(none)"}`,
    "",
    "What I was looking for:",
    "(briefly describe the program or kind of help you need)",
    "",
    "Thanks,",
  ];
  const body = lines.join("\n");
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
