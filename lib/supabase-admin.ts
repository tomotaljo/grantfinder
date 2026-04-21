import { createClient } from "@supabase/supabase-js";

// Uses the service role key so it bypasses RLS and can read/write all rows,
// including inactive programs. Never import this in client components.
// Get the service role key from: Supabase dashboard → Project Settings → API
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
