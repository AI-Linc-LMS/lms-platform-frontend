import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads without error", async ({ page }) => {
    await page.goto("/dashboard");
    // No error boundary or 500
    await expect(page.getByText(/something went wrong|internal server error/i)).not.toBeVisible();
    await expect(page).not.toHaveURL(/login/);
  });

  test("unauthenticated user is redirected to login", async ({ browser }) => {
    const ctx = await browser.newContext(); // no storageState — fresh context
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
    await ctx.close();
  });
});
