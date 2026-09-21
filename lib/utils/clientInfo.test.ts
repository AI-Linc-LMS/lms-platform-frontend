import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The root layout's tenant fetch runs while `next build` prerenders every page. One dropped
 * connection there failed every Netlify site's build on 2026-09-21, so a transient failure must be
 * retried, while a misconfigured tenant (4xx) and a real outage must still fail loudly.
 */

vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

const CLIENT = { id: 34, name: "Demo", features: [] };
const ok = () => new Response(JSON.stringify(CLIENT), { status: 200 });

async function load() {
  vi.resetModules();
  return import("./clientInfo");
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_CLIENT_ID", "34");
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.test");
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function settle<T>(p: Promise<T>) {
  const out = p.then((v) => ({ v }), (e) => ({ e }));
  await vi.runAllTimersAsync();
  return out as Promise<{ v?: T; e?: unknown }>;
}

describe("getClientInfo", () => {
  it("survives a dropped connection instead of failing the build", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);
    const { getClientInfo } = await load();
    const r = await settle(getClientInfo());
    expect(r.e).toBeUndefined();
    expect(r.v).toEqual(CLIENT);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries a 5xx from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("", { status: 502 })).mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);
    const { getClientInfo } = await load();
    expect((await settle(getClientInfo())).v).toEqual(CLIENT);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails at once on a 4xx: a wrong tenant id must not be retried into a slow build", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getClientInfo } = await load();
    const r = await settle(getClientInfo());
    expect(String(r.e)).toMatch(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still fails loudly when the API is really down, rather than baking unbranded pages", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);
    const { getClientInfo, CLIENT_INFO_RETRY_DELAYS_MS } = await load();
    const r = await settle(getClientInfo());
    expect(String(r.e)).toMatch(/fetch failed/);
    expect(fetchMock).toHaveBeenCalledTimes(CLIENT_INFO_RETRY_DELAYS_MS.length + 1);
  });
});
