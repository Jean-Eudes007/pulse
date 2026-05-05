import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assignFeedback,
  getFeedbackById,
  getUserById,
} from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { assignSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = assignSchema.safeParse(body);
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

  const targetUserId = parsed.data.userId;
  if (targetUserId) {
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur cible introuvable" },
        { status: 404 },
      );
    }
    if (targetUser.role !== "dev") {
      return NextResponse.json(
        { error: "Seuls les développeurs peuvent être assignés" },
        { status: 400 },
      );
    }
  }

  await assignFeedback(id, targetUserId);
  revalidatePath("/dev");
  return NextResponse.json({ ok: true, assignedToId: targetUserId });
}
