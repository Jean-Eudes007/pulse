import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getFeedbackById,
  setFeedbackStatus,
  upsertNotification,
} from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_TRANSITIONS, statusUpdateSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "dev" && user.role !== "admin") {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

  // Validate transition
  const current = feedback.status;
  if (!current) {
    return NextResponse.json(
      { error: "Le feedback n'est pas dans le backlog" },
      { status: 409 },
    );
  }
  const next = parsed.data.status;
  if (current === next) {
    return NextResponse.json({ ok: true, status: next });
  }
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    return NextResponse.json(
      { error: `Transition ${current} → ${next} non autorisée` },
      { status: 409 },
    );
  }

  await setFeedbackStatus(id, next);

  // Notify the creator (unless they're the one moving the ticket)
  if (feedback.creatorId && feedback.creatorId !== user.id) {
    await upsertNotification({
      recipientId: feedback.creatorId,
      feedbackId: id,
      status: next,
    });
  }

  revalidatePath("/feedbacks");
  revalidatePath("/dev");
  return NextResponse.json({ ok: true, status: next });
}
