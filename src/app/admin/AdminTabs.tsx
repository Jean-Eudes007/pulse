import Link from "next/link";

export type AdminTab = "overview" | "list";

const TABS: { id: AdminTab; label: string; href: string }[] = [
  { id: "overview", label: "Vue d'ensemble", href: "/admin" },
  { id: "list", label: "Liste & modération", href: "/admin?tab=list" },
];

export function AdminTabs({ active }: { active: AdminTab }) {
  return (
    <nav
      aria-label="Sections admin"
      className="border-b border-border-tertiary -mx-1 mb-6"
    >
      <ul className="flex gap-1 overflow-x-auto" role="tablist">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <li key={t.id}>
              <Link
                href={t.href}
                role="tab"
                aria-selected={isActive}
                className={`block px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-action text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
