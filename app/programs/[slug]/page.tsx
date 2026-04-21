import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import type { Program } from "@/lib/supabase";
import AIGuide from "./AIGuide";
import BackToResults from "./BackToResults";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypublicaid.org";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProgram(slug: string): Promise<Program | null> {
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data ?? null;
}

// Pre-generate pages for all active programs at build time
export async function generateStaticParams() {
  const { data } = await supabase
    .from("programs")
    .select("slug")
    .eq("is_active", true)
    .not("slug", "is", null);
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgram(slug);

  if (!program) return { title: "Program Not Found" };

  const title = `${program.name} — How to Apply & Who Qualifies`;
  const description =
    `${program.description} Potential benefit: ${program.potential_benefit}. ` +
    `Find out if you qualify and how to apply for free government assistance.`;
  const url = `${SITE_URL}/programs/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: program.name,
    description: program.description,
    serviceType: program.category,
    provider: { "@type": "GovernmentOrganization", name: "U.S. Government" },
    telephone: program.phone_number,
    url: program.apply_url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#f8faf9]">
        {/* Header */}
        <header className="w-full border-b border-gray-100 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">MyPublicAid</span>
            </Link>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <BackToResults />

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-[#1D9E75]">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-600">{program.name}</span>
          </nav>

          {/* Category badge */}
          <span className="inline-block text-sm font-semibold uppercase tracking-wide text-[#1D9E75] bg-[#e6f7f1] px-3 py-1 rounded-full mb-4">
            {program.category}
          </span>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {program.name}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">{program.description}</p>

          {/* Key facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Potential Benefit</p>
              <p className="text-lg font-bold text-gray-900">{program.potential_benefit}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Who Qualifies</p>
              <p className="text-base font-semibold text-gray-800">{program.who_qualifies}</p>
            </div>
          </div>

          {/* How to apply */}
          <div style={{textAlign: 'center', padding: '1rem'}}>
            <h3 style={{marginBottom: '1rem', fontWeight: '600'}}>
              How to Apply
            </h3>
            <div style={{display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '12px', maxWidth: '300px',
              margin: '0 auto'}}>
              <a href={program.apply_url} target="_blank"
                style={{display: 'block', width: '100%',
                padding: '12px 24px', backgroundColor: '#1D9E75',
                color: 'white', borderRadius: '8px',
                textAlign: 'center', textDecoration: 'none',
                fontWeight: '500'}}>
                Apply Online ↗
              </a>
              <a href={`tel:${program.phone_number}`}
                style={{display: 'block', width: '100%',
                padding: '12px 24px', border: '2px solid #1D9E75',
                color: '#1D9E75', borderRadius: '8px',
                textAlign: 'center', textDecoration: 'none',
                fontWeight: '500'}}>
                📞 {program.phone_number}
              </a>
            </div>
          </div>

          {/* AI Guide */}
          <AIGuide
            slug={slug}
            programName={program.name}
            description={program.description}
            whoQualifies={program.who_qualifies}
            phoneNumber={program.phone_number}
            applyUrl={program.apply_url}
            potentialBenefit={program.potential_benefit}
            category={program.category}
          />

          {/* CTA to quiz */}
          <div className="mt-10 bg-[#e6f7f1] border border-[#a8e6d0] rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Not sure if you qualify?
            </h2>
            <p className="text-gray-600 mb-4">
              Answer 7 quick questions and we'll show you every government program you're eligible for — including {program.name.split(" ").slice(0, 3).join(" ")} and more.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Check My Eligibility — Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="mt-4">
              <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Start Over
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
