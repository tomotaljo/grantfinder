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
      className="inline-flex items-center gap-2 border-2 border-[#1D9E75] text-[#1D9E75] bg-white hover:bg-[#e6f7f1] font-semibold px-4 py-2 rounded-xl transition-colors mb-6"
      style={{ fontSize: "15px" }}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
      Back to My Results
    </Link>
  );
}
