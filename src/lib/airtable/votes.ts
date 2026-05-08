import { type AirtableRecord, nowIso, votesTable } from "./client";

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
  const formula = `AND({feedbackid} = '${input.feedbackId}', {UserId} = '${input.userId}')`;
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
        feedbackid: input.feedbackId,
        UserId: input.userId,
        CreatedAt: nowIso(),
      },
    },
  ]);
  return mapVote(created[0]);
}
