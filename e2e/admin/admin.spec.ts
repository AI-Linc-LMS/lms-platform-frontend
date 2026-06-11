import { test, expect } from "@playwright/test";

// Admin tests require an admin-role user. Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
// and run with: E2E_USER_EMAIL=$E2E_ADMIN_EMAIL E2E_USER_PASSWORD=$E2E_ADMIN_PASSWORD npx playwright test e2e/admin

test.describe("Admin", () => {
  test("admin dashboard loads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText(/something went wrong|forbidden|unauthorized/i)).not.toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated access redirected or forbidden", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/admin");
    // Should redirect to login or show access denied
    const url = page.url();
    const isRedirected = url.includes("login") || url.includes("403") || url.includes("unauthorized");
    const hasForbiddenText = await page.getByText(/forbidden|not authorized|access denied/i).isVisible();
    expect(isRedirected || hasForbiddenText).toBe(true);
    await ctx.close();
  });
});
