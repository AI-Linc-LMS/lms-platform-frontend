import { test, expect } from "@playwright/test";

test.describe("Jobs", () => {
  test("jobs listing loads", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("job application flow starts correctly", async ({ page }) => {
    await page.goto("/jobs");
    const firstJob = page.getByRole("link", { name: /apply|view|details/i }).first();
    if (await firstJob.isVisible()) {
      await firstJob.click();
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    }
  });
});
