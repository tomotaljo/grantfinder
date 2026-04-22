"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function logout() {
  const store = await cookies();
  store.delete("admin_session");
  redirect("/admin/login");
}

function formToProgram(data: FormData) {
  const stateVal = data.get("state") as string;
  return {
    name:              data.get("name") as string,
    category:          data.get("category") as string,
    description:       data.get("description") as string,
    potential_benefit: data.get("potential_benefit") as string,
    who_qualifies:     data.get("who_qualifies") as string,
    phone_number:      data.get("phone_number") as string,
    apply_url:         data.get("apply_url") as string,
    benefit_value:     parseInt(data.get("benefit_value") as string, 10) || 0,
    is_active:         data.get("is_active") === "on",
    state:             stateVal === "federal" ? null : stateVal,
    important_notes:   (data.get("important_notes") as string) || null,
    eligibility_rules: {},
  };
}

export async function createProgram(_prev: unknown, data: FormData) {
  const { error } = await supabaseAdmin.from("programs").insert(formToProgram(data));
  if (error) return { error: error.message };
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateProgram(_prev: unknown, data: FormData) {
  const id = data.get("id") as string;
  const { error } = await supabaseAdmin
    .from("programs")
    .update(formToProgram(data))
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  redirect("/admin");
}

export async function toggleActive(id: string, active: boolean) {
  await supabaseAdmin.from("programs").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin");
}

export async function clearGuideCache(slug: string) {
  await supabaseAdmin.from("program_guides").delete().eq("program_slug", slug);
  revalidatePath("/admin");
}
