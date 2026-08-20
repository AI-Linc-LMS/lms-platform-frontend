import { test, expect } from "@playwright/test";

/**
 * Guards for the 2026-08 ultrafast program's load-bearing invariants.
 *
 * Run against any deployed origin:
 *   PERF_BASE_URL=https://staging.ailinc.com npx playwright test e2e/perf-regression.spec.ts
 *
 * Each of these caught a real, expensive production defect once:
 *  - 17 duplicated Emotion blocks made 92% of every document (799KB /login);
 *  - `await headers()` in the root layout forced every route dynamic, sending
 *    every click through a cold-prone us-east Lambda (9-11s cold TTFB);
 *  - the login form vanished from the prerendered document when a
 *    useSearchParams CSR bailout swallowed the page.
 */
const BASE = process.env.PERF_BASE_URL ?? "https://staging.ailinc.com";

test.describe("perf regression guards", () => {
  test("login document stays small, cacheable, and singly-styled", async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    expect(res.status()).toBe(200);

    const cacheControl = res.headers()["cache-control"] ?? "";
    // The regression signature is `private` + `no-store` (fully dynamic).
    expect(cacheControl).not.toContain("no-store");
    expect(cacheControl).not.toContain("private");

    const html = await res.text();
    // One emotion style block per stream, not one per flush.
    const emotionBlocks = html.match(/<style data-emotion=/g) ?? [];
    expect(emotionBlocks.length).toBeLessThanOrEqual(2);

    // 799KB regression guard (healthy is ~90-110KB).
    expect(html.length).toBeLessThan(250_000);

    // The real form is prerendered — no CSR bailout swallowing the page.
    expect(html).not.toContain("BAILOUT_TO_CLIENT_SIDE_RENDERING");
    expect(html).toContain('type="password"');

    // No render-blocking third-party stylesheet on the critical path.
    expect(html).not.toContain('rel="stylesheet" href="https://api.fontshare.com');
  });

  test("login paints fast and hydrates without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${BASE}/login`, { waitUntil: "load" });
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    const fcp = await page.evaluate(
      () =>
        performance
          .getEntriesByType("paint")
          .find((p) => p.name === "first-contentful-paint")?.startTime ?? null,
    );
    // Generous bound: catches a return to seconds-long blocking, not jitter.
    if (fcp !== null) expect(fcp).toBeLessThan(6_000);
    expect(errors).toEqual([]);
  });
});
