import { AIRTABLE_PAGE_SIZE } from "../config";
import type { NotificationKind } from "../schemas";
import { type AirtableRecord, nowIso, notificationsTable } from "./client";
import {
  type FeedbackWithCreator,
  enrichWithUsers,
  mapFeedback,
} from "./feedbacks";
import { feedbacksTable } from "./client";

export type NotificationRecord = {
  id: string;
  recipientId: string | null;
  feedbackId: string | null;
  status: NotificationKind | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationWithFeedback = NotificationRecord & {
  feedback: FeedbackWithCreator | null;
};

function mapNotification(r: AirtableRecord): NotificationRecord {
  const f = r.fields as Record<string, unknown>;
  const recipientIds = (f.Recipient as string[] | undefined) ?? [];
  const feedbackIds = (f.Feedback as string[] | undefined) ?? [];
  return {
    id: r.id,
    recipientId: recipientIds[0] ?? null,
    feedbackId: feedbackIds[0] ?? null,
    status: (f.Status as NotificationKind | undefined) ?? null,
    createdAt: String(f.CreatedAt ?? ""),
    updatedAt: String(f.UpdatedAt ?? ""),
  };
}

export async function listNotifications(
  recipientId: string,
): Promise<NotificationWithFeedback[]> {
  const records = await notificationsTable
    .select({
      filterByFormula: `{RecipientId} = '${recipientId}'`,
      sort: [{ field: "UpdatedAt", direction: "desc" }],
      pageSize: AIRTABLE_PAGE_SIZE,
    })
    .all();
  const notifs = records.map(mapNotification);
  if (notifs.length === 0) return [];

  const feedbackIds = Array.from(
    new Set(
      notifs.map((n) => n.feedbackId).filter((id): id is string => Boolean(id)),
    ),
  );
  const feedbackRecords = await feedbacksTable
    .select({
      filterByFormula: `OR(${feedbackIds.map((id) => `RECORD_ID() = '${id}'`).join(", ")})`,
      pageSize: feedbackIds.length,
    })
    .all();
  const feedbacks = feedbackRecords.map(mapFeedback);
  const enriched = await enrichWithUsers(feedbacks);
  const byId = new Map(enriched.map((f) => [f.id, f]));

  return notifs.map((n) => ({
    ...n,
    feedback: n.feedbackId ? (byId.get(n.feedbackId) ?? null) : null,
  }));
}

export async function upsertNotification(input: {
  recipientId: string;
  feedbackId: string;
  status: NotificationKind;
}): Promise<void> {
  const existing = await notificationsTable
    .select({
      filterByFormula: `AND({RecipientId} = '${input.recipientId}', {Feedback_Id} = '${input.feedbackId}')`,
      maxRecords: 1,
    })
    .firstPage();

  const now = nowIso();
  if (existing.length > 0) {
    await notificationsTable.update([
      {
        id: existing[0].id,
        fields: { Status: input.status, UpdatedAt: now },
      },
    ]);
  } else {
    await notificationsTable.create([
      {
        fields: {
          Recipient: [input.recipientId],
          Feedback: [input.feedbackId],
          Status: input.status,
          RecipientId: input.recipientId,
          FeedbackId: input.feedbackId,
          CreatedAt: now,
          UpdatedAt: now,
        },
      },
    ]);
  }
}

export async function deleteAllNotifications(
  recipientId: string,
): Promise<void> {
  const records = await notificationsTable
    .select({
      filterByFormula: `{RecipientId} = '${recipientId}'`,
      pageSize: AIRTABLE_PAGE_SIZE,
    })
    .all();
  if (records.length === 0) return;
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10).map((r) => r.id);
    await notificationsTable.destroy(batch);
  }
}

export async function deleteNotificationForFeedback(
  recipientId: string,
  feedbackId: string,
): Promise<void> {
  const records = await notificationsTable
    .select({
      filterByFormula: `AND({RecipientId} = '${recipientId}', {Feedback_Id} = '${Feedback_Id}')`,
      maxRecords: 5,
    })
    .firstPage();
  if (records.length === 0) return;
  await notificationsTable.destroy(records.map((r) => r.id));
}
