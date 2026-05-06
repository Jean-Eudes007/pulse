import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  assignFeedback,
  getFeedbackById,
  setFeedbackStatus,
  upsertNotification,
} from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Dev "takes" a feedback from the backlog: assigns to self + moves to in_progress.
 * Only allowed if current status is "to_do".
 */
export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ role: "dev" });
  if (auth.error) {
    // Keep the friendlier French message for the dev-only constraint
    if (auth.error.status === 403) {
      return NextResponse.json(
        { error: "Seuls les développeurs peuvent prendre un ticket" },
        { status: 403 },
      );
    }
    return auth.error;
  }
  const { user } = auth;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }
  if (feedback.status !== "to_do") {
    return NextResponse.json(
      { error: "Ce ticket n'est pas disponible (statut requis : to_do)" },
      { status: 409 },
    );
  }

  await assignFeedback(id, user.id);
  await setFeedbackStatus(id, "in_progress");

  if (feedback.creatorId && feedback.creatorId !== user.id) {
    await upsertNotification({
      recipientId: feedback.creatorId,
      feedbackId: id,
      status: "in_progress",
    });
  }

  revalidatePath("/feedbacks");
  revalidatePath("/dev");
  return NextResponse.json({
    ok: true,
    status: "in_progress",
    assignedToId: user.id,
  });
}
