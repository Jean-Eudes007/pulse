"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TypeBadge } from "@/components/TypeBadge";
import type { FeedbackWithCreator } from "@/lib/airtable";
import type { Role } from "@/lib/auth";
import { type FeedbackStatus, FEEDBACK_STATUSES } from "@/lib/schemas";

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

export function Kanban({
  feedbacks,
  currentUserId,
  currentUserRole,
  devs,
}: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const isDev = currentUserRole === "dev";
  const isAdmin = currentUserRole === "admin";

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

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-base font-medium">Kanban dev</h1>
          <p className="text-xs text-text-tertiary mt-1">
            {isDev && "Vue développeur — déplacez vos tickets entre colonnes"}
            {isAdmin &&
              "Vue admin — vous pouvez voir, assigner et sortir un ticket du backlog"}
          </p>
        </div>
        <div className="text-xs text-text-tertiary">
          {feedbacks.length} ticket{feedbacks.length > 1 ? "s" : ""} dans le
          backlog
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEEDBACK_STATUSES.map((status) => {
          const cards = feedbacks.filter((f) => f.status === status);
          return (
            <div
              key={status}
              className={`bg-bg-primary border border-border-tertiary rounded-lg p-4 border-t-4 ${COLUMN_ACCENTS[status]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-text-primary">
                  {COLUMN_LABELS[status]}
                </h2>
                <span className="text-xs text-text-tertiary tabular-nums">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-3">
                {cards.length === 0 && (
                  <p className="text-xs text-text-tertiary italic py-4 text-center">
                    Aucun ticket
                  </p>
                )}
                {cards.map((f) => (
                  <Card
                    key={f.id}
                    feedback={f}
                    isPending={pendingId === f.id}
                    isDev={isDev}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                    devs={devs}
                    onTake={() => handleTake(f.id)}
                    onStatus={(s) => handleStatus(f.id, s)}
                    onAssign={(uid) => handleAssign(f.id, uid)}
                    onRemoveFromBacklog={() => handleRemoveFromBacklog(f.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Card({
  feedback,
  isPending,
  isDev,
  isAdmin,
  currentUserId,
  devs,
  onTake,
  onStatus,
  onAssign,
  onRemoveFromBacklog,
}: {
  feedback: FeedbackWithCreator;
  isPending: boolean;
  isDev: boolean;
  isAdmin: boolean;
  currentUserId: string;
  devs: DevLite[];
  onTake: () => void;
  onStatus: (s: FeedbackStatus) => void;
  onAssign: (userId: string) => void;
  onRemoveFromBacklog: () => void;
}) {
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

      {/* Dev actions */}
      {isDev && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {feedback.status === "to_do" && (
            <ActionBtn onClick={onTake} disabled={isPending} primary>
              Prendre
            </ActionBtn>
          )}
          {feedback.status === "in_progress" && isMine && (
            <>
              <ActionBtn onClick={() => onStatus("review")} disabled={isPending}>
                → Review
              </ActionBtn>
              <ActionBtn onClick={() => onStatus("to_do")} disabled={isPending}>
                ↶ Lâcher
              </ActionBtn>
            </>
          )}
          {feedback.status === "review" && (
            <>
              <ActionBtn onClick={() => onStatus("done")} disabled={isPending} primary>
                → Done
              </ActionBtn>
              <ActionBtn
                onClick={() => onStatus("in_progress")}
                disabled={isPending}
              >
                ↶ In progress
              </ActionBtn>
            </>
          )}
          {feedback.status === "done" && (
            <ActionBtn onClick={() => onStatus("review")} disabled={isPending}>
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
            onChange={(e) => onAssign(e.target.value)}
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
            onClick={onRemoveFromBacklog}
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
