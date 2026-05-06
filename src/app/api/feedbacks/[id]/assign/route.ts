import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  assignFeedback,
  getFeedbackById,
  getUserById,
} from "@/lib/airtable";
import { parseJsonBody, requireAuth } from "@/lib/api-helpers";
import { assignSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ role: "admin" });
  if (auth.error) return auth.error;

  const parsed = await parseJsonBody(request, assignSchema);
  if (parsed.error) return parsed.error;

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
  revalidateTag("feedbacks", "max");
  revalidatePath("/dev");
  return NextResponse.json({ ok: true, assignedToId: targetUserId });
}
