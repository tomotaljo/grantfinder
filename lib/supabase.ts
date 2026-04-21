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
  benefit_value: number;
  is_active: boolean;
  created_at: string;
};

export type QuizAnswers = {
  state: string;
  ageRange: string;
  income: string;
  situation: string[];
};

// Map quiz income range strings to an upper-bound monthly dollar value
function incomeToMonthlyDollars(range: string): number {
  const map: Record<string, number> = {
    "0_1000":    1000,
    "1001_2000": 2000,
    "2001_3000": 3000,
    "3001_4500": 4500,
    "4501_6000": 6000,
    "6001_plus": 999999,
  };
  return map[range] ?? 999999;
}

// Map quiz age range strings to a representative numeric age
function ageRangeToNumber(range: string): number {
  const map: Record<string, number> = {
    "under_18": 17,
    "18_24":    21,
    "25_34":    30,
    "35_49":    42,
    "50_64":    57,
    "65_plus":  70,
  };
  return map[range] ?? 30;
}

export async function fetchEligiblePrograms(answers: QuizAnswers): Promise<Program[]> {
  const { data, error } = await supabase.rpc("get_eligible_programs", {
    p_state:          answers.state || null,
    p_monthly_income: incomeToMonthlyDollars(answers.income),
    p_age:            ageRangeToNumber(answers.ageRange),
    p_situation:      answers.situation,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}
