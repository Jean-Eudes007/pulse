"use client";

import { useState } from "react";
import { toast } from "sonner";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Déconnecté");
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
