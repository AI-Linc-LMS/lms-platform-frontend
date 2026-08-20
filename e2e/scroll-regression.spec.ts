import { test, expect, type Page } from "@playwright/test";

/**
 * Scroll must never break again.
 *
 * This class of bug shipped twice (#1146's chrome hoist dropped the
 * scroll-container geometry; a stale-deploy tab freeze read the same way), so
 * it gets its own guard: REAL wheel events on every hot surface, asserting
 * that content taller than the viewport is actually reachable.
 *
 * Run against any deployed origin:
 *   PERF_BASE_URL=https://staging.ailinc.com \
 *   PERF_LOGIN_EMAIL=... PERF_LOGIN_PASSWORD=... \
 *   npx playwright test --project=perf e2e/scroll-regression.spec.ts
 *
 * Without credentials it still guards the public pages.
 */
const BASE = process.env.PERF_BASE_URL ?? "https://staging.ailinc.com";
const EMAIL = process.env.PERF_LOGIN_EMAIL;
const PASSWORD = process.env.PERF_LOGIN_PASSWORD;

const PUBLIC_ROUTES = ["/login", "/signup"];
const APP_ROUTES = [
  "/dashboard",
  "/courses",
  "/adaptive-courses",
  "/ai-tutor",
  "/assessments",
  "/jobs-v2",
  "/live-sessions",
  "/tickets",
  "/community",
  "/profile",
  "/admin/dashboard",
  "/admin/instructors",
  "/admin/adaptive-courses",
  "/admin/scorecard",
  "/admin/admin-mock-interview",
  "/admin/notifications",
];

async function dismissModals(page: Page) {
  // A legitimately open MUI modal (onboarding tour, profile blocker) locks
  // body scroll BY DESIGN — that is the modal's scroll context, not a bug.
  // Dismiss anything dismissible so the assertion below tests the page.
  for (let i = 0; i < 4; i++) {
    const dialog = page.locator(".MuiDialog-root:visible");
    if ((await dialog.count()) === 0) return;
    const skip = page.locator(
      '.MuiDialog-root button:has-text("Skip"), .MuiDialog-root [aria-label="close"], .MuiDialog-root [aria-label="Close"]',
    ).first();
    if (await skip.count()) {
      await skip.click({ timeout: 2000 }).catch(() => {});
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(600);
  }
}

async function assertWheelScrolls(page: Page, route: string) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await dismissModals(page);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => {
    const doc = document.scrollingElement!;
    let containerScrolled = false;
    for (const el of Array.from(document.querySelectorAll("*"))) {
      if (el.scrollTop > 10) {
        containerScrolled = true;
        break;
      }
    }
    return {
      docTop: doc.scrollTop,
      overflows: doc.scrollHeight > doc.clientHeight + 10,
      containerScrolled,
    };
  });
  const modalStillOpen = (await page.locator(".MuiDialog-root:visible").count()) > 0;
  // A page either fits the viewport, a real wheel event must move it, or a
  // non-dismissible modal legitimately owns the viewport.
  expect(
    !result.overflows || result.docTop > 10 || result.containerScrolled || modalStillOpen,
    `${route} has overflowing content that did not respond to wheel scroll`,
  ).toBe(true);
}

test.describe("scroll regression guards", () => {
  test("public pages scroll", async ({ page }) => {
    for (const route of PUBLIC_ROUTES) await assertWheelScrolls(page, route);
  });

  test("authenticated surfaces scroll", async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "PERF_LOGIN_EMAIL/PASSWORD not set");
    await page.goto(`${BASE}/login`, { waitUntil: "load" });
    await page.fill('input[type="email"]', EMAIL!);
    await page.fill('input[type="password"]', PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|admin/, { timeout: 30_000 });
    await page.waitForTimeout(3000);
    for (const route of APP_ROUTES) await assertWheelScrolls(page, route);
  });
});
