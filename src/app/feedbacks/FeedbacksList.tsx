"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FeedbackCard } from "@/components/FeedbackCard";
import type { FeedbackWithCreator } from "@/lib/airtable";
import { FEEDBACK_TYPES, type FeedbackType } from "@/lib/schemas";

const TYPE_LABELS: Record<FeedbackType, { emoji: string; label: string }> = {
  bug: { emoji: "🐛", label: "Bug" },
  "idée": { emoji: "💡", label: "Idée" },
  "amélioration": { emoji: "✨", label: "Amélioration" },
};

type Filter = FeedbackType | "all";

export function FeedbacksList({
  feedbacks,
}: {
  feedbacks: FeedbackWithCreator[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<FeedbackType, number> = {
      bug: 0,
      "idée": 0,
      "amélioration": 0,
    };
    for (const f of feedbacks) c[f.type]++;
    return c;
  }, [feedbacks]);

  const filtered =
    filter === "all" ? feedbacks : feedbacks.filter((f) => f.type === filter);

  return (
    <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-base font-medium">Liste des feedbacks</h1>
        <Link
          href="/submit"
          className="rounded-md bg-action text-text-info px-3 py-1.5 text-sm font-medium hover:bg-action-hover transition-colors"
        >
          + Nouveau
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="Tous"
          count={feedbacks.length}
        />
        {FEEDBACK_TYPES.map((t) => (
          <FilterChip
            key={t}
            active={filter === t}
            onClick={() => setFilter(t)}
            label={`${TYPE_LABELS[t].emoji} ${TYPE_LABELS[t].label}`}
            count={counts[t]}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border-tertiary p-8 text-center">
          <p className="text-sm text-text-secondary">
            {filter === "all"
              ? "Aucun feedback pour le moment."
              : `Aucun feedback de type "${TYPE_LABELS[filter].label}".`}
          </p>
          {filter === "all" && (
            <Link
              href="/submit"
              className="inline-block mt-3 text-sm font-medium text-text-primary hover:underline"
            >
              Soumettre le premier
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </div>
      )}

      <p className="text-xs text-text-tertiary text-center mt-6">
        Triée par nombre de votes (descending)
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-action text-text-info"
          : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
      }`}
    >
      {label}
      <span
        className={`ml-2 tabular-nums ${
          active ? "text-text-info/70" : "text-text-tertiary"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
