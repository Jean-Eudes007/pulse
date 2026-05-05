"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CommentForm({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    const res = await fetch(`/api/feedbacks/${feedbackId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Erreur");
      return;
    }
    setBody("");
    toast.success("Commentaire ajouté");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="comment-body" className="sr-only">
        Votre commentaire
      </label>
      <textarea
        id="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ajouter un commentaire…"
        maxLength={2000}
        rows={3}
        className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary font-sans"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-tertiary">
          {body.length}/2000
        </span>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-md bg-action text-text-info px-4 py-1.5 text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Publier"}
        </button>
      </div>
    </form>
  );
}
