"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useApiMutation } from "@/lib/useApiMutation";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { mutate, pending } = useApiMutation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const res = await mutate(
      "/api/auth/reset-password",
      { method: "POST", json: { token, password } },
      { toastError: false, refresh: false, errorMessage: "Erreur" },
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success("Mot de passe mis à jour");
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8 text-center">
        <h1 className="text-lg font-semibold text-text-primary mb-2">
          ✅ Mot de passe mis à jour
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-action text-text-info px-4 py-2 text-sm font-medium hover:bg-action-hover transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
      <h1 className="text-xl font-medium mb-6">Nouveau mot de passe</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
          />
          <p className="text-xs text-text-tertiary mt-1">
            Minimum 10 caractères
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-type-bug-text bg-type-bug-bg rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="w-full rounded-md bg-action text-text-info py-2.5 text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}
