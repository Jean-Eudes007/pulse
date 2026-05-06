import Link from "next/link";
import { getUsersByIds, listFeedbacks } from "@/lib/airtable";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from "@/lib/schemas";
import { AnalyticsCharts } from "./analytics/AnalyticsCharts";

// Default tab on /admin — gives admins a high-signal landing view
// (KPIs + charts + tops) before they jump into the moderation list.
export async function AdminOverview() {
  const feedbacks = await listFeedbacks();

  const totalFeedbacks = feedbacks.length;
  const totalVotes = feedbacks.reduce((sum, f) => sum + f.voteCount, 0);
  const inBacklog = feedbacks.filter((f) => f.status !== null).length;
  const done = feedbacks.filter((f) => f.status === "done").length;

  const typeCounts = FEEDBACK_TYPES.map((type) => ({
    name: type,
    value: feedbacks.filter((f) => f.type === type).length,
  }));

  const statusCounts = FEEDBACK_STATUSES.map((status) => ({
    name: status,
    value: feedbacks.filter((f) => f.status === status).length,
  }));

  const top5 = [...feedbacks]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 5);

  const contributorCounts = new Map<string, number>();
  for (const f of feedbacks) {
    if (f.creatorId)
      contributorCounts.set(
        f.creatorId,
        (contributorCounts.get(f.creatorId) ?? 0) + 1,
      );
  }
  const topContributorIds = Array.from(contributorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topContributorUsers = await getUsersByIds(
    topContributorIds.map(([id]) => id),
  );
  const topContributorsByName = new Map(
    topContributorUsers.map((u) => [u.id, u.name]),
  );
  const topContributors = topContributorIds.map(([id, count]) => ({
    name: topContributorsByName.get(id) ?? "Anonyme",
    count,
  }));

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiTile label="Feedbacks" value={totalFeedbacks} emoji="📝" />
        <KpiTile label="Votes" value={totalVotes} emoji="⭐" />
        <KpiTile label="Dans backlog" value={inBacklog} emoji="📌" />
        <KpiTile label="Livrés" value={done} emoji="✅" />
      </div>

      <AnalyticsCharts typeCounts={typeCounts} statusCounts={statusCounts} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Top 5 feedbacks par votes
          </h2>
          <ol className="space-y-2">
            {top5.map((f, i) => (
              <li key={f.id} className="flex items-center gap-3 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-bg-secondary text-text-secondary text-xs font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <Link
                  href={`/feedback/${f.id}`}
                  className="flex-1 text-text-primary hover:underline truncate"
                  title={f.title}
                >
                  {f.title}
                </Link>
                <span className="text-text-secondary tabular-nums shrink-0">
                  {f.voteCount} ⭐
                </span>
              </li>
            ))}
            {top5.length === 0 && (
              <li className="text-sm text-text-tertiary">Aucune donnée</li>
            )}
          </ol>
        </div>

        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            Top contributeurs
          </h2>
          <ol className="space-y-2">
            {topContributors.map((c, i) => (
              <li key={c.name} className="flex items-center gap-3 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-bg-secondary text-text-secondary text-xs font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="flex-1 text-text-primary">{c.name}</span>
                <span className="text-text-secondary tabular-nums shrink-0">
                  {c.count} feedback{c.count > 1 ? "s" : ""}
                </span>
              </li>
            ))}
            {topContributors.length === 0 && (
              <li className="text-sm text-text-tertiary">Aucune donnée</li>
            )}
          </ol>
        </div>
      </div>
    </>
  );
}

function KpiTile({
  label,
  value,
  emoji,
}: {
  label: string;
  value: number;
  emoji: string;
}) {
  return (
    <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-text-tertiary mb-1">
        <span aria-hidden>{emoji}</span>
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-text-primary tabular-nums">
        {value}
      </div>
    </div>
  );
}
