"use client";

import { useApiMutation } from "@/lib/useApiMutation";

export function AdminBacklogButton({ feedbackId }: { feedbackId: string }) {
  const { mutate, pending } = useApiMutation();

  async function handleClick() {
    await mutate(
      `/api/feedbacks/${feedbackId}/backlog`,
      { method: "POST" },
      {
        successMessage: "Envoyé au backlog",
        errorMessage: "Erreur lors de l'envoi au backlog",
      },
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-border-secondary bg-transparent px-2 py-1 text-xs font-medium text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "📌 Backlog"}
    </button>
  );
}
