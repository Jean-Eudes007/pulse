"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NotificationWithFeedback } from "@/lib/airtable";
import type { NotificationKind } from "@/lib/schemas";
import { useApiMutation } from "@/lib/useApiMutation";

const STATUS_MESSAGE: Record<
  NotificationKind,
  (assignee: string | null) => string
> = {
  to_do: () => "📌 envoyé au backlog",
  in_progress: (a) => (a ? `👋 pris par ${a}` : "👋 ticket pris"),
  review: () => "🔍 attend une relecture",
  done: () => "✅ livré !",
  comment: () => "💬 nouveau commentaire",
};

export function NotificationBanner() {
  const { mutate, pending: dismissing } = useApiMutation();
  const [notifs, setNotifs] = useState<NotificationWithFeedback[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((d) => {
        if (!cancelled) setNotifs(d.notifications ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotifs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (notifs === null || notifs.length === 0) return null;

  async function dismissAll() {
    const res = await mutate(
      "/api/notifications",
      { method: "DELETE" },
      { errorMessage: "Erreur" },
    );
    if (res.ok) setNotifs([]);
  }

  return (
    <div className="bg-info-bg border border-info-border rounded-lg p-4 sm:p-5 mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-info-text">
            🔔 {notifs.length}{" "}
            {notifs.length > 1 ? "de tes feedbacks ont avancé" : "de tes feedbacks a avancé"}
          </p>
          <p className="text-xs text-info-text-muted mt-0.5">
            Clique pour voir le détail, ou ferme la notif quand tu as vu.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissAll}
          disabled={dismissing}
          aria-label="Tout marquer comme vu"
          className="shrink-0 rounded-md bg-info-stripe hover:brightness-110 text-info-text w-7 h-7 flex items-center justify-center text-sm transition-colors disabled:opacity-50"
        >
          ×
        </button>
      </div>
      <ul className="space-y-1.5">
        {notifs.map((n) => {
          if (!n.feedback) return null;
          const message = n.status
            ? STATUS_MESSAGE[n.status](n.feedback.assignedToName ?? null)
            : "";
          return (
            <li key={n.id}>
              <Link
                href={`/feedback/${n.feedback.id}`}
                className="block rounded-md px-2 py-1.5 -mx-2 hover:bg-info-stripe/60 transition-colors text-sm text-info-text"
              >
                <span className="font-medium">{n.feedback.title}</span>{" "}
                <span className="text-info-text-muted">— {message}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
