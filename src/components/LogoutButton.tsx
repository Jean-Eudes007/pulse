"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Déconnecté");
    router.refresh();
    router.push("/");
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
