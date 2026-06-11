import { test, expect } from "@playwright/test";

test.describe("Profile", () => {
  test("profile page loads", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("displays user info section", async ({ page }) => {
    await page.goto("/profile");
    // At minimum one heading or name field should be present
    const hasContent =
      (await page.getByRole("heading").count()) > 0 ||
      (await page.locator("input").count()) > 0;
    expect(hasContent).toBe(true);
  });
});
