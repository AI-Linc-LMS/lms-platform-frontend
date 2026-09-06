import { test, expect, type Page } from "@playwright/test";

/**
 * "Resume content is not properly contained within the page in some themes. Except for
 * luxsleek, on every theme the contents are going out."
 *
 * The horizontal half of that had one cause: ResumePreview forced
 * `white-space: nowrap; overflow: visible` onto every `[data-resume-contact-item]`, which beat
 * the templates' own `word-break: break-all` on specificity and made it inert. Measured in a
 * headless browser at true A4 with a realistic student profile (a 62-character college email,
 * a long district address), RightSidebar ran 97px past the right edge and Bubble 36px.
 *
 * This is a PIXEL assertion on purpose. The bug is a computed-style interaction between a
 * parent rule and a child rule; nothing short of real layout can see it, and a jsdom test
 * would have passed against the broken code.
 *
 * Run against a deployed origin:
 *   PERF_BASE_URL=https://platform.ailinc.com \
 *   PERF_LOGIN_EMAIL=... PERF_LOGIN_PASSWORD=... \
 *   npx playwright test --project=perf e2e/profile/resume-overflow.spec.ts
 */
const BASE = process.env.PERF_BASE_URL ?? "https://staging.ailinc.com";
const EMAIL = process.env.PERF_LOGIN_EMAIL;
const PASSWORD = process.env.PERF_LOGIN_PASSWORD;

/** How far past the page edge is a bug. Sub-pixel rounding must not fail the suite. */
const SLACK_PX = 2;

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"]', EMAIL!);
  await page.fill('input[type="password"]', PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin/, { timeout: 30_000 });
}

test.describe("the resume never spills off the side of the page", () => {
  test("no ink crosses the right edge of the A4 box, on any template", async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(!EMAIL || !PASSWORD, "PERF_LOGIN_EMAIL/PASSWORD not set");
    await login(page);
    await page.goto(`${BASE}/profile/resume`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-resume-content]", { timeout: 30_000 });
    await page.waitForTimeout(2500);

    const worst = await page.evaluate(() => {
      const box = document.querySelector("[data-resume-content]");
      if (!box) return null;
      const rect = box.getBoundingClientRect();
      let over = 0;
      let text = "";
      for (const el of Array.from(box.querySelectorAll<HTMLElement>("*"))) {
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
        const hasText = Array.from(el.childNodes).some(
          (c) => c.nodeType === 3 && (c.textContent || "").trim().length > 0,
        );
        if (!hasText && el.tagName !== "IMG" && el.tagName !== "SVG") continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        // The page box is scaled for the viewport, so normalise by its own width before
        // comparing: 97px of spill on a 0.55-scaled page reads as 53px raw.
        const spill = ((r.right - rect.right) / rect.width) * 794;
        if (spill > over) {
          over = spill;
          text = (el.textContent || "").trim().slice(0, 80);
        }
      }
      return { over: Math.round(over), text };
    });

    expect(worst, "resume preview did not render").not.toBeNull();
    expect(
      worst!.over,
      `resume ink runs ${worst!.over}px past the right edge of the page: "${worst!.text}"`,
    ).toBeLessThanOrEqual(SLACK_PX);
  });

  test("a contact item may wrap but may never be forbidden from wrapping", async ({ page }) => {
    // The specific regression: a parent rule reimposing `nowrap` makes the templates'
    // `word-break: break-all` inert, and the email spills again.
    test.skip(!EMAIL || !PASSWORD, "PERF_LOGIN_EMAIL/PASSWORD not set");
    await login(page);
    await page.goto(`${BASE}/profile/resume`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-resume-content]", { timeout: 30_000 });
    await page.waitForTimeout(2000);

    const offenders = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-resume-contact-item]"))
        .filter((el) => {
          const cs = getComputedStyle(el);
          return cs.whiteSpace === "nowrap" && cs.overflow === "visible";
        })
        .map((el) => (el.textContent || "").trim().slice(0, 40)),
    );
    expect(offenders, "a contact item is both unbreakable and unclipped").toEqual([]);
  });
});
