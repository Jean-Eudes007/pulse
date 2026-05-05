import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { listFeedbacks } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { AdminBacklogButton } from "./AdminBacklogButton";
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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <h1 className="text-lg font-semibold text-text-primary">
            Dashboard Admin
          </h1>
          <Link
            href="/dev"
            className="text-xs text-text-secondary hover:text-text-primary underline"
          >
            Voir le kanban →
          </Link>
        </div>

        {feedbacks.length === 0 ? (
          <div className="rounded-md border border-dashed border-border-tertiary p-8 text-center">
            <p className="text-sm text-text-secondary">Aucun feedback.</p>
          </div>
        ) : (
          <>
            {/* Mobile : cards stackées */}
            <div className="space-y-3 sm:hidden">
              {feedbacks.map((f) => (
                <div
                  key={f.id}
                  className="rounded-md border border-border-tertiary bg-bg-secondary p-4"
                >
                  <Link
                    href={`/feedback/${f.id}`}
                    className="block font-medium text-sm text-text-primary mb-2 leading-snug"
                  >
                    {f.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <TypeBadge type={f.type} />
                    {f.status && <StatusBadge status={f.status} />}
                    <span className="text-sm font-medium text-text-primary tabular-nums">
                      {f.voteCount} ⭐
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
                    <span>par {f.creatorName}</span>
                    <div className="flex items-center gap-2">
                      {!f.status && <AdminBacklogButton feedbackId={f.id} />}
                      <AdminDeleteButton feedbackId={f.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
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
                    <th className="text-left py-3 text-[11px] uppercase font-medium text-text-secondary">
                      Statut
                    </th>
                    <th className="text-center py-3 text-[11px] uppercase font-medium text-text-secondary">
                      Votes
                    </th>
                    <th className="text-center py-3 text-[11px] uppercase font-medium text-text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-border-tertiary last:border-0"
                    >
                      <td className="py-3 pr-3 font-medium text-text-primary">
                        <Link
                          href={`/feedback/${f.id}`}
                          className="hover:underline"
                        >
                          {f.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-text-secondary">
                        {f.creatorName}
                      </td>
                      <td className="py-3 pr-3">
                        <TypeBadge type={f.type} />
                      </td>
                      <td className="py-3 pr-3">
                        {f.status ? (
                          <StatusBadge status={f.status} />
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-text-primary tabular-nums">
                        {f.voteCount}
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-end gap-2">
                          {!f.status && <AdminBacklogButton feedbackId={f.id} />}
                          <AdminDeleteButton feedbackId={f.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-[11px] text-text-tertiary text-center mt-6">
          Visible uniquement pour role = admin · Bouton 📌 envoie au backlog
          dev · Suivez l'avancement dans{" "}
          <Link href="/dev" className="underline">
            le kanban
          </Link>
        </p>
      </div>
    </div>
  );
}
