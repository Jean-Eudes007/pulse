"use client";

import { useApiMutation } from "@/lib/useApiMutation";

export function AdminDeleteButton({ feedbackId }: { feedbackId: string }) {
  const { mutate, pending } = useApiMutation();

  async function handleClick() {
    if (!confirm("Supprimer ce feedback ?")) return;
    await mutate(
      `/api/feedbacks/${feedbackId}`,
      { method: "DELETE" },
      {
        successMessage: "Feedback supprimé",
        errorMessage: "Erreur lors de la suppression",
      },
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-border-secondary bg-transparent px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
