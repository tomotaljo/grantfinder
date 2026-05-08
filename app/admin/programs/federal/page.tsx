import { supabaseAdmin } from "@/lib/supabase-admin";
import ProgramsTable from "../../components/ProgramsTable";
import type { Program } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function FederalProgramsPage() {
  const [{ data: programs }, { data: guides }] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select("*")
      .eq("scope", "federal")
      .order("benefit_value", { ascending: false }),
    supabaseAdmin.from("program_guides").select("program_slug, generated_at"),
  ]);

  return (
    <ProgramsTable
      scope="federal"
      state={null}
      programs={(programs ?? []) as Program[]}
      guides={(guides ?? []) as { program_slug: string; generated_at: string }[]}
    />
  );
}
