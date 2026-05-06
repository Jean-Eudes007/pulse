"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { TypeBadge } from "@/components/TypeBadge";
import type { FeedbackStatus } from "@/lib/schemas";
import type { CardActions, KanbanFeedback } from "./kanban-types";

export function DraggableCard({
  feedback,
  isDragging,
  actions,
}: {
  feedback: KanbanFeedback;
  isDragging: boolean;
  actions: CardActions;
}) {
  const { isDev, isDesktop, currentUserId } = actions;
  const isMine = isDev && feedback.assignedToId === currentUserId;
  // Devs can drag:
  // - tickets they own (any column)
  // - any to_do ticket (drag to in_progress = "take" it)
  const isAvailableTodo = isDev && feedback.status === "to_do";
  const dragEnabled = isDesktop && (isMine || isAvailableTodo);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: feedback.id,
    disabled: !dragEnabled,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: 0.4 }
    : isDragging
      ? { opacity: 0.4 }
      : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(dragEnabled ? listeners : {})}
      className={dragEnabled ? "cursor-grab active:cursor-grabbing" : ""}
    >
      <Card feedback={feedback} actions={actions} isMine={isMine} />
    </div>
  );
}

function Card({
  feedback,
  actions,
  isMine,
}: {
  feedback: KanbanFeedback;
  actions: CardActions;
  isMine: boolean;
}) {
  const {
    pendingId,
    isDev,
    isAdmin,
    devs,
    onTake,
    onStatus,
    onAssign,
    onRemoveFromBacklog,
  } = actions;
  const isPending = pendingId === feedback.id;

  return (
    <div className="rounded-md border border-border-tertiary bg-bg-secondary p-3">
      <Link
        href={`/feedback/${feedback.id}`}
        className="block text-sm font-medium text-text-primary leading-snug mb-2 hover:underline"
      >
        {feedback.title}
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={feedback.type} />
        <span className="text-xs text-text-tertiary tabular-nums">
          {feedback.voteCount} ⭐
        </span>
      </div>

      <div className="text-xs text-text-secondary mb-2">
        <div>par {feedback.creatorName}</div>
        {feedback.assignedToName && (
          <div className={isMine ? "text-text-primary font-medium" : ""}>
            → {feedback.assignedToName} {isMine && "(vous)"}
          </div>
        )}
      </div>

      {/* Dev actions (buttons stay always — fallback for mobile and a11y) */}
      {isDev && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {feedback.status === "to_do" && (
            <ActionBtn onClick={() => onTake(feedback.id)} disabled={isPending} primary>
              Prendre
            </ActionBtn>
          )}
          {feedback.status === "in_progress" && isMine && (
            <>
              <ActionBtn onClick={() => onStatus(feedback.id, "review")} disabled={isPending}>
                → Review
              </ActionBtn>
              <ActionBtn onClick={() => onStatus(feedback.id, "to_do")} disabled={isPending}>
                ↶ Lâcher
              </ActionBtn>
            </>
          )}
          {feedback.status === "review" && (
            <>
              <ActionBtn onClick={() => onStatus(feedback.id, "done")} disabled={isPending} primary>
                → Done
              </ActionBtn>
              <ActionBtn onClick={() => onStatus(feedback.id, "in_progress")} disabled={isPending}>
                ↶ In progress
              </ActionBtn>
            </>
          )}
          {feedback.status === "done" && (
            <ActionBtn onClick={() => onStatus(feedback.id, "review")} disabled={isPending}>
              ↶ Review
            </ActionBtn>
          )}
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="space-y-2 mt-3">
          <select
            value={feedback.assignedToId ?? ""}
            onChange={(e) => onAssign(feedback.id, e.target.value)}
            disabled={isPending}
            className="w-full rounded-md border border-border-tertiary bg-bg-primary px-2 py-1 text-xs text-text-primary"
            aria-label="Assigner un dev"
          >
            <option value="">— non assigné —</option>
            {devs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onRemoveFromBacklog(feedback.id)}
            disabled={isPending}
            className="w-full rounded-md border border-border-secondary px-2 py-1 text-xs font-medium text-text-primary hover:bg-bg-tertiary disabled:opacity-50"
          >
            Retirer du backlog
          </button>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        primary
          ? "bg-action text-text-info hover:bg-action-hover"
          : "border border-border-secondary text-text-primary hover:bg-bg-tertiary"
      }`}
    >
      {children}
    </button>
  );
}

export function DragPreview({ feedback }: { feedback: KanbanFeedback }) {
  return (
    <div className="rounded-md border border-border-secondary bg-bg-primary shadow-lg p-3 max-w-xs rotate-2">
      <div className="text-sm font-medium text-text-primary leading-snug mb-2">
        {feedback.title}
      </div>
      <div className="flex items-center gap-2">
        <TypeBadge type={feedback.type} />
        <span className="text-xs text-text-tertiary tabular-nums">
          {feedback.voteCount} ⭐
        </span>
      </div>
    </div>
  );
}

// Re-export FeedbackStatus type used by the parent to dispatch onStatus
export type { FeedbackStatus };
