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
  states: string[] | null;
  slug: string | null;
  is_active: boolean;
  created_at: string;
};

export type QuizAnswers = {
  state: string;
  ageRange: string;
  income: string;
  situation: string[];
};

const STATE_ABBR: Record<string, string> = {
  "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA",
  "Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA",
  "Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA",
  "Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD",
  "Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS",
  "Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH",
  "New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC",
  "North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA",
  "Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN",
  "Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA",
  "West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY","Washington D.C.":"DC",
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
  const stateAbbr = STATE_ABBR[answers.state] ?? answers.state || null;
  const monthlyIncome = incomeToMonthlyDollars(answers.income);
  const age = ageRangeToNumber(answers.ageRange);

  console.log("[RPC] params →", { p_state: stateAbbr, p_monthly_income: monthlyIncome, p_age: age, p_situation: answers.situation });

  const { data, error } = await supabase.rpc("get_eligible_programs", {
    p_state:          stateAbbr,
    p_monthly_income: monthlyIncome,
    p_age:            age,
    p_situation:      answers.situation,
  });

  console.log("[RPC] result →", { count: data?.length, error: error?.message });

  if (!error) return data ?? [];

  // RPC unavailable (missing EXECUTE grant or missing column) — fall back to
  // a direct query so the results page always shows something.
  console.warn("[RPC] falling back to direct query:", error.message);
  const { data: fallback, error: fallbackError } = await supabase
    .from("programs")
    .select("*")
    .eq("is_active", true)
    .order("benefit_value", { ascending: false });

  if (fallbackError) throw new Error(fallbackError.message);
  return fallback ?? [];
}
