import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteNotificationForFeedback,
  getFeedbackById,
  removeFromBacklog,
  sendToBacklog,
  upsertNotification,
} from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ role: "admin" });
  if (auth.error) return auth.error;
  const { user } = auth;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

  await sendToBacklog(id);

  if (feedback.creatorId && feedback.creatorId !== user.id) {
    await upsertNotification({
      recipientId: feedback.creatorId,
      feedbackId: id,
      status: "to_do",
    });
  }

  revalidatePath("/feedbacks");
  revalidatePath("/admin");
  revalidatePath("/dev");
  return NextResponse.json({ ok: true, status: "to_do" });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth({ role: "admin" });
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

  await removeFromBacklog(id);

  if (feedback.creatorId) {
    await deleteNotificationForFeedback(feedback.creatorId, id);
  }

  revalidatePath("/feedbacks");
  revalidatePath("/admin");
  revalidatePath("/dev");
  return NextResponse.json({ ok: true });
}
