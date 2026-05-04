import { NextResponse } from "next/server";
import {
  getFeedbackById,
  removeFromBacklog,
  sendToBacklog,
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
  return NextResponse.json({ ok: true });
}
