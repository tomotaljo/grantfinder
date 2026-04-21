import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toggleActive } from "./actions";
import type { Program } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function stateLabel(states: string[] | null): string {
  if (!states || states.length === 0) return "Federal";
  return states.join(", ");
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${active ? "bg-[#e6f7f1] text-[#157a5a]" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default async function AdminPage() {
  const { data: programs } = await supabaseAdmin
    .from("programs")
    .select("*")
    .order("benefit_value", { ascending: false });

  const rows = (programs ?? []) as Program[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} total programs</p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex items-center gap-2 bg-[#1D9E75] hover:bg-[#157a5a] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Program
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">State</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Benefit Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((prog) => (
                <tr
                  key={prog.id}
                  className={prog.is_active ? "hover:bg-gray-50" : "opacity-50 hover:bg-gray-50"}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                    {prog.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{prog.category}</td>
                  <td className="px-4 py-3 text-gray-600">{stateLabel(prog.states)}</td>
                  <td className="px-4 py-3 text-right text-gray-700 font-mono">
                    ${prog.benefit_value.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={prog.is_active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/programs/${prog.id}/edit`}
                        className="text-xs font-medium text-[#1D9E75] hover:text-[#157a5a] px-3 py-1.5 rounded-lg border border-[#1D9E75] hover:bg-[#e6f7f1] transition-colors"
                      >
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await toggleActive(prog.id, !prog.is_active);
                        }}
                      >
                        <button
                          type="submit"
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                            ${prog.is_active
                              ? "text-gray-500 border-gray-200 hover:bg-gray-100"
                              : "text-[#1D9E75] border-[#1D9E75] hover:bg-[#e6f7f1]"
                            }`}
                        >
                          {prog.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No programs yet. Add your first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
