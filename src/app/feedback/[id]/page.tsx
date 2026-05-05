import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkSeenOnMount } from "@/components/MarkSeenOnMount";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { findVote, getFeedbackById, listComments } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { CommentForm } from "./CommentForm";
import { FeedbackActions } from "./FeedbackActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function FeedbackDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [feedback, currentUser, comments] = await Promise.all([
    getFeedbackById(id),
    getCurrentUser(),
    listComments(id),
  ]);

  if (!feedback) notFound();

  const hasVoted = currentUser
    ? Boolean(await findVote({ feedbackId: id, userId: currentUser.id }))
    : false;

  const isCreator = currentUser?.id === feedback.creatorId;
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="max-w-3xl mx-auto">
      {isCreator && <MarkSeenOnMount feedbackId={feedback.id} />}
      <Link
        href="/feedbacks"
        className="text-sm text-text-secondary hover:text-text-primary inline-block mb-4"
      >
        ← Retour à la liste
      </Link>

      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
        <h1 className="text-lg font-medium text-text-primary mb-4">
          {feedback.title}
        </h1>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-3 sm:gap-6 mb-6 text-sm">
          <div>
            <div className="text-[11px] uppercase text-text-tertiary mb-1">
              Type
            </div>
            <TypeBadge type={feedback.type} />
          </div>
          {feedback.status && (
            <div>
              <div className="text-[11px] uppercase text-text-tertiary mb-1">
                Statut
              </div>
              <StatusBadge status={feedback.status} />
            </div>
          )}
          <div>
            <div className="text-[11px] uppercase text-text-tertiary mb-1">
              Créé par
            </div>
            <div className="font-medium text-text-primary">
              {feedback.creatorName}
            </div>
          </div>
          {feedback.assignedToName && (
            <div>
              <div className="text-[11px] uppercase text-text-tertiary mb-1">
                Assigné à
              </div>
              <div className="font-medium text-text-primary">
                {feedback.assignedToName}
              </div>
            </div>
          )}
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

      {/* Comments */}
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8 mt-4">
        <h2 className="text-base font-semibold text-text-primary mb-4">
          Commentaires {comments.length > 0 && (
            <span className="text-text-tertiary font-normal">
              ({comments.length})
            </span>
          )}
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-text-secondary mb-6">
            Aucun commentaire pour le moment. Sois le premier à réagir.
          </p>
        ) : (
          <ul className="space-y-4 mb-6">
            {comments.map((c) => (
              <li
                key={c.id}
                className="border-l-2 border-border-tertiary pl-4"
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-text-primary">
                    {c.authorName}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}

        {currentUser && <CommentForm feedbackId={feedback.id} />}
      </div>
    </div>
  );
}
