import { test, expect } from "@playwright/test";

test.describe("Support Tickets", () => {
  test("tickets page loads", async ({ page }) => {
    await page.goto("/tickets");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});
