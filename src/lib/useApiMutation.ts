"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Q-4 audit refactor: factorize the setPending → fetch → toast → router.refresh()
// pattern that was duplicated in 5+ client components.
//
// Default behavior on a non-2xx response: read `{error}` from the JSON
// body and toast.error it (fallback "Erreur"). On success: optionally
// toast and call router.refresh().
//
// Components that need finer control (custom redirect, optimistic UI,
// status-specific branches) can pass `toastError: false` / `refresh: false`
// and react to the returned `{ ok, status, data }`.

type Options = {
  successMessage?: string;
  errorMessage?: string; // fallback if API didn't return one
  toastError?: boolean; // default true
  refresh?: boolean; // default true
};

type MutateInit = Omit<RequestInit, "body"> & {
  json?: unknown; // sets Content-Type and JSON.stringifies
  body?: BodyInit;
};

type Result<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

export function useApiMutation() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function mutate<T = unknown>(
    url: string,
    init: MutateInit = {},
    opts: Options = {},
  ): Promise<Result<T>> {
    const { json, headers, body, ...rest } = init;
    const finalHeaders =
      json !== undefined
        ? { "Content-Type": "application/json", ...headers }
        : headers;
    const finalBody = json !== undefined ? JSON.stringify(json) : body;

    setPending(true);
    try {
      const res = await fetch(url, {
        ...rest,
        headers: finalHeaders,
        body: finalBody,
      });
      const payload = await res.json().catch(() => ({}) as Record<string, unknown>);

      if (!res.ok) {
        const message =
          (payload && typeof payload.error === "string" && payload.error) ||
          opts.errorMessage ||
          "Erreur";
        if (opts.toastError !== false) toast.error(message);
        return { ok: false, status: res.status, error: message };
      }

      if (opts.successMessage) toast.success(opts.successMessage);
      if (opts.refresh !== false) router.refresh();
      return { ok: true, status: res.status, data: payload as T };
    } finally {
      setPending(false);
    }
  }

  return { mutate, pending };
}
