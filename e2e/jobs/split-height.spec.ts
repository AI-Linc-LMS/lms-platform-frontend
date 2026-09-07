import { test, expect, type Page } from "@playwright/test";

/**
 * "After applying a job filter, the page stops scrolling."
 *
 * On lg+ the board is a fixed-height split: the document barely scrolls (16px) and an inner pane
 * carries the results. That pane's height is `calc(100dvh - var(--j-split-top) - 16px)`, where
 * `--j-split-top` is measured from the element's live position. The measurement used to bail out
 * whenever the page or an ancestor was scrolled -- which is precisely when a learner applies a
 * filter, having scrolled down through the results first.
 *
 * Applying a filter adds the ActiveFilters chip row and the filterSummary line, moving the split
 * down. With the measurement suppressed, the pane kept a height computed for a position the rail
 * no longer occupied. Measured at 1440x900 with four filters: --j-split-top stayed 567px while
 * the element sat at 601px, and the pane's bottom landed 18px BELOW the viewport with only 16px
 * of document scroll available -- the tail of the list could not be reached.
 *
 * The invariant is arithmetic, which is what makes it worth pinning: with an honest top,
 * bottom = top + (100dvh - top - 16) = 100dvh - 16. The pane's bottom must sit ~16px above the
 * fold no matter what the rail does.
 *
 *   PERF_BASE_URL=https://platform.ailinc.com PERF_LOGIN_EMAIL=... PERF_LOGIN_PASSWORD=... \
 *   npx playwright test --project=perf e2e/jobs/split-height.spec.ts
 */
const BASE = process.env.PERF_BASE_URL ?? "https://staging.ailinc.com";
const EMAIL = process.env.PERF_LOGIN_EMAIL;
const PASSWORD = process.env.PERF_LOGIN_PASSWORD;

/** The gap the layout reserves below the split. */
const BOTTOM_GAP = 16;
/** Sub-pixel and rounding slack. A real break is tens of pixels, not ones. */
const SLACK = 8;

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"]', EMAIL!);
  await page.fill('input[type="password"]', PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin/, { timeout: 30_000 });
}

async function paneOverflow(page: Page) {
  return page.evaluate(() => {
    const panes = Array.from(document.querySelectorAll<HTMLElement>("*")).filter((el) => {
      const cs = getComputedStyle(el);
      return (
        (cs.overflowY === "auto" || cs.overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 20
      );
    });
    if (!panes.length) return null;
    const pane = panes.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    return {
      below: Math.round(pane.getBoundingClientRect().bottom - window.innerHeight),
      height: Math.round(pane.clientHeight),
      content: Math.round(pane.scrollHeight),
    };
  });
}

test.describe("the results pane stays inside the viewport", () => {
  test("a filter applied after scrolling does not push the pane below the fold", async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(!EMAIL || !PASSWORD, "PERF_LOGIN_EMAIL/PASSWORD not set");
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE}/jobs-v2`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-tour-id="jobs-results"]', { timeout: 30_000 });
    await page.waitForTimeout(3000);

    const before = await paneOverflow(page);
    test.skip(before === null, "no scrollable results pane at this size");
    expect(before!.below).toBeLessThanOrEqual(-BOTTOM_GAP + SLACK);

    // Scroll first -- this is the state that used to suppress the remeasure entirely.
    await page.evaluate(() => window.scrollTo(0, 16));
    await page.mouse.move(720, 500);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(500);

    // ...then apply filters, which grows the rail by a chip row and a summary line.
    for (const label of ["Experience", "Role", "Work mode", "Posted"]) {
      const pill = page.locator(`[aria-haspopup="dialog"]:has-text("${label}")`).first();
      if (!(await pill.count())) continue;
      await pill.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      const option = page
        .locator('.MuiPopover-root [role="radio"], .MuiPopover-root button')
        .nth(1);
      await option.click({ force: true, timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(700);
      await page.mouse.click(5, 5).catch(() => {});
      await page.waitForTimeout(700);
    }

    const after = await paneOverflow(page);
    expect(after, "the results pane disappeared after filtering").not.toBeNull();
    expect(
      after!.below,
      `the results pane runs ${after!.below}px past the bottom of the viewport after filtering, ` +
        `so the tail of the list cannot be reached`,
    ).toBeLessThanOrEqual(-BOTTOM_GAP + SLACK);
  });

  test("the filter rail never leaves the split sized for a stale position", async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "PERF_LOGIN_EMAIL/PASSWORD not set");
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE}/jobs-v2`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-tour-id="jobs-results"]', { timeout: 30_000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, 16));

    const pill = page.locator('[aria-haspopup="dialog"]:has-text("Experience")').first();
    if (await pill.count()) {
      await pill.click().catch(() => {});
      await page.waitForTimeout(400);
      await page
        .locator('.MuiPopover-root [role="radio"], .MuiPopover-root button')
        .nth(1)
        .click({ force: true })
        .catch(() => {});
      await page.waitForTimeout(700);
      await page.mouse.click(5, 5).catch(() => {});
      await page.waitForTimeout(1200);
    }

    const drift = await page.evaluate(() => {
      let holder: HTMLElement | null = null;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
        if (el.style?.getPropertyValue("--j-split-top")) {
          holder = el;
          break;
        }
      }
      if (!holder) return null;
      return {
        declared: parseInt(holder.style.getPropertyValue("--j-split-top"), 10),
        actual: Math.round(holder.getBoundingClientRect().top),
      };
    });
    test.skip(drift === null, "--j-split-top is not set at this breakpoint");
    expect(
      Math.abs(drift!.declared - drift!.actual),
      `--j-split-top says ${drift!.declared}px but the split sits at ${drift!.actual}px`,
    ).toBeLessThanOrEqual(SLACK);
  });
});
