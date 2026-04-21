import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import ProgramForm from "../../../components/ProgramForm";
import { updateProgram } from "../../../actions";
import type { Program } from "@/lib/supabase";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProgramPage({ params }: Props) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("programs")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <ProgramForm
      action={updateProgram}
      program={data as Program}
      heading="Edit Program"
    />
  );
}
