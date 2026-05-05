import { expect, test } from "@playwright/test";
import { ACCOUNTS, loginViaUi } from "./helpers";

test.describe("Auth", () => {
  test("signup creates a user with role=user (UI flow)", async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const email = `e2e-signup-${ts}@test.example`;
    const password = "password123";
    const name = `E2E Signup ${ts}`;

    await page.goto("/signup");
    await page.getByLabel("Nom").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("button", { name: /créer mon compte/i }).click();

    // Should land on /feedbacks after successful signup
    await page.waitForURL(/\/feedbacks/);

    // Verify the role via the API (server-side truth)
    const me = await request.get("/api/me");
    expect(me.ok()).toBe(true);
    const body = await me.json();
    expect(body.user.role).toBe("user");
    expect(body.user.email).toBe(email);
  });

  test("login redirects to /feedbacks (UI flow)", async ({ page }) => {
    await loginViaUi(page, ACCOUNTS.alice);
    await expect(page).toHaveURL(/\/feedbacks/);
    // Header shows the admin nav for Alice
    await expect(page.getByRole("link", { name: /admin/i })).toBeVisible();
  });

  test("invalid credentials rejected with generic message", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("alice@test.com");
    await page.getByLabel("Mot de passe").fill("wrongpassword");
    await page.getByRole("button", { name: /se connecter/i }).click();
    await expect(
      page.getByText(/email ou mot de passe incorrect/i),
    ).toBeVisible();
    // Still on /login
    await expect(page).toHaveURL(/\/login/);
  });
});
