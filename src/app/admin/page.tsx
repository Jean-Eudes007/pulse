import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminList } from "./AdminList";
import { AdminOverview } from "./AdminOverview";
import { type AdminTab, AdminTabs } from "./AdminTabs";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (user.role !== "admin") redirect("/feedbacks");

  const { tab } = await searchParams;
  // Anything other than the explicit "list" value falls back to the
  // default overview tab — keeps /admin clean and shareable.
  const active: AdminTab = tab === "list" ? "list" : "overview";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
          <h1 className="text-lg font-semibold text-text-primary">
            Dashboard Admin
          </h1>
          <Link
            href="/dev"
            className="text-xs text-text-secondary hover:text-text-primary underline"
          >
            Voir le kanban →
          </Link>
        </div>
        <p className="text-xs text-text-tertiary mb-5">
          {active === "overview"
            ? "Vue d'ensemble de l'activité Pulse"
            : "Modérer les feedbacks et envoyer au backlog"}
        </p>

        <AdminTabs active={active} />

        {active === "overview" ? <AdminOverview /> : <AdminList />}
      </div>
    </div>
  );
}
