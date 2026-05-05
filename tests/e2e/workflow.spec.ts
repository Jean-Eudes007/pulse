import { expect, test } from "@playwright/test";
import { ACCOUNTS, deleteFeedback, loginViaApi, uniqueTitle } from "./helpers";

test.describe("Backlog → kanban workflow", () => {
  test("admin can send to backlog, dev can take then move to done", async ({
    request,
  }) => {
    // Bob creates a feedback
    await loginViaApi(request, ACCOUNTS.bob);
    const create = await request.post("/api/feedbacks", {
      data: {
        title: uniqueTitle("Workflow test"),
        description:
          "Workflow E2E : send to backlog, take, review, done. Cleanup at the end.",
        type: "amélioration",
      },
    });
    const { feedback } = await create.json();
    const id = feedback.id as string;

    // Alice (admin) sends to backlog
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.alice);
    const backlog = await request.post(`/api/feedbacks/${id}/backlog`);
    expect(backlog.ok()).toBe(true);
    const backlogBody = await backlog.json();
    expect(backlogBody.status).toBe("to_do");

    // Bob (creator) should now have a notification
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.bob);
    const notifs = await request.get("/api/notifications");
    const { notifications } = await notifs.json();
    expect(notifications.some((n: { feedbackId: string }) => n.feedbackId === id)).toBe(
      true,
    );

    // Lea (dev) takes the ticket
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.lea);
    const take = await request.post(`/api/feedbacks/${id}/take`);
    expect(take.ok()).toBe(true);
    const takeBody = await take.json();
    expect(takeBody.status).toBe("in_progress");

    // Lea moves through the workflow
    const review = await request.patch(`/api/feedbacks/${id}/status`, {
      data: { status: "review" },
    });
    expect(review.ok()).toBe(true);

    const done = await request.patch(`/api/feedbacks/${id}/status`, {
      data: { status: "done" },
    });
    expect(done.ok()).toBe(true);

    // Cleanup
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.bob);
    await deleteFeedback(request, id);
  });

  test("dev cannot take a ticket that is not in to_do (409)", async ({
    request,
  }) => {
    // Bob creates a feedback (status null, NOT in backlog)
    await loginViaApi(request, ACCOUNTS.bob);
    const create = await request.post("/api/feedbacks", {
      data: {
        title: uniqueTitle("Take guard test"),
        description:
          "Lea tries to take this without admin sending to backlog first.",
        type: "bug",
      },
    });
    const { feedback } = await create.json();
    const id = feedback.id as string;

    // Lea tries to take — should fail because status is null, not to_do
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.lea);
    const take = await request.post(`/api/feedbacks/${id}/take`);
    expect(take.status()).toBe(409);

    // Cleanup
    await request.post("/api/auth/logout");
    await loginViaApi(request, ACCOUNTS.bob);
    await deleteFeedback(request, id);
  });
});
