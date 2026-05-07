"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useApiMutation } from "@/lib/useApiMutation";

export function LoginForm() {
  const search = useSearchParams();
  const rawRedirect = search.get("redirect");
  // Open-redirect guard: only accept internal relative paths (start with single "/")
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/feedbacks";

  const { mutate, pending } = useApiMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const res = await mutate(
      "/api/auth/login",
      { method: "POST", json: { email, password } },
      { toastError: false, refresh: false, errorMessage: "Erreur de connexion" },
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success("Connexion réussie");
    // Full reload to refresh Server Components (Header) reading the new cookie
    window.location.href = redirectTo;
  }

  return (
    <div className="max-w-md mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
      <h1 className="text-xl font-medium mb-6">Connexion</h1>
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
            inputMode="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
          />
        </div>
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
          />
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
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="text-center text-sm text-text-secondary mt-6 space-y-2">
        <p>
          <Link
            href="/forgot-password"
            className="text-text-secondary hover:text-text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </p>
        <p>
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="text-text-primary font-medium hover:underline"
          >
            Inscription
          </Link>
        </p>
      </div>
    </div>
  );
}
