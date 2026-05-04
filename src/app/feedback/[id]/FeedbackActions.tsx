"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FEEDBACK_TYPES, type FeedbackType } from "@/lib/schemas";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "🐛 Bug",
  "idée": "💡 Idée",
  "amélioration": "✨ Amélioration",
};

type Props = {
  feedbackId: string;
  initialVoteCount: number;
  initialHasVoted: boolean;
  isAuthenticated: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  initialTitle: string;
  initialDescription: string;
  initialType: FeedbackType;
};

export function FeedbackActions(props: Props) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(props.initialVoteCount);
  const [hasVoted, setHasVoted] = useState(props.initialHasVoted);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | "vote" | "edit" | "delete">(
    null,
  );

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(props.initialTitle);
  const [description, setDescription] = useState(props.initialDescription);
  const [type, setType] = useState<FeedbackType>(props.initialType);

  async function handleVote() {
    if (!props.isAuthenticated) {
      router.push(`/login?redirect=/feedback/${props.feedbackId}`);
      return;
    }
    setError(null);
    setPending("vote");
    const res = await fetch(`/api/feedbacks/${props.feedbackId}/vote`, {
      method: "POST",
    });
    setPending(null);
    if (res.status === 409) {
      setHasVoted(true);
      setError("Vous avez déjà voté pour ce feedback");
      return;
    }
    if (!res.ok) {
      setError("Erreur lors du vote");
      return;
    }
    const data = await res.json();
    setVoteCount(data.voteCount);
    setHasVoted(true);
    router.refresh();
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending("edit");
    const res = await fetch(`/api/feedbacks/${props.feedbackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type }),
    });
    setPending(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de la modification");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Supprimer ce feedback ? L'action est irréversible.")) return;
    setError(null);
    setPending("delete");
    const res = await fetch(`/api/feedbacks/${props.feedbackId}`, {
      method: "DELETE",
    });
    setPending(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de la suppression");
      return;
    }
    router.push("/feedbacks");
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={handleEdit} className="space-y-4">
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary"
        />
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary min-h-[100px] font-sans"
        />
        <select
          required
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary"
        >
          {FEEDBACK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-type-bug-text bg-type-bug-bg rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending === "edit"}
            className="rounded-md bg-action text-text-info px-4 py-2 text-sm font-medium hover:bg-action-hover disabled:opacity-50"
          >
            {pending === "edit" ? "…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-border-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleVote}
          disabled={hasVoted || pending === "vote"}
          className="rounded-md bg-action text-text-info px-4 py-2 text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending === "vote" ? "…" : hasVoted ? "✓ Voté" : "👍 Voter"}
          {!hasVoted && pending !== "vote" && (
            <span className="ml-1 tabular-nums">({voteCount})</span>
          )}
        </button>

        {props.isCreator && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-border-secondary bg-transparent px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
            >
              ✏️ Modifier
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending === "delete"}
              className="rounded-md border border-border-secondary bg-transparent px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50"
            >
              🗑️ Supprimer
            </button>
          </>
        )}

        {!props.isCreator && props.isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending === "delete"}
            className="rounded-md border border-border-secondary bg-transparent px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50"
          >
            🗑️ Supprimer (admin)
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-type-bug-text bg-type-bug-bg rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
