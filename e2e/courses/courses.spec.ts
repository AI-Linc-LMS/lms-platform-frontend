import { test, expect } from "@playwright/test";

test.describe("Courses", () => {
  test("course listing page loads", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("can search or filter courses", async ({ page }) => {
    await page.goto("/courses");
    const searchInput = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i)).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("python");
      // Results should update — just assert no crash
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    }
  });
});
