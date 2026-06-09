import { test, expect } from "@playwright/test";

test.describe("Attendance", () => {
  test("attendance page loads for authenticated user", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});
