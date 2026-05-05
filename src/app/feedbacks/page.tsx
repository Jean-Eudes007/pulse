import { redirect } from "next/navigation";
import { NotificationBanner } from "@/components/NotificationBanner";
import { listFeedbacks, listNotifications } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { FeedbacksList } from "./FeedbacksList";

export const dynamic = "force-dynamic";

export default async function FeedbacksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/feedbacks");

  const [feedbacks, notifications] = await Promise.all([
    listFeedbacks(),
    listNotifications(user.id),
  ]);

  // Only feedbacks with a pending notification get the highlight
  const notifiedFeedbackIds = new Set(
    notifications
      .map((n) => n.feedbackId)
      .filter((id): id is string => Boolean(id)),
  );

  return (
    <div className="max-w-3xl mx-auto">
      <NotificationBanner />
      <FeedbacksList
        feedbacks={feedbacks}
        currentUserId={user.id}
        notifiedFeedbackIds={notifiedFeedbackIds}
      />
    </div>
  );
}
