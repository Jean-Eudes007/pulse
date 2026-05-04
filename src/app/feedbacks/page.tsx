import { redirect } from "next/navigation";
import { NotificationBanner } from "@/components/NotificationBanner";
import { listFeedbacks } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { FeedbacksList } from "./FeedbacksList";

export const dynamic = "force-dynamic";

export default async function FeedbacksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/feedbacks");

  const feedbacks = await listFeedbacks();

  return (
    <div className="max-w-3xl mx-auto">
      <NotificationBanner />
      <FeedbacksList feedbacks={feedbacks} currentUserId={user.id} />
    </div>
  );
}
