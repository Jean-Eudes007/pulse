import type { APIRequestContext, Page } from "@playwright/test";

// Demo accounts (seeded; password identical for all)
export const ACCOUNTS = {
  alice: { email: "alice@test.com", password: "password123" }, // admin
  bob: { email: "bob@test.com", password: "password123" }, // user
  sarah: { email: "sarah@pulse.app", password: "password123" }, // user
  lea: { email: "lea@pulse.app", password: "password123" }, // dev
} as const;

/** Unique title prefix so tests can identify and cleanup their data. */
export function uniqueTitle(prefix: string): string {
  return `[E2E ${Date.now()}] ${prefix}`;
}

/** Login via the API directly (faster than UI). Returns the user object. */
export async function loginViaApi(
  request: APIRequestContext,
  account: { email: string; password: string },
) {
  const res = await request.post("/api/auth/login", { data: account });
  if (!res.ok()) {
    throw new Error(`Login failed for ${account.email}: ${res.status()}`);
  }
  return res.json();
}

/** Login via the UI (keeps test realistic for at least one flow). */
export async function loginViaUi(
  page: Page,
  account: { email: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Mot de passe").fill(account.password);
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/\/feedbacks/);
}

/** Cleanup a feedback created during a test. */
export async function deleteFeedback(
  request: APIRequestContext,
  feedbackId: string,
) {
  await request.delete(`/api/feedbacks/${feedbackId}`);
}
