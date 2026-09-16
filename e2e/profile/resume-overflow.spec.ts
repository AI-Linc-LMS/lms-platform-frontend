import { test, expect, type Page } from "@playwright/test";

/**
 * "Resume content is not properly contained within the page in some themes. Except for luxsleek,
 * on every theme the contents are going out." - and, reported with it, "if the contents are not
 * coming in one page then let the user move to a second page".
 *
 * Three causes, all measured in a real browser rather than reasoned about:
 *
 *   - the page was measured AFTER the preview shrank it to fit the window, so the fit depended on
 *     the window size: at 1366px wide, 9 of 12 templates lost text;
 *   - contact lines and entry titles were forbidden to wrap, so a long address or degree ran off
 *     the side and was clipped;
 *   - nothing paginated, so anything past one page was simply not drawn, in the preview and in the
 *     downloaded PDF alike.
 *
 * These are PIXEL assertions on purpose. Every one of these bugs is invisible to a unit test: the
 * defect only exists once a browser has laid the document out.
 *
 * Run against a deployed origin:
 *   PERF_BASE_URL=https://platform.ailinc.com \
 *   PERF_LOGIN_EMAIL=... PERF_LOGIN_PASSWORD=... \
 *   npx playwright test --project=perf e2e/profile/resume-overflow.spec.ts
 */
const BASE = process.env.PERF_BASE_URL ?? "https://staging.ailinc.com";
const EMAIL = process.env.PERF_LOGIN_EMAIL;
const PASSWORD = process.env.PERF_LOGIN_PASSWORD;

/** Sub-pixel rounding must not fail the suite. */
const SLACK_PX = 2;

/** Every template, by the label on its chip. */
const TEMPLATES = [
  "Modern", "Classic", "Minimal", "Executive", "Creative", "Technical",
  "Western", "LuxSleek", "Two Column", "Accent Bar", "Right Sidebar", "Bubble",
];

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "load" });
  await page.fill('input[type="email"]', EMAIL!);
  await page.fill('input[type="password"]', PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin/, { timeout: 30_000 });
}

/** The builder lives at /resume. The old spec opened /profile/resume, which is not a route: it
 *  returned 404 on prod, so it never once exercised the thing it was guarding. */
async function openBuilder(page: Page) {
  await page.goto(`${BASE}/resume`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-resume-sheet]", { state: "attached", timeout: 30_000 });
  await page.waitForTimeout(2500);
}

/**
 * Measure the laid-out document in page pixels: how far its ink reaches, how far past the sides it
 * goes, and whether anything is cut in half by a page edge. The sheets are scaled to fit the
 * window, so every reading is divided by that scale - the very mistake that caused the bug.
 */
async function measure(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;height:297mm;width:1px";
    document.body.appendChild(probe);
    const PAGE = probe.getBoundingClientRect().height;
    probe.remove();

    const sheets = Array.from(document.querySelectorAll("[data-resume-sheet]"));
    const first = sheets[0];
    const flow = first?.firstElementChild as HTMLElement | undefined;
    if (!first || !flow) return null;
    const scale = first.getBoundingClientRect().width / parseFloat(getComputedStyle(first).width);
    const origin = flow.getBoundingClientRect();

    let ink = 0;
    let right = 0;
    let left = 0;
    const cut: string[] = [];
    for (const el of Array.from(flow.querySelectorAll<HTMLElement>("*"))) {
      if (el.hasAttribute("data-page-spacer")) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
      const hasText = Array.from(el.childNodes).some(
        (n) => n.nodeType === 3 && (n.textContent || "").trim().length > 0,
      );
      if (!hasText && el.tagName !== "IMG" && el.tagName !== "SVG" && el.tagName !== "svg") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const top = (r.top - origin.top) / scale;
      const bottom = (r.bottom - origin.top) / scale;
      ink = Math.max(ink, bottom);
      right = Math.max(right, (r.right - origin.left) / scale - 794);
      left = Math.max(left, (origin.left - r.left) / scale);
      for (let k = 1; k <= sheets.length; k += 1) {
        const edge = k * PAGE;
        if (top < edge - 0.5 && bottom > edge + 0.5) cut.push((el.textContent || "").trim().slice(0, 60));
      }
    }
    return {
      pages: sheets.length,
      pastBottom: Math.round(ink - sheets.length * PAGE),
      pastRight: Math.round(right),
      pastLeft: Math.round(left),
      cut,
    };
  });
}

test.describe("the resume is contained by its pages, on every template", () => {
  test.skip(!EMAIL || !PASSWORD, "PERF_LOGIN_EMAIL/PASSWORD not set");

  test("no text falls off the page, off the side, or across a page edge", async ({ page }) => {
    test.setTimeout(240_000);
    await login(page);
    await openBuilder(page);

    for (const template of TEMPLATES) {
      await page.getByRole("button", { name: template, exact: true }).click();
      await page.waitForTimeout(1200);
      const m = await measure(page);
      expect(m, `${template}: the preview did not render`).not.toBeNull();
      expect(m!.pastBottom, `${template}: ink runs ${m!.pastBottom}px past the last page`).toBeLessThanOrEqual(SLACK_PX);
      expect(m!.pastRight, `${template}: ink runs ${m!.pastRight}px past the right edge`).toBeLessThanOrEqual(SLACK_PX);
      expect(m!.pastLeft, `${template}: ink runs ${m!.pastLeft}px past the left edge`).toBeLessThanOrEqual(SLACK_PX);
      expect(m!.cut, `${template}: text is cut in half by a page edge`).toEqual([]);
    }
  });

  test("a contact line may wrap, and may never be forbidden from wrapping", async ({ page }) => {
    // The specific regression: a rule reimposing nowrap makes the templates' own word-break inert,
    // and a long address spills again - 249px of it in Right Sidebar.
    await login(page);
    await openBuilder(page);
    const offenders = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-resume-contact-item]"))
        .filter((el) => getComputedStyle(el).whiteSpace === "nowrap")
        .map((el) => (el.textContent || "").trim().slice(0, 40)),
    );
    expect(offenders, "a contact line is forbidden to wrap").toEqual([]);
  });

  test("no template prints a source comment on the learner's resume", async ({ page }) => {
    // A comment written without braces is not a comment, it is text. Four templates printed one
    // on every job, in the preview and in the PDF.
    await login(page);
    await openBuilder(page);
    for (const template of TEMPLATES) {
      await page.getByRole("button", { name: template, exact: true }).click();
      await page.waitForTimeout(800);
      const stray = await page.evaluate(() => {
        const sheet = document.querySelector("[data-resume-sheet]");
        return (sheet?.textContent || "").includes("/*");
      });
      expect(stray, `${template}: a source comment is printed on the resume`).toBe(false);
    }
  });
});
