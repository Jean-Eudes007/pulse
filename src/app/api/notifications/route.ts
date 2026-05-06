import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteAllNotifications,
  deleteNotificationForFeedback,
  listNotifications,
} from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const notifications = await listNotifications(user.id);
  return NextResponse.json({ notifications });
}

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const url = new URL(request.url);
  const feedbackId = url.searchParams.get("feedbackId");

  if (feedbackId) {
    await deleteNotificationForFeedback(user.id, feedbackId);
  } else {
    await deleteAllNotifications(user.id);
  }

  revalidatePath("/feedbacks");
  return NextResponse.json({ ok: true });
}
