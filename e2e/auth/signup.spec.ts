import { test, expect } from "@playwright/test";

test.describe("Signup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("renders signup form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign up|register|create account/i })).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill("not-an-email");
    await emailInput.blur();
    await expect(page.getByText(/valid email|invalid email/i)).toBeVisible();
  });

  test("link back to login works", async ({ page }) => {
    await page.getByRole("link", { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});
