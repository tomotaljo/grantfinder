"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Scope } from "@/lib/supabase";

export async function logout() {
  const store = await cookies();
  store.delete("admin_session");
  redirect("/admin/login");
}

function formToProgram(data: FormData) {
  const scope = data.get("scope") as Scope;
  const stateVal = (data.get("state") as string) || "";
  const jurisdictionVal = ((data.get("jurisdiction_name") as string) || "").trim();
  const isLocal = scope === "county" || scope === "city";
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
    scope,
    // Federal must have null state; everything else needs a 2-letter code.
    state:             scope === "federal" ? null : stateVal || null,
    // Only county/city carry a jurisdiction_name; federal/state must be null.
    jurisdiction_name: isLocal ? (jurisdictionVal || null) : null,
    important_notes:   (data.get("important_notes") as string) || null,
    eligibility_rules: {},
  };
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Unknown error";
}

export async function createProgram(_prev: unknown, data: FormData) {
  try {
    const { error } = await supabaseAdmin.from("programs").insert(formToProgram(data));
    if (error) return { error: error.message };
  } catch (e) {
    return { error: `Failed to save program: ${errorMessage(e)}` };
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/programs");
}

export async function updateProgram(_prev: unknown, data: FormData) {
  const id = data.get("id") as string;
  try {
    const { error } = await supabaseAdmin
      .from("programs")
      .update(formToProgram(data))
      .eq("id", id);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: `Failed to save program: ${errorMessage(e)}` };
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/programs");
}

export async function toggleActive(id: string, active: boolean) {
  try {
    await supabaseAdmin.from("programs").update({ is_active: active }).eq("id", id);
  } catch (e) {
    console.error("toggleActive failed:", errorMessage(e));
  }
  revalidatePath("/admin", "layout");
}

export async function clearGuideCache(slug: string) {
  try {
    await supabaseAdmin.from("program_guides").delete().eq("program_slug", slug);
  } catch (e) {
    console.error("clearGuideCache failed:", errorMessage(e));
  }
  revalidatePath("/admin", "layout");
}
