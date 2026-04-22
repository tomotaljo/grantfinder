"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Program } from "@/lib/supabase";

const CATEGORIES = [
  "Food Assistance",
  "Health Insurance",
  "Financial Assistance",
  "Utility Assistance",
];

const STATES = [
  { value: "federal", label: "Federal (all states)" },
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
  { value: "DC", label: "Washington D.C." },
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const input = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent bg-white";

export default function ProgramForm({ action, program, heading }: Props) {
  const [state, formAction] = useActionState(action, null);

  const defaultState = program?.state ?? "federal";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
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

            <Field label="State Availability">
              <select name="state" defaultValue={defaultState} className={input}>
                {STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>

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
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
