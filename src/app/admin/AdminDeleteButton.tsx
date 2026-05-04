"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AdminDeleteButton({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm("Supprimer ce feedback ?")) return;
    setPending(true);
    const res = await fetch(`/api/feedbacks/${feedbackId}`, {
      method: "DELETE",
    });
    setPending(false);
    if (!res.ok) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Feedback supprimé");
    router.refresh();
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
