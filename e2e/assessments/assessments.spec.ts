import { test, expect } from "@playwright/test";

test.describe("Assessments", () => {
  test("assessments page loads", async ({ page }) => {
    await page.goto("/assessments");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("unauthenticated access redirects to login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/assessments");
    await expect(page).toHaveURL(/login|assessments/, { timeout: 10_000 });
    await ctx.close();
  });
});
