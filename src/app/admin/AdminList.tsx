import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { listFeedbacks } from "@/lib/airtable";
import { AdminBacklogButton } from "./AdminBacklogButton";
import { AdminDeleteButton } from "./AdminDeleteButton";

// "Liste & modération" tab — the original /admin table view.
export async function AdminList() {
  const feedbacks = await listFeedbacks();

  if (feedbacks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border-tertiary p-8 text-center">
        <p className="text-sm text-text-secondary">Aucun feedback.</p>
      </div>
    );
  }

  return (
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
  );
}
