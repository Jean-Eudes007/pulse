import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteNotificationForFeedback,
  getFeedbackById,
  removeFromBacklog,
  sendToBacklog,
  upsertNotification,
} from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

  await sendToBacklog(id);

  // Notify the creator (skip if creator IS the admin doing the action)
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

  await removeFromBacklog(id);

  // Drop any existing notification for the creator
  if (feedback.creatorId) {
    await deleteNotificationForFeedback(feedback.creatorId, id);
  }

  revalidatePath("/feedbacks");
  revalidatePath("/admin");
  revalidatePath("/dev");
  return NextResponse.json({ ok: true });
}
