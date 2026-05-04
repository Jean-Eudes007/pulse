import Link from "next/link";
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

                  <div className="flex items-center gap-2 mb-3">
                    <TypeBadge type={f.type} />
                    <span className="text-sm font-medium text-text-primary tabular-nums">
                      {f.voteCount} ⭐
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
                    <span>par {f.creatorName}</span>
                    <AdminDeleteButton feedbackId={f.id} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden sm:block">
              <table className="w-full text-sm">
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
                      <td className="py-3 px-3 text-center font-medium text-text-primary tabular-nums">
                        {f.voteCount}
                      </td>
                      <td className="py-3 text-center">
                        <AdminDeleteButton feedbackId={f.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-[11px] text-text-tertiary text-center mt-6">
          Visible uniquement pour role = admin
        </p>
      </div>
    </div>
  );
}
