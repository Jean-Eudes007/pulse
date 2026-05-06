"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FeedbackWithCreator } from "@/lib/airtable";
import type { Role } from "@/lib/auth";
import {
  type FeedbackStatus,
  FEEDBACK_STATUSES,
  STATUS_TRANSITIONS,
} from "@/lib/schemas";
import { DragPreview } from "./KanbanCard";
import { DroppableColumn } from "./KanbanColumn";
import { COLUMN_LABELS, type DevLite } from "./kanban-types";

function celebrate() {
  // Two bursts from the bottom corners
  const opts = { spread: 70, ticks: 200, gravity: 1, scalar: 0.9 };
  confetti({ ...opts, particleCount: 80, origin: { x: 0.2, y: 0.85 }, angle: 60 });
  confetti({ ...opts, particleCount: 80, origin: { x: 0.8, y: 0.85 }, angle: 120 });
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

type Props = {
  feedbacks: FeedbackWithCreator[];
  currentUserId: string;
  currentUserRole: Role;
  devs: DevLite[];
};

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Apply optimistic overrides on top of server data
  const displayFeedbacks = feedbacks.map((f) =>
    optimistic[f.id] ? { ...f, status: optimistic[f.id]! } : f,
  );

  function clearOptimistic(id: string) {
    setOptimistic((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
  }

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

  // router.refresh + the API routes' revalidatePath('/dev') give us
  // fresh server data without a full page reload.
  // Note: useRouter is imported lazily inside the component to keep
  // this file from accidentally re-rendering on every route change.

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

    // Special case: dragging an unassigned to_do ticket → in_progress = "take it"
    const isTakeAction =
      feedback.status === "to_do" && targetStatus === "in_progress";

    if (isTakeAction) {
      setOptimistic((s) => ({ ...s, [feedbackId]: "in_progress" }));
      const ok = await callApi(feedbackId, "/take", "POST");
      if (!ok) {
        clearOptimistic(feedbackId);
        return;
      }
      toast.success("Ticket pris");
      router.refresh();
      return;
    }

    // Regular status transition — must be in the allowed set
    const allowed = STATUS_TRANSITIONS[feedback.status];
    if (!allowed.includes(targetStatus)) {
      toast.error("Transition non autorisée");
      return;
    }

    setOptimistic((s) => ({ ...s, [feedbackId]: targetStatus }));
    const ok = await callApi(feedbackId, "/status", "PATCH", {
      status: targetStatus,
    });
    if (!ok) {
      clearOptimistic(feedbackId);
      return;
    }
    toast.success(`Déplacé → ${COLUMN_LABELS[targetStatus]}`);
    if (targetStatus === "done") celebrate();
    router.refresh();
  }

  const activeFeedback = activeId
    ? (displayFeedbacks.find((f) => f.id === activeId) ?? null)
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
              `Vue dev — ${isDesktop ? "drag-drop ou boutons" : "boutons"} pour déplacer tes tickets · drag un ticket non assigné vers 'En cours' = le prendre`}
            {isAdmin && "Vue admin — assigner et sortir un ticket du backlog"}
          </p>
        </div>
        <div className="text-xs text-text-tertiary">
          {displayFeedbacks.length} ticket
          {displayFeedbacks.length > 1 ? "s" : ""} dans le backlog
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEEDBACK_STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            cards={displayFeedbacks.filter((f) => f.status === status)}
            activeFeedbackId={activeId}
            cardActions={cardActions}
          />
        ))}
      </div>

      <DragOverlay>
        {activeFeedback ? <DragPreview feedback={activeFeedback} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
