import { expect, test } from "@playwright/test";
import { ACCOUNTS, deleteFeedback, loginViaApi, uniqueTitle } from "./helpers";

test.describe("Feedback CRUD + voting", () => {
  test("user can submit a feedback (UI flow)", async ({ page, request }) => {
    await loginViaApi(request, ACCOUNTS.bob);

    const title = uniqueTitle("Soumettre un test");
    await page.goto("/submit");
    await page.getByLabel(/titre/i).fill(title);
    await page
      .getByLabel(/description/i)
      .fill("Description suffisamment longue pour passer la validation Zod");
    await page.getByLabel(/type/i).selectOption("bug");
    await page.getByRole("button", { name: /soumettre le feedback/i }).click();

    await page.waitForURL(/\/feedbacks/);
    await expect(page.getByText(title)).toBeVisible();

    // Cleanup via API
    const list = await request.get("/api/feedbacks");
    const data = await list.json();
    const created = data.feedbacks.find((f: { title: string }) =>
      f.title === title,
    );
    if (created) await deleteFeedback(request, created.id);
  });

  test("vote increments count and prevents double-vote (API)", async ({
    request,
  }) => {
    // Bob creates a feedback then votes on it
    await loginViaApi(request, ACCOUNTS.bob);
    const create = await request.post("/api/feedbacks", {
      data: {
        title: uniqueTitle("Vote test"),
        description: "Pour tester le vote anti-double-clic.",
        type: "idée",
      },
    });
    expect(create.ok()).toBe(true);
    const { feedback } = await create.json();
    const id = feedback.id as string;

    // Switch to Sarah to vote (different user from creator)
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.sarah);

    // First vote → 200
    const v1 = await request.post(`/api/feedbacks/${id}/vote`);
    expect(v1.status()).toBe(200);
    const { voteCount } = await v1.json();
    expect(voteCount).toBeGreaterThanOrEqual(1);

    // Second vote → 409
    const v2 = await request.post(`/api/feedbacks/${id}/vote`);
    expect(v2.status()).toBe(409);

    // Cleanup: switch back to Bob to delete his feedback
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.bob);
    await deleteFeedback(request, id);
  });
});
