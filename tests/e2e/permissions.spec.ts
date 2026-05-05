import { expect, test } from "@playwright/test";
import { ACCOUNTS, deleteFeedback, loginViaApi, uniqueTitle } from "./helpers";

test.describe("Permissions (server-side enforcement)", () => {
  test("user B cannot edit or delete user A's feedback", async ({
    request,
  }) => {
    // A = Bob creates a feedback
    await loginViaApi(request, ACCOUNTS.bob);
    const create = await request.post("/api/feedbacks", {
      data: {
        title: uniqueTitle("Permission test"),
        description: "Created by Bob, will be attacked by Sarah.",
        type: "bug",
      },
    });
    const { feedback } = await create.json();
    const id = feedback.id as string;

    // B = Sarah tries to edit and delete it
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.sarah);

    const patch = await request.patch(`/api/feedbacks/${id}`, {
      data: { title: "Hijacked" },
    });
    expect(patch.status()).toBe(403);

    const del = await request.delete(`/api/feedbacks/${id}`);
    expect(del.status()).toBe(403);

    // Cleanup as the actual creator
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.bob);
    await deleteFeedback(request, id);
  });

  test("non-admin redirected away from /admin", async ({ page }) => {
    // Bob is just a user — should be redirected
    await page.goto("/login");
    await page.getByLabel("Email").fill(ACCOUNTS.bob.email);
    await page.getByLabel("Mot de passe").fill(ACCOUNTS.bob.password);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL(/\/feedbacks/);

    // Now try to navigate to /admin
    await page.goto("/admin");
    // Should be redirected to /feedbacks
    await page.waitForURL(/\/feedbacks/);
    await expect(page).toHaveURL(/\/feedbacks/);
  });

  test("anonymous request to mutation route returns 401", async ({
    request,
  }) => {
    // No login at all
    await request.post("/api/auth/logout").catch(() => undefined);
    const create = await request.post("/api/feedbacks", {
      data: {
        title: "Should fail",
        description: "No auth, should be rejected.",
        type: "bug",
      },
    });
    expect(create.status()).toBe(401);
  });
});
