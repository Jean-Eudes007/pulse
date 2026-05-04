import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border-tertiary bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/feedbacks"
          className="text-base font-semibold text-text-primary"
        >
          Pulse
        </Link>

        <nav className="flex items-center gap-4 text-sm">
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
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <span className="text-text-tertiary text-xs hidden sm:inline">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-action px-3 py-1.5 text-sm font-medium text-text-info hover:bg-action-hover transition-colors"
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
