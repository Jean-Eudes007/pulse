import { unstable_cache } from "next/cache";
import { AIRTABLE_PAGE_SIZE } from "../config";
import type { FeedbackStatus, FeedbackType } from "../schemas";
import {
  type AirtableRecord,
  type FieldSet,
  feedbacksTable,
  nowIso,
} from "./client";
import { getUsersByIds } from "./users";

// P-4 audit: cache the heavy list reads so /feedbacks, /admin and /dev
// don't refetch from Airtable on every navigation. Pages stay dynamic
// (Header reads cookies()) but the data fetches are deduplicated across
// requests until a mutation calls revalidateTag("feedbacks").
const FEEDBACKS_TAG = "feedbacks";

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

export function mapFeedback(r: AirtableRecord): FeedbackRecord {
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

export async function enrichWithUsers(
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

export const listFeedbacks = unstable_cache(
  async function listFeedbacks(): Promise<FeedbackWithCreator[]> {
    const records = await feedbacksTable
      .select({
        sort: [{ field: "VoteCount", direction: "desc" }],
        pageSize: AIRTABLE_PAGE_SIZE,
      })
      .all();
    const feedbacks = records.map(mapFeedback);
    return enrichWithUsers(feedbacks);
  },
  ["feedbacks-list"],
  { tags: [FEEDBACKS_TAG] },
);

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
  await feedbacksTable.update([{ id, fields: { VoteCount: current + 1 } }]);
}

export const listBacklogFeedbacks = unstable_cache(
  async function listBacklogFeedbacks(): Promise<FeedbackWithCreator[]> {
    const records = await feedbacksTable
      .select({
        filterByFormula: `{Status} != ''`,
        sort: [{ field: "VoteCount", direction: "desc" }],
        pageSize: AIRTABLE_PAGE_SIZE,
      })
      .all();
    const feedbacks = records.map(mapFeedback);
    return enrichWithUsers(feedbacks);
  },
  ["feedbacks-backlog"],
  { tags: [FEEDBACKS_TAG] },
);

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
