"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FEEDBACK_TYPES, type FeedbackType } from "@/lib/schemas";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "🐛 Bug",
  "idée": "💡 Idée",
  "amélioration": "✨ Amélioration",
};

export default function SubmitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FeedbackType | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!type) {
      setError("Choisis un type");
      return;
    }
    setError(null);
    setPending(true);

    const res = await fetch("/api/feedbacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type }),
    });

    setPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de la création");
      return;
    }

    router.refresh();
    router.push("/feedbacks");
  }

  return (
    <div className="max-w-xl mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-8">
      <h1 className="text-base font-medium mb-6">
        Page 1 — Créer un feedback
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Titre du feedback *
          </label>
          <input
            id="title"
            type="text"
            required
            placeholder="Ex: Ajouter un mode dark"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Description *
          </label>
          <textarea
            id="description"
            required
            placeholder="Détaille ton idée, problème ou suggestion..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary min-h-[100px] font-sans"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Type *
          </label>
          <select
            id="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as FeedbackType | "")}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary"
          >
            <option value="">-- Choisis un type --</option>
            {FEEDBACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-type-bug-text bg-type-bug-bg rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-action text-text-info py-2.5 text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Soumettre le feedback"}
        </button>

        <p className="text-xs text-text-tertiary text-center mt-4">
          Creator et CreatedDate renseignés automatiquement
        </p>
      </form>
    </div>
  );
}
