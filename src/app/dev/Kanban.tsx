"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TypeBadge } from "@/components/TypeBadge";
import type { FeedbackWithCreator } from "@/lib/airtable";
import type { Role } from "@/lib/auth";
import {
  type FeedbackStatus,
  FEEDBACK_STATUSES,
  STATUS_TRANSITIONS,
} from "@/lib/schemas";

const COLUMN_LABELS: Record<FeedbackStatus, string> = {
  to_do: "À faire",
  in_progress: "En cours",
  review: "À relire",
  done: "Fait",
};

const COLUMN_ACCENTS: Record<FeedbackStatus, string> = {
  to_do: "border-t-blue-400",
  in_progress: "border-t-yellow-400",
  review: "border-t-purple-400",
  done: "border-t-green-500",
};

type DevLite = { id: string; name: string };

type Props = {
  feedbacks: FeedbackWithCreator[];
  currentUserId: string;
  currentUserRole: Role;
  devs: DevLite[];
};

function celebrate() {
  // Fire two bursts from the bottom corners
  const opts = { spread: 70, ticks: 200, gravity: 1, scalar: 0.9 };
  confetti({
    ...opts,
    particleCount: 80,
    origin: { x: 0.2, y: 0.85 },
    angle: 60,
  });
  confetti({
    ...opts,
    particleCount: 80,
    origin: { x: 0.8, y: 0.85 },
    angle: 120,
  });
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function Kanban({
  feedbacks,
  currentUserId,
  currentUserRole,
  devs,
}: Props) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<
    Record<string, FeedbackStatus | undefined>
  >({});

  const isDev = currentUserRole === "dev";
  const isAdmin = currentUserRole === "admin";

  // Devs can drag only their own tickets. Admins can drag none (they assign,
  // not move). Users never get here (page-level redirect).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Apply optimistic overrides on top of server data
  const displayFeedbacks = feedbacks.map((f) =>
    optimistic[f.id] ? { ...f, status: optimistic[f.id]! } : f,
  );

  async function callApi(
    feedbackId: string,
    path: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ) {
    setPendingId(feedbackId);
    const res = await fetch(`/api/feedbacks/${feedbackId}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setPendingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Erreur");
      return false;
    }
    return true;
  }

  async function handleTake(id: string) {
    if (!(await callApi(id, "/take", "POST"))) return;
    toast.success("Ticket pris");
    router.refresh();
  }

  async function handleStatus(id: string, status: FeedbackStatus) {
    if (!(await callApi(id, "/status", "PATCH", { status }))) return;
    toast.success(`Statut → ${COLUMN_LABELS[status]}`);
    if (status === "done") celebrate();
    router.refresh();
  }

  async function handleAssign(id: string, userId: string) {
    if (
      !(await callApi(id, "/assign", "PATCH", {
        userId: userId === "" ? null : userId,
      }))
    )
      return;
    toast.success("Assignation modifiée");
    router.refresh();
  }

  async function handleRemoveFromBacklog(id: string) {
    if (!confirm("Sortir ce feedback du backlog ?")) return;
    if (!(await callApi(id, "/backlog", "DELETE"))) return;
    toast.success("Feedback sorti du backlog");
    router.refresh();
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const feedbackId = String(event.active.id);
    const targetStatus = event.over?.id as FeedbackStatus | undefined;
    if (!targetStatus) return;

    const feedback = displayFeedbacks.find((f) => f.id === feedbackId);
    if (!feedback?.status) return;
    if (feedback.status === targetStatus) return;

    // Validate transition client-side (server validates too)
    const allowed = STATUS_TRANSITIONS[feedback.status];
    if (!allowed.includes(targetStatus)) {
      toast.error(`Transition non autorisée`);
      return;
    }

    // Optimistic update
    setOptimistic((s) => ({ ...s, [feedbackId]: targetStatus }));
    const ok = await callApi(feedbackId, "/status", "PATCH", {
      status: targetStatus,
    });
    if (!ok) {
      // Rollback
      setOptimistic((s) => {
        const next = { ...s };
        delete next[feedbackId];
        return next;
      });
      return;
    }
    toast.success(`Déplacé → ${COLUMN_LABELS[targetStatus]}`);
    if (targetStatus === "done") celebrate();
    router.refresh();
    // Clear optimistic after refresh — the new server data is canonical
    setTimeout(() => {
      setOptimistic((s) => {
        const next = { ...s };
        delete next[feedbackId];
        return next;
      });
    }, 500);
  }

  const activeFeedback = activeId
    ? displayFeedbacks.find((f) => f.id === activeId) ?? null
    : null;

  const cardActions = {
    pendingId,
    isDev,
    isAdmin,
    currentUserId,
    devs,
    onTake: handleTake,
    onStatus: handleStatus,
    onAssign: handleAssign,
    onRemoveFromBacklog: handleRemoveFromBacklog,
    isDesktop,
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            Kanban dev
          </h1>
          <p className="text-xs text-text-tertiary mt-1">
            {isDev &&
              `Vue dev — ${isDesktop ? "drag-drop ou boutons" : "boutons"} pour déplacer tes tickets`}
            {isAdmin &&
              "Vue admin — assigner et sortir un ticket du backlog"}
          </p>
        </div>
        <div className="text-xs text-text-tertiary">
          {displayFeedbacks.length} ticket
          {displayFeedbacks.length > 1 ? "s" : ""} dans le backlog
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEEDBACK_STATUSES.map((status) => {
          const cards = displayFeedbacks.filter((f) => f.status === status);
          return (
            <DroppableColumn
              key={status}
              status={status}
              cards={cards}
              activeFeedbackId={activeId}
              cardActions={cardActions}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeFeedback ? <DragPreview feedback={activeFeedback} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({
  status,
  cards,
  activeFeedbackId,
  cardActions,
}: {
  status: FeedbackStatus;
  cards: FeedbackWithCreator[];
  activeFeedbackId: string | null;
  cardActions: CardActions;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`bg-bg-primary border border-border-tertiary rounded-lg p-4 border-t-4 ${COLUMN_ACCENTS[status]} transition-colors ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-primary">
          {COLUMN_LABELS[status]}
        </h2>
        <span className="text-xs text-text-tertiary tabular-nums">
          {cards.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[40px]">
        {cards.length === 0 && (
          <p className="text-xs text-text-tertiary italic py-4 text-center">
            Aucun ticket
          </p>
        )}
        {cards.map((f) => (
          <DraggableCard
            key={f.id}
            feedback={f}
            isDragging={f.id === activeFeedbackId}
            actions={cardActions}
          />
        ))}
      </div>
    </div>
  );
}

type CardActions = {
  pendingId: string | null;
  isDev: boolean;
  isAdmin: boolean;
  currentUserId: string;
  devs: DevLite[];
  onTake: (id: string) => void;
  onStatus: (id: string, s: FeedbackStatus) => void;
  onAssign: (id: string, userId: string) => void;
  onRemoveFromBacklog: (id: string) => void;
  isDesktop: boolean;
};

function DraggableCard({
  feedback,
  isDragging,
  actions,
}: {
  feedback: FeedbackWithCreator;
  isDragging: boolean;
  actions: CardActions;
}) {
  const { isDev, isDesktop, currentUserId } = actions;
  const isMine = isDev && feedback.assignedToId === currentUserId;
  // Drag enabled only for: desktop AND dev AND owns this ticket
  const dragEnabled = isDesktop && isMine;

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
      <Card feedback={feedback} actions={actions} />
    </div>
  );
}

function DragPreview({ feedback }: { feedback: FeedbackWithCreator }) {
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

function Card({
  feedback,
  actions,
}: {
  feedback: FeedbackWithCreator;
  actions: CardActions;
}) {
  const {
    pendingId,
    isDev,
    isAdmin,
    currentUserId,
    devs,
    onTake,
    onStatus,
    onAssign,
    onRemoveFromBacklog,
  } = actions;
  const isPending = pendingId === feedback.id;
  const isMine = isDev && feedback.assignedToId === currentUserId;

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
              <ActionBtn
                onClick={() => onStatus(feedback.id, "review")}
                disabled={isPending}
              >
                → Review
              </ActionBtn>
              <ActionBtn
                onClick={() => onStatus(feedback.id, "to_do")}
                disabled={isPending}
              >
                ↶ Lâcher
              </ActionBtn>
            </>
          )}
          {feedback.status === "review" && (
            <>
              <ActionBtn
                onClick={() => onStatus(feedback.id, "done")}
                disabled={isPending}
                primary
              >
                → Done
              </ActionBtn>
              <ActionBtn
                onClick={() => onStatus(feedback.id, "in_progress")}
                disabled={isPending}
              >
                ↶ In progress
              </ActionBtn>
            </>
          )}
          {feedback.status === "done" && (
            <ActionBtn
              onClick={() => onStatus(feedback.id, "review")}
              disabled={isPending}
            >
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
