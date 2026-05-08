"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Program, Scope } from "@/lib/supabase";
import { STATES } from "@/lib/states";

const CATEGORIES = [
  "Food Assistance",
  "Health Insurance",
  "Financial Assistance",
  "Utility Assistance",
  "Information & Referral",
];

const SCOPES: { value: Scope; label: string; description: string }[] = [
  { value: "federal", label: "Federal", description: "Uniform nationwide rules — leave State blank" },
  { value: "state",   label: "State",   description: "State-administered (incl. block-grant programs run by the state)" },
  { value: "county",  label: "County",  description: "County agencies and hospital districts" },
  { value: "city",    label: "City",    description: "City-chartered agencies" },
];

type ActionFn = (prev: unknown, data: FormData) => Promise<{ error: string } | void>;

interface Props {
  action: ActionFn;
  program?: Program;
  heading: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold rounded-xl transition-colors disabled:opacity-40 text-sm"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

const input = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent bg-white";

export default function ProgramForm({ action, program, heading }: Props) {
  const [state, formAction] = useActionState(action, null);
  const [scope, setScope] = useState<Scope>(program?.scope ?? "federal");
  const isFederal = scope === "federal";
  const isLocal = scope === "county" || scope === "city";

  const jurisdictionPlaceholder =
    scope === "county" ? "e.g. Harris County" :
    scope === "city"   ? "e.g. City of San Antonio" : "";

  const jurisdictionHint =
    scope === "county" ? 'Convention: "[County Name] County" (e.g. "Harris County")' :
    scope === "city"   ? 'Convention: "City of [Name]" (e.g. "City of San Antonio")' : "";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/programs" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Programs
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <form action={formAction} className="flex flex-col gap-5">
          {program && <input type="hidden" name="id" value={program.id} />}

          {state != null && typeof state === "object" && "error" in state && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {(state as { error: string }).error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Field label="Program Name">
                <input name="name" defaultValue={program?.name ?? ""} required className={input} />
              </Field>
            </div>

            <Field label="Category">
              <select name="category" defaultValue={program?.category ?? CATEGORIES[0]} className={input}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Scope" hint={SCOPES.find((s) => s.value === scope)?.description}>
              <select
                name="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as Scope)}
                className={input}
              >
                {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>

            <Field label={isFederal ? "State (not applicable)" : "State"}>
              <select
                name="state"
                defaultValue={program?.state ?? ""}
                disabled={isFederal}
                required={!isFederal}
                className={`${input} ${isFederal ? "bg-gray-50 text-gray-400" : ""}`}
              >
                <option value="">{isFederal ? "—" : "Select a state…"}</option>
                {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </Field>

            {isLocal && (
              <div className="sm:col-span-2">
                <Field label="Jurisdiction" hint={jurisdictionHint}>
                  <input
                    name="jurisdiction_name"
                    defaultValue={program?.jurisdiction_name ?? ""}
                    placeholder={jurisdictionPlaceholder}
                    required
                    className={input}
                  />
                </Field>
              </div>
            )}

            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  name="description"
                  defaultValue={program?.description ?? ""}
                  required
                  rows={3}
                  className={`${input} resize-none`}
                />
              </Field>
            </div>

            <Field label="Potential Benefit">
              <input name="potential_benefit" defaultValue={program?.potential_benefit ?? ""} required className={input} />
            </Field>

            <Field label="Who Qualifies">
              <input name="who_qualifies" defaultValue={program?.who_qualifies ?? ""} required className={input} />
            </Field>

            <Field label="Phone Number">
              <input name="phone_number" defaultValue={program?.phone_number ?? ""} required placeholder="1-800-000-0000" className={input} />
            </Field>

            <Field label="Apply URL">
              <input name="apply_url" type="url" defaultValue={program?.apply_url ?? ""} required placeholder="https://" className={input} />
            </Field>

            <Field label="Benefit Value (annual $ equivalent)">
              <input name="benefit_value" type="number" min="0" defaultValue={program?.benefit_value ?? 0} required className={input} />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Important Notes (optional — shown as a warning callout on the program page)">
                <textarea
                  name="important_notes"
                  defaultValue={program?.important_notes ?? ""}
                  rows={3}
                  placeholder="e.g. This program is administered by your county, not the state."
                  className={`${input} resize-none`}
                />
              </Field>
            </div>

            <Field label="Status">
              <label className="flex items-center gap-3 cursor-pointer pt-1.5">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={program ? program.is_active : true}
                  className="w-4 h-4 accent-[#1D9E75] cursor-pointer"
                />
                <span className="text-sm text-gray-700">Active (visible to users)</span>
              </label>
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <SubmitButton label={program ? "Save Changes" : "Create Program"} />
            <Link href="/admin/programs" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
