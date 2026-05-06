"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useApiMutation } from "@/lib/useApiMutation";

export default function SignupPage() {
  const { mutate, pending } = useApiMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const res = await mutate(
      "/api/auth/signup",
      { method: "POST", json: { email, password, name } },
      { toastError: false, refresh: false, errorMessage: "Erreur d'inscription" },
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success("Bienvenue sur Pulse !");
    window.location.href = "/feedbacks";
  }

  return (
    <div className="max-w-md mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
      <h1 className="text-xl font-medium mb-6">Inscription</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Nom
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
          />
        </div>
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
          <p className="text-sm text-type-bug-text bg-type-bug-bg rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-action text-text-info py-2.5 text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50"
        >
          {pending ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-text-primary font-medium hover:underline"
        >
          Connexion
        </Link>
      </p>
    </div>
  );
}
