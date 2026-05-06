import { NextResponse } from "next/server";
import {
  createVote,
  findVote,
  getFeedbackById,
  incrementVoteCount,
} from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const limited = await rateLimit(request, { name: "vote", max: 20, window: "1 m" });
  if (limited) return limited;

  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

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

  return NextResponse.json({ voteCount: feedback.voteCount + 1 });
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) {
    // Return 401 with hasVoted: false to keep client logic simple
    return NextResponse.json({ hasVoted: false }, { status: 401 });
  }
  const { user } = auth;

  const { id } = await context.params;
  const existing = await findVote({ feedbackId: id, userId: user.id });
  return NextResponse.json({ hasVoted: Boolean(existing) });
}
