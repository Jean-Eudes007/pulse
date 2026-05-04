import { NextResponse } from "next/server";
import {
  assignFeedback,
  getFeedbackById,
  setFeedbackStatus,
} from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Dev "takes" a feedback from the backlog: assigns to self + moves to in_progress.
 * Only allowed if current status is "to_do".
 */
export async function POST(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "dev") {
    return NextResponse.json(
      { error: "Seuls les développeurs peuvent prendre un ticket" },
      { status: 403 },
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
  if (feedback.status !== "to_do") {
    return NextResponse.json(
      { error: "Ce ticket n'est pas disponible (statut requis : to_do)" },
      { status: 409 },
    );
  }

  await assignFeedback(id, user.id);
  await setFeedbackStatus(id, "in_progress");

  return NextResponse.json({
    ok: true,
    status: "in_progress",
    assignedToId: user.id,
  });
}
