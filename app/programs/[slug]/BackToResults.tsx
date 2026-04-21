"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BackToResults() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("quiz-answers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.state !== undefined) setShow(true);
      }
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/?resume=1"
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1D9E75] transition-colors mb-2"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to My Results
    </Link>
  );
}
