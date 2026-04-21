import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Program = {
  id: string;
  name: string;
  category: string;
  description: string;
  potential_benefit: string;
  who_qualifies: string;
  phone_number: string;
  apply_url: string;
  eligibility_rules: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};
