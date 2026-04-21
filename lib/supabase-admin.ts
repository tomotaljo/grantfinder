import { createClient } from "@supabase/supabase-js";

// Uses the service role key so it bypasses RLS and can read/write all rows,
// including inactive programs. Never import this in client components.
// Get the service role key from: Supabase dashboard → Project Settings → API
// Fallback strings prevent module-level crash when env vars are absent at
// build time. Admin pages are force-dynamic so real values are always
// present at request time on Vercel.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL    || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY   || "placeholder-service-key",
  { auth: { persistSession: false } }
);
