import { NextResponse } from "next/server";
import { z } from "zod";
import { createFeedback, listFeedbacks } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { createFeedbackSchema } from "@/lib/schemas";

export async function GET() {
  const feedbacks = await listFeedbacks();
  return NextResponse.json({ feedbacks });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const feedback = await createFeedback({
    ...parsed.data,
    creatorId: user.id,
  });

  return NextResponse.json({ feedback }, { status: 201 });
}
