import Airtable, { type FieldSet, type Records } from "airtable";
import type { Role } from "./auth";
import type { FeedbackStatus, FeedbackType } from "./schemas";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} env var is missing`);
  return v;
}

const airtable = new Airtable({ apiKey: getEnv("AIRTABLE_TOKEN") });
const base = airtable.base(getEnv("AIRTABLE_BASE_ID"));

const usersTable = base("Users");
const feedbacksTable = base("Feedbacks");
const votesTable = base("Votes");
const notificationsTable = base("Notifications");
const commentsTable = base("Comments");

type AirtableRecord = Records<FieldSet>[number];

function nowIso(): string {
  return new Date().toISOString();
}

/* -------------------------------------------------------------- Users -- */

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
};

function mapUser(r: AirtableRecord): UserRecord {
  const f = r.fields as Record<string, unknown>;
  return {
    id: r.id,
    email: String(f.Email ?? ""),
    passwordHash: String(f.PasswordHash ?? ""),
    name: String(f.Name ?? ""),
    role: (f.Role as Role) ?? "user",
  };
}

export async function getUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const escaped = email.toLowerCase().replace(/'/g, "\\'");
  const records = await usersTable
    .select({
      filterByFormula: `LOWER({Email}) = '${escaped}'`,
      maxRecords: 1,
    })
    .firstPage();
  return records.length ? mapUser(records[0]) : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  try {
    const record = await usersTable.find(id);
    return mapUser(record);
  } catch {
    return null;
  }
}

export async function getUsersByIds(ids: string[]): Promise<UserRecord[]> {
  if (ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const formula = `OR(${unique
    .map((id) => `RECORD_ID() = '${id}'`)
    .join(", ")})`;
  const records = await usersTable
    .select({ filterByFormula: formula, maxRecords: unique.length })
    .all();
  return records.map(mapUser);
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<UserRecord> {
  const created = await usersTable.create([
    {
      fields: {
        Email: input.email,
        PasswordHash: input.passwordHash,
        Name: input.name,
        Role: "user",
        CreatedAt: nowIso(),
      },
    },
  ]);
  return mapUser(created[0]);
}

export async function listDevs(): Promise<UserRecord[]> {
  const records = await usersTable
    .select({ filterByFormula: `{Role} = 'dev'`, pageSize: 100 })
    .all();
  return records.map(mapUser);
}

/* ---------------------------------------------------------- Feedbacks -- */

export type FeedbackRecord = {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  voteCount: number;
  creatorId: string | null;
  createdAt: string;
  status: FeedbackStatus | null;
  assignedToId: string | null;
};

export type FeedbackWithCreator = FeedbackRecord & {
  creatorName: string;
  assignedToName: string | null;
};

function mapFeedback(r: AirtableRecord): FeedbackRecord {
  const f = r.fields as Record<string, unknown>;
  const creatorIds = (f.Creator as string[] | undefined) ?? [];
  const assignedIds = (f.AssignedTo as string[] | undefined) ?? [];
  return {
    id: r.id,
    title: String(f.Title ?? ""),
    description: String(f.Description ?? ""),
    type: (f.Type as FeedbackType) ?? "idée",
    voteCount: typeof f.VoteCount === "number" ? f.VoteCount : 0,
    creatorId: creatorIds[0] ?? null,
    createdAt: String(f.CreatedAt ?? ""),
    status: (f.Status as FeedbackStatus | undefined) ?? null,
    assignedToId: assignedIds[0] ?? null,
  };
}

async function enrichWithUsers(
  feedbacks: FeedbackRecord[],
): Promise<FeedbackWithCreator[]> {
  const ids = new Set<string>();
  for (const f of feedbacks) {
    if (f.creatorId) ids.add(f.creatorId);
    if (f.assignedToId) ids.add(f.assignedToId);
  }
  const users = await getUsersByIds(Array.from(ids));
  const byId = new Map(users.map((u) => [u.id, u.name]));
  return feedbacks.map((f) => ({
    ...f,
    creatorName: f.creatorId ? (byId.get(f.creatorId) ?? "Anonyme") : "Anonyme",
    assignedToName: f.assignedToId ? (byId.get(f.assignedToId) ?? null) : null,
  }));
}

export async function listFeedbacks(): Promise<FeedbackWithCreator[]> {
  const records = await feedbacksTable
    .select({
      sort: [{ field: "VoteCount", direction: "desc" }],
      pageSize: 100,
    })
    .all();
  const feedbacks = records.map(mapFeedback);
  return enrichWithUsers(feedbacks);
}

export async function getFeedbackById(
  id: string,
): Promise<FeedbackWithCreator | null> {
  let record;
  try {
    record = await feedbacksTable.find(id);
  } catch {
    return null;
  }
  const feedback = mapFeedback(record);
  const enriched = await enrichWithUsers([feedback]);
  return enriched[0] ?? null;
}

export async function createFeedback(input: {
  title: string;
  description: string;
  type: FeedbackType;
  creatorId: string;
}): Promise<FeedbackRecord> {
  const created = await feedbacksTable.create([
    {
      fields: {
        Title: input.title,
        Description: input.description,
        Type: input.type,
        VoteCount: 0,
        Creator: [input.creatorId],
        CreatedAt: nowIso(),
      },
    },
  ]);
  return mapFeedback(created[0]);
}

export async function updateFeedback(
  id: string,
  input: Partial<{ title: string; description: string; type: FeedbackType }>,
): Promise<FeedbackRecord> {
  const fields: Partial<FieldSet> = {};
  if (input.title !== undefined) fields.Title = input.title;
  if (input.description !== undefined) fields.Description = input.description;
  if (input.type !== undefined) fields.Type = input.type;

  const updated = await feedbacksTable.update([{ id, fields }]);
  return mapFeedback(updated[0]);
}

export async function deleteFeedback(id: string): Promise<void> {
  await feedbacksTable.destroy([id]);
}

export async function incrementVoteCount(
  id: string,
  current: number,
): Promise<void> {
  await feedbacksTable.update([
    { id, fields: { VoteCount: current + 1 } },
  ]);
}

export async function listBacklogFeedbacks(): Promise<FeedbackWithCreator[]> {
  const records = await feedbacksTable
    .select({
      filterByFormula: `{Status} != ''`,
      sort: [{ field: "VoteCount", direction: "desc" }],
      pageSize: 100,
    })
    .all();
  const feedbacks = records.map(mapFeedback);
  return enrichWithUsers(feedbacks);
}

// Airtable accepts null to clear a field but the SDK FieldSet type
// doesn't include null. Cast via `as unknown as Partial<FieldSet>` is
// the standard escape hatch used elsewhere in this file.
export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus | null,
): Promise<void> {
  const fields = { Status: status } as unknown as Partial<FieldSet>;
  await feedbacksTable.update([{ id, fields }]);
}

export async function assignFeedback(
  id: string,
  userId: string | null,
): Promise<void> {
  const fields = {
    AssignedTo: userId ? [userId] : [],
  } as unknown as Partial<FieldSet>;
  await feedbacksTable.update([{ id, fields }]);
}

export async function sendToBacklog(id: string): Promise<void> {
  const fields = {
    Status: "to_do",
    AssignedTo: [],
  } as unknown as Partial<FieldSet>;
  await feedbacksTable.update([{ id, fields }]);
}

export async function removeFromBacklog(id: string): Promise<void> {
  const fields = {
    Status: null,
    AssignedTo: [],
  } as unknown as Partial<FieldSet>;
  await feedbacksTable.update([{ id, fields }]);
}

/* -------------------------------------------------------------- Votes -- */

export type VoteRecord = {
  id: string;
  feedbackId: string | null;
  userId: string | null;
};

function mapVote(r: AirtableRecord): VoteRecord {
  const f = r.fields as Record<string, unknown>;
  const feedbackIds = (f.Feedback as string[] | undefined) ?? [];
  const userIds = (f.User as string[] | undefined) ?? [];
  return {
    id: r.id,
    feedbackId: feedbackIds[0] ?? null,
    userId: userIds[0] ?? null,
  };
}

export async function findVote(input: {
  feedbackId: string;
  userId: string;
}): Promise<VoteRecord | null> {
  const formula = `AND({FeedbackId} = '${input.feedbackId}', {UserId} = '${input.userId}')`;
  const records = await votesTable
    .select({ filterByFormula: formula, maxRecords: 1 })
    .firstPage();
  return records.length ? mapVote(records[0]) : null;
}

export async function createVote(input: {
  feedbackId: string;
  userId: string;
}): Promise<VoteRecord> {
  const created = await votesTable.create([
    {
      fields: {
        Feedback: [input.feedbackId],
        User: [input.userId],
        FeedbackId: input.feedbackId,
        UserId: input.userId,
        CreatedAt: nowIso(),
      },
    },
  ]);
  return mapVote(created[0]);
}

/* ------------------------------------------------------ Notifications -- */

export type NotificationRecord = {
  id: string;
  recipientId: string | null;
  feedbackId: string | null;
  status: FeedbackStatus | null;
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
    status: (f.Status as FeedbackStatus | undefined) ?? null,
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
      pageSize: 100,
    })
    .all();
  const notifs = records.map(mapNotification);
  if (notifs.length === 0) return [];

  // Enrich each notif with its feedback (also fetches creator/assignee names)
  const feedbackIds = Array.from(
    new Set(notifs.map((n) => n.feedbackId).filter((id): id is string => Boolean(id))),
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
  status: FeedbackStatus;
}): Promise<void> {
  const existing = await notificationsTable
    .select({
      filterByFormula: `AND({RecipientId} = '${input.recipientId}', {FeedbackId} = '${input.feedbackId}')`,
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

export async function deleteAllNotifications(recipientId: string): Promise<void> {
  const records = await notificationsTable
    .select({
      filterByFormula: `{RecipientId} = '${recipientId}'`,
      pageSize: 100,
    })
    .all();
  if (records.length === 0) return;
  // Airtable destroy max 10 per call
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
      filterByFormula: `AND({RecipientId} = '${recipientId}', {FeedbackId} = '${feedbackId}')`,
      maxRecords: 5,
    })
    .firstPage();
  if (records.length === 0) return;
  await notificationsTable.destroy(records.map((r) => r.id));
}

/* ----------------------------------------------------------- Comments -- */

export type CommentRecord = {
  id: string;
  feedbackId: string | null;
  authorId: string | null;
  body: string;
  createdAt: string;
};

export type CommentWithAuthor = CommentRecord & {
  authorName: string;
};

function mapComment(r: AirtableRecord): CommentRecord {
  const f = r.fields as Record<string, unknown>;
  const feedbackIds = (f.Feedback as string[] | undefined) ?? [];
  const authorIds = (f.Author as string[] | undefined) ?? [];
  return {
    id: r.id,
    feedbackId: feedbackIds[0] ?? null,
    authorId: authorIds[0] ?? null,
    body: String(f.Body ?? ""),
    createdAt: String(f.CreatedAt ?? ""),
  };
}

export async function listComments(
  feedbackId: string,
): Promise<CommentWithAuthor[]> {
  const records = await commentsTable
    .select({
      filterByFormula: `{FeedbackId} = '${feedbackId}'`,
      sort: [{ field: "CreatedAt", direction: "asc" }],
      pageSize: 100,
    })
    .all();
  const comments = records.map(mapComment);
  if (comments.length === 0) return [];

  const authorIds = comments
    .map((c) => c.authorId)
    .filter((id): id is string => Boolean(id));
  const users = await getUsersByIds(authorIds);
  const byId = new Map(users.map((u) => [u.id, u.name]));
  return comments.map((c) => ({
    ...c,
    authorName: c.authorId ? (byId.get(c.authorId) ?? "Anonyme") : "Anonyme",
  }));
}

export async function createComment(input: {
  feedbackId: string;
  authorId: string;
  body: string;
}): Promise<CommentRecord> {
  const created = await commentsTable.create([
    {
      fields: {
        Feedback: [input.feedbackId],
        Author: [input.authorId],
        FeedbackId: input.feedbackId,
        AuthorId: input.authorId,
        Body: input.body,
        CreatedAt: nowIso(),
      },
    },
  ]);
  return mapComment(created[0]);
}
