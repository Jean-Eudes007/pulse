import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteAllNotifications,
  deleteNotificationForFeedback,
  listNotifications,
} from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";

/**
 * Lists current user's pending notifications (status changes on their
 * own feedbacks they haven't acknowledged yet).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const notifications = await listNotifications(user.id);
  return NextResponse.json({ notifications });
}

/**
 * Marks notifications as seen.
 * - DELETE /api/notifications → marks all as seen (banner dismiss)
 * - DELETE /api/notifications?feedbackId=rec123 → marks one as seen
 *   (called when user visits the feedback detail)
 */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const url = new URL(request.url);
  const feedbackId = url.searchParams.get("feedbackId");

  if (feedbackId) {
    await deleteNotificationForFeedback(user.id, feedbackId);
  } else {
    await deleteAllNotifications(user.id);
  }

  // Invalidate the /feedbacks server cache so the banner refetches fresh
  revalidatePath("/feedbacks");

  return NextResponse.json({ ok: true });
}
