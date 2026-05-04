import { redirect } from "next/navigation";
import { TypeBadge } from "@/components/TypeBadge";
import { listFeedbacks } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { AdminDeleteButton } from "./AdminDeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login?redirect=/admin");
  if (user.role !== "admin") redirect("/feedbacks");

  const feedbacks = await listFeedbacks();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
        <h1 className="text-base font-medium mb-6">Dashboard Admin</h1>

        <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border-tertiary">
                <th className="text-left py-3 text-[11px] uppercase font-medium text-text-secondary">
                  Titre
                </th>
                <th className="text-left py-3 text-[11px] uppercase font-medium text-text-secondary">
                  Créateur
                </th>
                <th className="text-left py-3 text-[11px] uppercase font-medium text-text-secondary">
                  Type
                </th>
                <th className="text-center py-3 text-[11px] uppercase font-medium text-text-secondary">
                  Votes
                </th>
                <th className="text-center py-3 text-[11px] uppercase font-medium text-text-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-text-secondary"
                  >
                    Aucun feedback.
                  </td>
                </tr>
              ) : (
                feedbacks.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-border-tertiary last:border-0"
                  >
                    <td className="py-3 font-medium text-text-primary">
                      {f.title}
                    </td>
                    <td className="py-3 text-text-secondary">
                      {f.creatorName}
                    </td>
                    <td className="py-3">
                      <TypeBadge type={f.type} />
                    </td>
                    <td className="py-3 text-center font-medium text-text-primary tabular-nums">
                      {f.voteCount}
                    </td>
                    <td className="py-3 text-center">
                      <AdminDeleteButton feedbackId={f.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-text-tertiary text-center mt-6">
          Visible uniquement pour role = admin
        </p>
      </div>
    </div>
  );
}
