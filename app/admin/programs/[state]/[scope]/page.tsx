import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import ProgramsTable from "../../../components/ProgramsTable";
import type { Program, Scope } from "@/lib/supabase";
import { STATE_CODES } from "@/lib/states";

export const dynamic = "force-dynamic";

const VALID_NON_FEDERAL_SCOPES: Scope[] = ["state", "county", "city"];

interface Props {
  params: Promise<{ state: string; scope: string }>;
}

export default async function StateScopedProgramsPage({ params }: Props) {
  const { state, scope } = await params;

  // Federal lives at /admin/programs/federal — reject it here so a stray
  // /admin/programs/federal/anything URL 404s instead of falling through.
  if (!STATE_CODES.has(state)) notFound();
  if (!VALID_NON_FEDERAL_SCOPES.includes(scope as Scope)) notFound();

  const [{ data: programs }, { data: guides }] = await Promise.all([
    supabaseAdmin
      .from("programs")
      .select("*")
      .eq("scope", scope)
      .eq("state", state)
      .order("benefit_value", { ascending: false }),
    supabaseAdmin.from("program_guides").select("program_slug, generated_at"),
  ]);

  return (
    <ProgramsTable
      scope={scope as Scope}
      state={state}
      programs={(programs ?? []) as Program[]}
      guides={(guides ?? []) as { program_slug: string; generated_at: string }[]}
    />
  );
}
