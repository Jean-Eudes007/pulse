"use client";

import Link from "next/link";
import { useState } from "react";
import { useApiMutation } from "@/lib/useApiMutation";

export default function ForgotPasswordPage() {
  const { mutate, pending } = useApiMutation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await mutate(
      "/api/auth/forgot-password",
      { method: "POST", json: { email } },
      { toastError: false, refresh: false, errorMessage: "Erreur" },
    );
    if (res.ok) setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
        <h1 className="text-xl font-medium mb-3">Vérifiez votre email</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Si un compte existe pour <span className="font-medium">{email}</span>,
          un email de réinitialisation vient d'être envoyé. Le lien expire dans
          1 heure.
        </p>
        <p className="text-xs text-text-tertiary mt-6">
          Pas d'email reçu ? Vérifiez votre dossier spam, ou{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="underline text-text-primary"
          >
            réessayez avec une autre adresse
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
      <h1 className="text-xl font-medium mb-2">Mot de passe oublié</h1>
      <p className="text-sm text-text-secondary mb-6">
        Saisissez votre email, nous vous enverrons un lien pour choisir un
        nouveau mot de passe.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-action text-text-info py-2.5 text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Envoyer le lien"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        <Link
          href="/login"
          className="text-text-primary font-medium hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
