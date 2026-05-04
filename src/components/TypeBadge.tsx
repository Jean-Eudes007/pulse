import type { FeedbackType } from "@/lib/schemas";

const STYLES: Record<
  FeedbackType,
  { bg: string; text: string; emoji: string; label: string }
> = {
  bug: {
    bg: "bg-type-bug-bg",
    text: "text-type-bug-text",
    emoji: "🐛",
    label: "Bug",
  },
  "idée": {
    bg: "bg-type-idee-bg",
    text: "text-type-idee-text",
    emoji: "💡",
    label: "Idée",
  },
  "amélioration": {
    bg: "bg-type-amelioration-bg",
    text: "text-type-amelioration-text",
    emoji: "✨",
    label: "Amélioration",
  },
};

export function TypeBadge({ type }: { type: FeedbackType }) {
  const s = STYLES[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span aria-hidden>{s.emoji}</span>
      <span>{s.label}</span>
    </span>
  );
}
