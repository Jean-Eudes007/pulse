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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-1">
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
      <p className="text-sm text-text-secondary">
        {truncate(feedback.description, 100)}
      </p>
    </Link>
  );
}
