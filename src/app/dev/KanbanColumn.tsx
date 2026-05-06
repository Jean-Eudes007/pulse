"use client";

import { useDroppable } from "@dnd-kit/core";
import type { FeedbackStatus } from "@/lib/schemas";
import { DraggableCard } from "./KanbanCard";
import {
  COLUMN_ACCENTS,
  COLUMN_LABELS,
  type CardActions,
  type KanbanFeedback,
} from "./kanban-types";

export function DroppableColumn({
  status,
  cards,
  activeFeedbackId,
  cardActions,
}: {
  status: FeedbackStatus;
  cards: KanbanFeedback[];
  activeFeedbackId: string | null;
  cardActions: CardActions;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`bg-bg-primary border border-border-tertiary rounded-lg p-4 border-t-4 ${COLUMN_ACCENTS[status]} transition-colors ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-primary">
          {COLUMN_LABELS[status]}
        </h2>
        <span className="text-xs text-text-tertiary tabular-nums">
          {cards.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[40px]">
        {cards.length === 0 && (
          <p className="text-xs text-text-tertiary italic py-4 text-center">
            Aucun ticket
          </p>
        )}
        {cards.map((f) => (
          <DraggableCard
            key={f.id}
            feedback={f}
            isDragging={f.id === activeFeedbackId}
            actions={cardActions}
          />
        ))}
      </div>
    </div>
  );
}
