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

export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus | null,
): Promise<void> {
  await feedbacksTable.update([
    { id, fields: { Status: status ?? null } },
  ]);
}

export async function assignFeedback(
  id: string,
  userId: string | null,
): Promise<void> {
  await feedbacksTable.update([
    { id, fields: { AssignedTo: userId ? [userId] : [] } },
  ]);
}

export async function sendToBacklog(id: string): Promise<void> {
  await feedbacksTable.update([
    { id, fields: { Status: "to_do", AssignedTo: [] } },
  ]);
}

export async function removeFromBacklog(id: string): Promise<void> {
  await feedbacksTable.update([
    { id, fields: { Status: null, AssignedTo: [] } },
  ]);
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
