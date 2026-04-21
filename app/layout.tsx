import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://mypublicaid.org");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "MyPublicAid - Find Government Benefits & Assistance Programs You Qualify For",
    template: "%s | MyPublicAid",
  },
  description:
    "Free tool to find government assistance programs you qualify for. Find help with utilities, food, healthcare, housing and more. Takes 2 minutes. No signup required.",

  keywords: [
    "government assistance programs",
    "benefits I qualify for",
    "free government help",
    "senior benefits",
    "utility assistance programs",
    "food assistance",
    "healthcare assistance",
    "housing assistance",
    "low income benefits",
    "SNAP benefits",
    "Medicaid eligibility",
    "LIHEAP energy assistance",
    "government grants",
    "public assistance programs",
  ],

  alternates: {
    canonical: SITE_URL,
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "MyPublicAid",
    title: "MyPublicAid - Find Government Benefits & Assistance Programs You Qualify For",
    description:
      "Free tool to find government assistance programs you qualify for. Find help with utilities, food, healthcare, housing and more. Takes 2 minutes. No signup required.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MyPublicAid — Find Government Benefits & Assistance Programs",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MyPublicAid - Find Government Benefits & Assistance Programs You Qualify For",
    description:
      "Free tool to find government assistance programs you qualify for. Takes 2 minutes. No signup required.",
    images: ["/opengraph-image"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#f8faf9]">{children}</body>
    </html>
  );
}
