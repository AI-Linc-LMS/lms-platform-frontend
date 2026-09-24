import { test, expect, type Page, type Locator, request as playwrightRequest } from "@playwright/test";

/**
 * The app chrome must not move when you point at it.
 *
 * Reported as "[Every Section] while hovering over today's leader, the support and help button is
 * not static. Same for the current streak button." Both chips open a MUI `Popover`, which is a
 * Modal, which by default locks page scroll: `overflow: hidden` on the body plus a compensating
 * `padding-right`. That removes the document scrollbar, the viewport widens by its width, and
 * every `position: fixed` element that is not `.mui-fixed` — the Support and Help button, the
 * phone dock — slides sideways by exactly that width and back again on mouse-out.
 *
 * A class-name assertion cannot see this, so this measures: every watched box is recorded at
 * rest, each trigger is hovered (and tabbed to), and every box must come back identical to the
 * pixel, at 1440, 390 and 360.
 *
 * Run against any deployed origin (no local server):
 *   PERF_BASE_URL=https://demo.ailinc.com \
 *   PERF_LOGIN_EMAIL=student1@demo.ailinc.com PERF_LOGIN_PASSWORD=... \
 *   npx playwright test --project=perf e2e/chrome-hover-shift.spec.ts
 *
 * Every request the PAGE makes is restricted to GET/HEAD, so the run cannot write anything. The
 * one POST is the login, issued from an API context outside the page.
 */
const BASE = process.env.PERF_BASE_URL ?? "https://demo.ailinc.com";
const EMAIL = process.env.PERF_LOGIN_EMAIL ?? "student1@demo.ailinc.com";
const PASSWORD = process.env.PERF_LOGIN_PASSWORD;
const API = process.env.PERF_API_BASE_URL ?? "https://be-app.ailinc.com";
const CLIENT_ID = process.env.PERF_CLIENT_ID ?? "34";

/**
 * Headless Chromium on macOS draws overlay scrollbars, which take no layout space — and with no
 * scrollbar to remove, the bug cannot happen. Windows and Linux (and macOS set to "always show
 * scroll bars") reserve real width, which is where this was reported from. The app's own
 * `* { scrollbar-color: ... }` opts into the platform scrollbar, so this overrides it back to a
 * classic, space-taking one and reproduces the reporter's machine.
 */
/**
 * Playwright runs headless Chromium with `--hide-scrollbars`, which removes the scrollbar the bug
 * needs. Give it back.
 */
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

const CLASSIC_SCROLLBAR =
  "*{scrollbar-color:auto !important;scrollbar-width:auto !important}" +
  "::-webkit-scrollbar{width:15px;height:15px}" +
  "::-webkit-scrollbar-track{background:#eee}::-webkit-scrollbar-thumb{background:#888}";

/**
 * Everything on the app chrome, watched at once: the two the report named, and every neighbour
 * they could push. Pointing at any one of these may move that one (a chip lifts 1px, the bell
 * scales 1.05 - transforms, which reflow nothing); it may move none of the others.
 */
const WATCHED: Record<string, string> = {
  "support and help button": '[aria-label="support and help"]',
  "streak button": '[data-testid="streak-chip"]',
  "notification bell": '[aria-label="Notifications"]',
  "guide button": '[aria-label="Take a platform guide"]',
  "overflow button": '[data-testid="appbar-overflow"]',
  "avatar": '[data-testid="appbar-avatar-mobile"]',
  "phone dock": '[data-testid="mobile-nav"]',
};

type Box = { x: number; y: number; width: number; height: number };

async function boxes(page: Page): Promise<Record<string, Box | null>> {
  const out: Record<string, Box | null> = {};
  for (const [name, sel] of Object.entries(WATCHED)) {
    const el = page.locator(sel).first();
    out[name] = (await el.count()) ? await el.boundingBox() : null;
  }
  return out;
}

function expectUnmoved(
  before: Record<string, Box | null>,
  after: Record<string, Box | null>,
  what: string,
  /** The element being pointed at: its own hover transform is the affordance, not the bug. */
  except?: string
) {
  for (const name of Object.keys(before)) {
    if (name === except) continue;
    const a = before[name];
    const b = after[name];
    if (!a || !b) continue; // not on the bar at this width
    expect(
      { name, ...b },
      `${what} moved the ${name} (before ${JSON.stringify(a)}, after ${JSON.stringify(b)})`
    ).toEqual({ name, ...a });
  }
}

async function signIn(page: Page) {
  const origin = new URL(BASE).hostname;
  if (!PASSWORD) test.skip(true, "PERF_LOGIN_PASSWORD is not set");
  const api = await playwrightRequest.newContext();
  const res = await api.post(`${API}/accounts/clients/${CLIENT_ID}/user/login/`, {
    data: { email: EMAIL, password: PASSWORD },
  });
  expect(res.ok(), "login failed").toBeTruthy();
  const body = await res.json();
  await api.dispose();
  await page.context().addCookies([
    { name: "access_token", value: body.access_token, domain: origin, path: "/" },
    { name: "refresh_token", value: body.refresh_token, domain: origin, path: "/" },
    { name: "user_role", value: body.user?.role ?? "student", domain: origin, path: "/" },
  ]);
}

async function openBar(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  // Read-only run: the page may never write.
  await page.route("**/*", (route) =>
    ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort()
  );
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label="support and help"]', { timeout: 45_000 });
  await page.waitForTimeout(4000);
  await page.addStyleTag({ content: CLASSIC_SCROLLBAR });
  await page.waitForTimeout(500);
  // A space-taking scrollbar must actually be there, or this test proves nothing.
  const gutter = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
  expect(gutter, "no document scrollbar: the shift cannot be observed").toBeGreaterThan(0);
  await park(page);
}

/** Pointer somewhere harmless, and settled. */
async function park(page: Page) {
  await page.mouse.move(2, 700);
  await page.waitForTimeout(900);
}

/**
 * Every hover trigger on the bar at this width, with the watched box it IS (so its own transform
 * is not read as it pushing itself).
 */
async function triggers(page: Page): Promise<[string, Locator, string | undefined][]> {
  const all: [string, Locator, string | undefined][] = [
    ["hovering Today's Leaders", page.getByText("Today's Leaders", { exact: true }), undefined],
    ["hovering the streak pill", page.locator('[data-testid="streak-chip"]'), "streak button"],
    ["hovering the guide", page.locator('[aria-label="Take a platform guide"]'), "guide button"],
    ["hovering the notification bell", page.locator('[aria-label="Notifications"]'), "notification bell"],
    ["hovering the overflow button", page.locator('[data-testid="appbar-overflow"]'), "overflow button"],
    ["hovering the avatar", page.locator('[data-testid="appbar-avatar-mobile"]'), "avatar"],
    ["hovering the support and help button", page.locator('[aria-label="support and help"]'), "support and help button"],
  ];
  const out: [string, Locator, string | undefined][] = [];
  for (const [name, loc, self] of all) {
    if ((await loc.count()) && (await loc.first().isVisible())) out.push([name, loc.first(), self]);
  }
  return out;
}

for (const width of [1440, 390, 360]) {
  test(`the chrome stays put while the top bar is hovered @${width}`, async ({ page }) => {
    await signIn(page);
    await openBar(page, width);

    const atRest = await boxes(page);
    for (const [what, loc, self] of await triggers(page)) {
      await loc.hover();
      await page.waitForTimeout(900);
      expectUnmoved(atRest, await boxes(page), what, self);
      await page.keyboard.press("Escape").catch(() => {});
      await park(page);
      // ...and everything, the hovered one included, is back exactly where it was.
      expectUnmoved(atRest, await boxes(page), `${what} (after leaving)`);
    }
  });

  test(`the chrome stays put while the top bar is tabbed through @${width}`, async ({ page }) => {
    await signIn(page);
    await openBar(page, width);

    const atRest = await boxes(page);
    // Start from the document and walk the bar with the keyboard: a focus style may not reflow
    // its neighbours any more than a hover style may.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(220);
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? `${el.tagName}[${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 24) ?? ""}]` : "none";
      });
      expectUnmoved(atRest, await boxes(page), `focusing ${focused}`);
    }
  });
}
