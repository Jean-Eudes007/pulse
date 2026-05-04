import { redirect } from "next/navigation";
import {
  listBacklogFeedbacks,
  listDevs,
  type FeedbackWithCreator,
  type UserRecord,
} from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";
import { Kanban } from "./Kanban";

export const dynamic = "force-dynamic";

export default async function DevPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dev");
  if (user.role !== "dev" && user.role !== "admin") redirect("/feedbacks");

  const [feedbacks, devs] = await Promise.all([
    listBacklogFeedbacks(),
    user.role === "admin" ? listDevs() : Promise.resolve([] as UserRecord[]),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <Kanban
        feedbacks={feedbacks satisfies FeedbackWithCreator[]}
        currentUserId={user.id}
        currentUserRole={user.role}
        devs={devs.map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
