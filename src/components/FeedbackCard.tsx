import Link from "next/link";
import type { FeedbackWithCreator } from "@/lib/airtable";
import { truncate } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { TypeBadge } from "./TypeBadge";

export function FeedbackCard({
  feedback,
  currentUserId,
}: {
  feedback: FeedbackWithCreator;
  currentUserId: string | null;
}) {
  const isOwner = currentUserId !== null && feedback.creatorId === currentUserId;
  const hasStatus = Boolean(feedback.status);
  const showHighlight = isOwner && hasStatus;

  return (
    <Link
      href={`/feedback/${feedback.id}`}
      className={`block rounded-md border-2 transition-colors overflow-hidden ${
        showHighlight
          ? "border-highlight-border bg-highlight-bg hover:brightness-95"
          : "border-border-tertiary bg-bg-secondary hover:bg-bg-primary"
      }`}
    >
      {showHighlight && (
        <div className="bg-highlight-stripe text-highlight-text px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
          <span aria-hidden>🔔</span>
          <span>Statut mis à jour</span>
          {feedback.status && (
            <span className="ml-auto">
              <StatusBadge status={feedback.status} />
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-1">
          <div className="text-sm font-medium text-text-primary leading-snug">
            {feedback.title}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <TypeBadge type={feedback.type} />
            {!showHighlight && feedback.status && (
              <StatusBadge status={feedback.status} />
            )}
            <span className="text-sm font-medium text-text-primary tabular-nums">
              {feedback.voteCount} ⭐
            </span>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {truncate(feedback.description, 100)}
        </p>
      </div>
    </Link>
  );
}
