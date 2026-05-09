import { AIRTABLE_PAGE_SIZE } from "../config";
import { type AirtableRecord, commentsTable, nowIso } from "./client";
import { getUsersByIds } from "./users";

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
    body: String(f.body ?? ""),
    createdAt: String(f.CreatedAt ?? ""),
  };
}

export async function listComments(
  feedbackId: string,
): Promise<CommentWithAuthor[]> {
  const records = await commentsTable
    .select({
      filterByFormula: `{feedbackid} = '${feedbackId}'`,
      sort: [{ field: "CreatedAt", direction: "asc" }],
      pageSize: AIRTABLE_PAGE_SIZE,
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
        feedbackid: input.feedbackId,
        authorid: input.authorId,
        body: input.body,
        CreatedAt: nowIso(),
      },
    },
  ]);
  return mapComment(created[0]);
}