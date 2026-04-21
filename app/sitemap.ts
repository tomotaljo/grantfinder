import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mypublicaid.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: programs } = await supabase
    .from("programs")
    .select("slug, created_at")
    .eq("is_active", true)
    .not("slug", "is", null);

  const programUrls: MetadataRoute.Sitemap = (programs ?? [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${SITE_URL}/programs/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...programUrls,
  ];
}
