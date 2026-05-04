import type { FeedbackStatus } from "@/lib/schemas";

const STYLES: Record<
  FeedbackStatus,
  { bg: string; text: string; label: string; emoji: string }
> = {
  to_do: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "À faire",
    emoji: "📋",
  },
  in_progress: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    label: "En cours",
    emoji: "⚙️",
  },
  review: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    label: "À relire",
    emoji: "🔍",
  },
  done: {
    bg: "bg-green-50",
    text: "text-green-700",
    label: "Fait",
    emoji: "✅",
  },
};

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span aria-hidden>{s.emoji}</span>
      <span>{s.label}</span>
    </span>
  );
}
