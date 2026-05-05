import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteFeedback,
  getFeedbackById,
  updateFeedback,
} from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { updateFeedbackSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }
  return NextResponse.json({ feedback });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }

  if (feedback.creatorId !== user.id) {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const updated = await updateFeedback(id, parsed.data);
  return NextResponse.json({ feedback: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

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
