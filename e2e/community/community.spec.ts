import { test, expect } from "@playwright/test";

test.describe("Community", () => {
  test("community page loads", async ({ page }) => {
    await page.goto("/community");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});
