import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createComment,
  getFeedbackById,
  listComments,
  upsertNotification,
} from "@/lib/airtable";
import { parseJsonBody, requireAuth } from "@/lib/api-helpers";
import { createCommentSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const comments = await listComments(id);
  return NextResponse.json({ comments });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const parsed = await parseJsonBody(request, createCommentSchema);
  if (parsed.error) return parsed.error;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

  const comment = await createComment({
    feedbackId: id,
    authorId: user.id,
    body: parsed.data.body,
  });

  if (feedback.creatorId && feedback.creatorId !== user.id) {
    await upsertNotification({
      recipientId: feedback.creatorId,
      feedbackId: id,
      status: "comment",
    });
  }

  revalidatePath(`/feedback/${id}`);
  revalidatePath("/feedbacks");

  return NextResponse.json({ comment }, { status: 201 });
}
