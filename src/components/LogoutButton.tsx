"use client";

import { useApiMutation } from "@/lib/useApiMutation";

export function LogoutButton() {
  const { mutate, pending } = useApiMutation();

  async function handleClick() {
    await mutate(
      "/api/auth/logout",
      { method: "POST" },
      { successMessage: "Déconnecté", refresh: false },
    );
    // Full reload so server components re-render without the auth cookie
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-border-secondary bg-transparent px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:opacity-50"
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}
