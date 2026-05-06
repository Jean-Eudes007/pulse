import { NextResponse } from "next/server";
import {
  deleteFeedback,
  getFeedbackById,
  updateFeedback,
} from "@/lib/airtable";
import { parseJsonBody, requireAuth } from "@/lib/api-helpers";
import { updateFeedbackSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }
  return NextResponse.json({ feedback });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }

  if (feedback.creatorId !== user.id) {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, updateFeedbackSchema);
  if (parsed.error) return parsed.error;

  const updated = await updateFeedback(id, parsed.data);
  return NextResponse.json({ feedback: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }

  const isCreator = feedback.creatorId === user.id;
  const isAdmin = user.role === "admin";
  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  await deleteFeedback(id);
  return NextResponse.json({ ok: true });
}
