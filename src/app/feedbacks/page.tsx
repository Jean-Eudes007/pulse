import Link from "next/link";
import { FeedbackCard } from "@/components/FeedbackCard";
import { listFeedbacks } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FeedbacksPage() {
  const [feedbacks, user] = await Promise.all([
    listFeedbacks(),
    getCurrentUser(),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-medium">
            Page 2 — Liste des feedbacks
          </h1>
          {user && (
            <Link
              href="/submit"
              className="rounded-md bg-action text-text-info px-3 py-1.5 text-sm font-medium hover:bg-action-hover transition-colors"
            >
              + Nouveau
            </Link>
          )}
        </div>

        {feedbacks.length === 0 ? (
          <div className="rounded-md border border-dashed border-border-tertiary p-8 text-center">
            <p className="text-sm text-text-secondary">
              Aucun feedback pour le moment.
            </p>
            {user ? (
              <Link
                href="/submit"
                className="inline-block mt-3 text-sm font-medium text-text-primary hover:underline"
              >
                Soumettre le premier
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-block mt-3 text-sm font-medium text-text-primary hover:underline"
              >
                Connectez-vous pour soumettre un feedback
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {feedbacks.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        )}

        <p className="text-xs text-text-tertiary text-center mt-6">
          Triée par nombre de votes (descending)
        </p>
      </div>
    </div>
  );
}
