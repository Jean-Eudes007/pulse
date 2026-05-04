"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AdminBacklogButton({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const res = await fetch(`/api/feedbacks/${feedbackId}/backlog`, {
      method: "POST",
    });
    setPending(false);
    if (!res.ok) {
      toast.error("Erreur lors de l'envoi au backlog");
      return;
    }
    toast.success("Envoyé au backlog");
    router.refresh();
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
