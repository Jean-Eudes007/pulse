import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  getFeedbackById,
  setFeedbackStatus,
  upsertNotification,
} from "@/lib/airtable";
import { parseJsonBody, requireAuth } from "@/lib/api-helpers";
import { STATUS_TRANSITIONS, statusUpdateSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ role: ["dev", "admin"] });
  if (auth.error) return auth.error;
  const { user } = auth;

  const parsed = await parseJsonBody(request, statusUpdateSchema);
  if (parsed.error) return parsed.error;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

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
