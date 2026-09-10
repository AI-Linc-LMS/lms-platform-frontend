import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The share card is drawn by `next/og`, i.e. Satori, which runs no CSS custom properties. The
 * `var(--x, fallback)` form every other surface uses is not merely un-themed here -- it resolves
 * to NOTHING, so the card would lose its background entirely. The colours must be real literals
 * by the time Satori sees them, which is what this resolver is for.
 *
 * It is also the one place a bad value reaches an image that gets cached by LinkedIn and Slack,
 * so it validates what it reads and falls back rather than trusting the API.
 */
const STOCK = "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)";

describe("the credential share card's brand background", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
    process.env.NEXT_PUBLIC_CLIENT_ID = "58";
    vi.resetModules();
  });
  afterEach(() => { globalThis.fetch = realFetch; });

  const load = async () =>
    (await import("./credential-data")).credentialBrandBackground;

  const mock = (body: unknown, ok = true) => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok, json: async () => body,
    }) as unknown as typeof fetch;
  };

  it("repaints for a tenant that opted in", async () => {
    mock({ theme_settings: {
      _useTenantPalette: "true",
      moduleTileFrom: "#193c68", aiViolet: "#f59e0b", moduleCtaTo: "#d97706",
    } });
    expect(await (await load())()).toBe(
      "linear-gradient(135deg, #193c68 0%, #f59e0b 55%, #d97706 100%)");
  });

  it("leaves a tenant that has NOT opted in exactly as it was", async () => {
    // Stored values must not leak in through the back door; this is the same gate the browser
    // applies in normalizeThemeSettings.
    mock({ theme_settings: { moduleTileFrom: "#193c68", aiViolet: "#f59e0b" } });
    expect(await (await load())()).toBe(STOCK);
  });

  it("falls back when the API errors, 404s, or returns junk", async () => {
    for (const setup of [
      () => mock({}, false),
      () => mock({ theme_settings: null }),
      () => { globalThis.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch; },
    ]) {
      vi.resetModules(); setup();
      expect(await (await load())()).toBe(STOCK);
    }
  });

  it("rejects a value that is not a plain 6-digit hex", async () => {
    // Satori cannot resolve var(), and this string is baked into a cached PNG.
    mock({ theme_settings: {
      _useTenantPalette: "true",
      moduleTileFrom: "var(--x, #fff)", aiViolet: "red; }", moduleCtaTo: "#d97706",
    } });
    expect(await (await load())()).toBe(
      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #d97706 100%)");
  });

  it("never emits a var() into the image", async () => {
    mock({ theme_settings: { _useTenantPalette: "true", aiViolet: "#f59e0b" } });
    expect(await (await load())()).not.toContain("var(");
  });
});

describe("no hover state collapses onto its resting fill", () => {
  /**
   * Once a button's rest AND hover both resolve to --module-cta-*, the hover says nothing on a
   * tenant palette -- it only differed on stock because the two fallbacks differed. A brightness
   * filter works on any palette.
   */
  const FILES = [
    "app/instructor/cohorts/page.tsx",
    "components/admin/adaptive-course/CourseStudentsPanel.tsx",
    "components/common/ProfileLockModal.tsx",
    "components/courses/CatalogCourseCard.tsx",
    "components/instructor/InstructorAssignPanel.tsx",
  ];

  it.each(FILES)("%s gives hover a palette-independent treatment", (f) => {
    const src = readFileSync(join(process.cwd(), f), "utf8");
    // The background must be INSIDE the hover block. A resting `background:` sharing a line
    // with `"&:hover"` is not a collapse, and matching on the line alone said it was.
    const collapsed = [
      ...src.matchAll(/"&:hover":\s*\{([^}]*)\}/g),
    ]
      .map((m) => m[1])
      .filter((body) => /background:\s*"linear-gradient\([^"]*var\(--module-(cta|tile)-/.test(body));
    expect(collapsed, `${f} re-states the resting gradient on hover`).toEqual([]);
  });
});
