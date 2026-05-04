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
      className={`block rounded-md border bg-bg-secondary p-4 transition-colors hover:bg-bg-primary ${
        showHighlight
          ? "border-l-4 border-l-blue-400 border-t border-r border-b border-border-tertiary"
          : "border-border-tertiary"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-1">
        <div className="text-sm font-medium text-text-primary leading-snug">
          {feedback.title}
          {showHighlight && (
            <span
              className="ml-2 text-xs text-blue-600"
              title="Mise à jour sur ton feedback"
              aria-label="Mise à jour"
            >
              🔔
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <TypeBadge type={feedback.type} />
          {feedback.status && <StatusBadge status={feedback.status} />}
          <span className="text-sm font-medium text-text-primary tabular-nums">
            {feedback.voteCount} ⭐
          </span>
        </div>
      </div>
      <p className="text-sm text-text-secondary">
        {truncate(feedback.description, 100)}
      </p>
    </Link>
  );
}
