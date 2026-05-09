import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { LanguageToggle } from "./LanguageToggle";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-border-tertiary bg-bg-primary">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-18 flex items-center justify-between gap-2">
        <Link
          href={user ? "/feedbacks" : "/"}
          className="text-lg font-bold text-text-primary shrink-0"
        >
          Pulse
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          {user && (
            <Link
              href="/feedbacks"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Liste
            </Link>
          )}
          {user && (
            <Link
              href="/submit"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Soumettre
            </Link>
          )}
          {(user?.role === "dev" || user?.role === "admin") && (
            <Link
              href="/dev"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Kanban
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-2">
              <span className="text-text-tertiary text-xs hidden md:inline">
                {user.email}
              </span>
              <LogoutButton />
              <LanguageToggle />
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:ml-2">
              <Link
                href="/login"
                className="rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-action px-2 sm:px-3 py-1.5 text-sm font-medium text-text-info hover:bg-action-hover transition-colors"
              >
                Inscription
              </Link>
              <LanguageToggle />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}