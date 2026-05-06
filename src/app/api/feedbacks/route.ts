import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createFeedback, listFeedbacks } from "@/lib/airtable";
import { parseJsonBody, requireAuth } from "@/lib/api-helpers";
import { createFeedbackSchema } from "@/lib/schemas";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const feedbacks = await listFeedbacks();
  return NextResponse.json({ feedbacks });
}

export async function POST(request: Request) {
  const auth = await requireAuth({ verified: true });
  if (auth.error) return auth.error;
  const { user } = auth;

  const parsed = await parseJsonBody(request, createFeedbackSchema);
  if (parsed.error) return parsed.error;

  const feedback = await createFeedback({
    ...parsed.data,
    creatorId: user.id,
  });
  revalidateTag("feedbacks", "max");

  return NextResponse.json({ feedback }, { status: 201 });
}
