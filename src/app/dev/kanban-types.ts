import type { FeedbackWithCreator } from "@/lib/airtable";
import type { FeedbackStatus } from "@/lib/schemas";

export const COLUMN_LABELS: Record<FeedbackStatus, string> = {
  to_do: "À faire",
  in_progress: "En cours",
  review: "À relire",
  done: "Fait",
};

export const COLUMN_ACCENTS: Record<FeedbackStatus, string> = {
  to_do: "border-t-blue-400",
  in_progress: "border-t-yellow-400",
  review: "border-t-purple-400",
  done: "border-t-green-500",
};

export type DevLite = { id: string; name: string };

export type CardActions = {
  pendingId: string | null;
  isDev: boolean;
  isAdmin: boolean;
  currentUserId: string;
  devs: DevLite[];
  onTake: (id: string) => void;
  onStatus: (id: string, s: FeedbackStatus) => void;
  onAssign: (id: string, userId: string) => void;
  onRemoveFromBacklog: (id: string) => void;
  isDesktop: boolean;
};

export type KanbanFeedback = FeedbackWithCreator;
