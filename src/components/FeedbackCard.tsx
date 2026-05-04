import Link from "next/link";
import type { FeedbackWithCreator } from "@/lib/airtable";
import { truncate } from "@/lib/format";
import { TypeBadge } from "./TypeBadge";

export function FeedbackCard({ feedback }: { feedback: FeedbackWithCreator }) {
  return (
    <Link
      href={`/feedback/${feedback.id}`}
      className="block rounded-md border border-border-tertiary bg-bg-secondary p-4 transition-colors hover:bg-bg-primary"
    >
      {/* Mobile: title alone on top */}
      <div className="text-sm font-medium text-text-primary leading-snug mb-2 sm:mb-1 sm:hidden">
        {feedback.title}
      </div>

      {/* Desktop: title + badge + votes on same row */}
      <div className="hidden sm:flex items-start justify-between gap-3 mb-1">
        <div className="text-sm font-medium text-text-primary leading-snug">
          {feedback.title}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TypeBadge type={feedback.type} />
          <span className="text-sm font-medium text-text-primary tabular-nums">
            {feedback.voteCount} ⭐
          </span>
        </div>
      </div>

      {/* Mobile: badge + votes on their own row, below title */}
      <div className="flex items-center gap-2 mb-2 sm:hidden">
        <TypeBadge type={feedback.type} />
        <span className="text-sm font-medium text-text-primary tabular-nums">
          {feedback.voteCount} ⭐
        </span>
      </div>

      <p className="text-sm text-text-secondary">
        {truncate(feedback.description, 100)}
      </p>
    </Link>
  );
}
