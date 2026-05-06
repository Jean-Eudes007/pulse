"use client";

import { useState } from "react";
import { useApiMutation } from "@/lib/useApiMutation";

// Shown on every authenticated page until the user verifies their
// email. Uses useApiMutation so the toast/error path is consistent with
// the rest of the app.
export function VerificationBanner({ email }: { email: string }) {
  const { mutate, pending } = useApiMutation();
  const [sent, setSent] = useState(false);

  async function handleResend() {
    const res = await mutate(
      "/api/auth/resend-verification",
      { method: "POST" },
      {
        successMessage: "Email de vérification renvoyé",
        refresh: false,
      },
    );
    if (res.ok) setSent(true);
  }

  return (
    <div className="bg-info-bg border border-info-border rounded-lg p-3 sm:p-4 mb-4 flex items-start sm:items-center justify-between gap-3 flex-wrap">
      <p className="text-sm text-info-text">
        ⚠️ Email <span className="font-medium">{email}</span> non vérifié.
        Cliquez sur le lien dans l'email reçu à l'inscription pour activer
        votre compte.
      </p>
      <button
        type="button"
        onClick={handleResend}
        disabled={pending || sent}
        className="shrink-0 rounded-md border border-info-border bg-bg-primary text-text-primary px-3 py-1.5 text-xs font-medium hover:bg-bg-secondary transition-colors disabled:opacity-50"
      >
        {sent ? "Envoyé ✓" : pending ? "Envoi…" : "Renvoyer l'email"}
      </button>
    </div>
  );
}
