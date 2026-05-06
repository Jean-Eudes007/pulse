"use client";

import { useState } from "react";
import { useApiMutation } from "@/lib/useApiMutation";

export function CommentForm({ feedbackId }: { feedbackId: string }) {
  const { mutate, pending } = useApiMutation();
  const [body, setBody] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    const res = await mutate(
      `/api/feedbacks/${feedbackId}/comments`,
      { method: "POST", json: { body } },
      { successMessage: "Commentaire ajouté" },
    );
    if (res.ok) setBody("");
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
