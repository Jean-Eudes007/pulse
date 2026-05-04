import Link from "next/link";
import { notFound } from "next/navigation";
import { TypeBadge } from "@/components/TypeBadge";
import { findVote, getFeedbackById } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { FeedbackActions } from "./FeedbackActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FeedbackDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [feedback, currentUser] = await Promise.all([
    getFeedbackById(id),
    getCurrentUser(),
  ]);

  if (!feedback) notFound();

  const hasVoted = currentUser
    ? Boolean(await findVote({ feedbackId: id, userId: currentUser.id }))
    : false;

  const isCreator = currentUser?.id === feedback.creatorId;
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/feedbacks"
        className="text-sm text-text-secondary hover:text-text-primary inline-block mb-4"
      >
        ← Retour à la liste
      </Link>

      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-8">
        <h1 className="text-lg font-medium text-text-primary mb-4">
          {feedback.title}
        </h1>

        <div className="flex flex-wrap gap-6 mb-6 text-sm">
          <div>
            <div className="text-[11px] uppercase text-text-tertiary mb-1">
              Type
            </div>
            <TypeBadge type={feedback.type} />
          </div>
          <div>
            <div className="text-[11px] uppercase text-text-tertiary mb-1">
              Créé par
            </div>
            <div className="font-medium text-text-primary">
              {feedback.creatorName}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-text-tertiary mb-1">
              Votes
            </div>
            <div className="font-medium text-text-primary tabular-nums">
              {feedback.voteCount}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-text-tertiary mb-1">
              Date
            </div>
            <div className="font-medium text-text-primary">
              {formatDate(feedback.createdAt)}
            </div>
          </div>
        </div>

        <div className="border-t border-border-tertiary pt-6 mb-6">
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {feedback.description}
          </p>
        </div>

        <FeedbackActions
          feedbackId={feedback.id}
          initialVoteCount={feedback.voteCount}
          initialHasVoted={hasVoted}
          isAuthenticated={Boolean(currentUser)}
          isCreator={isCreator}
          isAdmin={isAdmin}
          initialTitle={feedback.title}
          initialDescription={feedback.description}
          initialType={feedback.type}
        />

        <p className="text-[11px] text-text-tertiary text-center mt-6">
          Modifier/Supprimer visibles si Creator = Current User
        </p>
      </div>
    </div>
  );
}
