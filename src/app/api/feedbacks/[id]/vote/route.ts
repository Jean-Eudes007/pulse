import { NextResponse } from "next/server";
import {
  createVote,
  findVote,
  getFeedbackById,
  incrementVoteCount,
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

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback introuvable" },
      { status: 404 },
    );
  }

  const existing = await findVote({ feedbackId: id, userId: user.id });
  if (existing) {
    return NextResponse.json(
      { error: "Vous avez déjà voté pour ce feedback" },
      { status: 409 },
    );
  }

  await createVote({ feedbackId: id, userId: user.id });
  await incrementVoteCount(id, feedback.voteCount);

  return NextResponse.json({
    voteCount: feedback.voteCount + 1,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ hasVoted: false }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await findVote({ feedbackId: id, userId: user.id });
  return NextResponse.json({ hasVoted: Boolean(existing) });
}
