/**
 * Auth setup — logs in once and saves cookies/localStorage to e2e/.auth/user.json.
 * All authenticated tests reuse this state via storageState so login is not repeated.
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole("button", { name: /sign in|login/i }).click();

  // Wait until redirected away from login (dashboard or any protected route)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
