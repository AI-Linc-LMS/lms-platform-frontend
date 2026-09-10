import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/accounts/clients/<id>/user-profile/` was requested TWICE on every authenticated page load.
 * AuthProvider and ProfileGateProvider are both mounted in the root layout and both call it,
 * through two services that happen to hit the identical URL. At the measured backend latency of
 * 120-340 ms that is ~250 ms added to every hard navigation, on every route, for a second copy
 * of bytes the app already had.
 */
const PROFILE = { id: 1, role: "student", is_profile_active: true } as const;

let getMock: ReturnType<typeof vi.fn>;
vi.mock("./api", () => ({
  default: { get: (...a: unknown[]) => getMock(...a) },
}));
// config.clientId throws when NEXT_PUBLIC_CLIENT_ID is unset — deliberately, so a tenant build
// cannot silently fall back. The URL is not what these tests are about.
vi.mock("../config", () => ({ config: { clientId: "55" } }));

async function load() {
  vi.resetModules();
  return import("./user-profile-request");
}

describe("the boot fan-out collapses to one request", () => {
  beforeEach(() => {
    getMock = vi.fn(async () => ({ data: { ...PROFILE } }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("two concurrent callers share a single in-flight request", async () => {
    const { fetchUserProfileOnce } = await load();
    const [a, b] = await Promise.all([fetchUserProfileOnce(), fetchUserProfileOnce()]);
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(PROFILE);
    expect(b).toEqual(PROFILE);
  });

  it("a sequential caller inside the boot window reuses the answer", async () => {
    const { fetchUserProfileOnce } = await load();
    await fetchUserProfileOnce();
    await fetchUserProfileOnce();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("each caller gets its OWN object", async () => {
    // auth-context assigns to `userProfile.role` when the API omits it. Sharing one object would
    // let that write land in ProfileGate's copy — and only for users whose profile has no role,
    // which is precisely the case that code path exists for.
    const { fetchUserProfileOnce } = await load();
    const a = await fetchUserProfileOnce<{ role: string }>();
    const b = await fetchUserProfileOnce<{ role: string }>();
    expect(a).not.toBe(b);
    a.role = "instructor";
    expect(b.role).toBe("student");
  });

  it("a failure does not get latched — the next caller retries", async () => {
    const { fetchUserProfileOnce } = await load();
    getMock.mockRejectedValueOnce(new Error("boom"));
    await expect(fetchUserProfileOnce()).rejects.toThrow("boom");
    getMock.mockResolvedValueOnce({ data: { ...PROFILE } });
    await expect(fetchUserProfileOnce()).resolves.toEqual(PROFILE);
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("reset forces the next reader back to the server", async () => {
    const { fetchUserProfileOnce, resetUserProfileCache } = await load();
    await fetchUserProfileOnce();
    resetUserProfileCache();
    await fetchUserProfileOnce();
    expect(getMock).toHaveBeenCalledTimes(2);
  });
});

describe("the cache is actually invalidated where it must be", () => {
  // The first version of this change put resetUserProfileCache() AFTER the return statement in
  // all three call sites, so it never ran. Unreachable code typechecks perfectly.
  const reachable = (file: string, fn: string) => {
    const src = readFileSync(join(process.cwd(), file), "utf8");
    const start = src.indexOf(fn);
    expect(start, `${fn} not found in ${file}`).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf("\n  },", start));
    const reset = body.indexOf("resetUserProfileCache()");
    expect(reset, `${fn} must invalidate the boot copy`).toBeGreaterThan(-1);
    const ret = body.indexOf("return ");
    expect(ret, `${fn} should return something`).toBeGreaterThan(-1);
    expect(reset, `${fn}: the reset is after the return, so it never runs`).toBeLessThan(ret);
  };

  it("accounts.service.updateUserProfile invalidates before returning", () =>
    reachable("lib/services/accounts.service.ts", "updateUserProfile: async ("));

  it("accounts.service.logout invalidates before returning", () =>
    reachable("lib/services/accounts.service.ts", "logout: async ("));

  it("profile.service.updateUserProfile invalidates before returning", () =>
    reachable("lib/services/profile.service.ts", "updateUserProfile: async ("));
});

describe("both callers actually route through the shared request", () => {
  // Without this the helper can be perfect and still dead: reverting either service back to its
  // own apiClient.get() leaves every test above passing while the double fetch returns.
  const usesSharedFetch = (file: string) => {
    const src = readFileSync(join(process.cwd(), file), "utf8");
    const start = src.indexOf("getUserProfile: async (");
    expect(start, `getUserProfile not found in ${file}`).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf("\n  },", start));
    expect(body, `${file} must not fetch user-profile directly any more`)
      .not.toMatch(/apiClient\s*\.\s*get/);
    expect(body, `${file} must go through fetchUserProfileOnce`)
      .toContain("fetchUserProfileOnce");
  };

  it("accounts.service.getUserProfile", () =>
    usesSharedFetch("lib/services/accounts.service.ts"));

  it("profile.service.getUserProfile", () =>
    usesSharedFetch("lib/services/profile.service.ts"));
});
