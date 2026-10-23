import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A live session the server has stopped honouring (403 `login_not_permitted` on an AUTHENTICATED
 * request) is dropped once and sent to sign-in with the reason, and the rejection is swallowed so
 * every in-flight widget does not toast the same sentence. The sign-in doors' own 403s are left
 * to the form that made them, and a 403 with any other code is an ordinary rejection.
 */

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));
vi.mock("@/lib/auth/tenant-status", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/tenant-status")>();
  return { ...actual, signOutNotPermitted: signOut, markTenantDeactivated: vi.fn() };
});

import apiClient, { getIsLoggingOut, setLoggingOut } from "@/lib/services/api";

type Rejected = (error: unknown) => Promise<unknown>;
function rejectedHandler(): Rejected {
  const handlers = (apiClient.interceptors.response as unknown as { handlers: { rejected: Rejected }[] })
    .handlers;
  return handlers[0].rejected;
}

function axiosError(status: number, code: string | undefined, url: string, withToken: boolean) {
  return {
    isAxiosError: true,
    config: { url, headers: withToken ? { Authorization: "Bearer x" } : {}, _retry: false },
    response: { status, data: code ? { code, detail: "refused" } : {} },
  };
}

async function settles(p: Promise<unknown>): Promise<"resolved" | "rejected" | "pending"> {
  return Promise.race([
    p.then(
      () => "resolved" as const,
      () => "rejected" as const,
    ),
    new Promise<"pending">((r) => setTimeout(() => r("pending"), 25)),
  ]);
}

beforeEach(() => {
  setLoggingOut(false);
  signOut.mockClear();
});
afterEach(() => {
  setLoggingOut(false);
});

describe("a gated-out session", () => {
  it("is dropped once, sent to sign-in, and the rejection never settles", async () => {
    const p = rejectedHandler()(
      axiosError(403, "login_not_permitted", "/accounts/clients/33/user-profile/", true),
    );
    expect(await settles(p)).toBe("pending");
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(getIsLoggingOut()).toBe(true);

    // The second in-flight widget to fail does not drop the session again.
    const q = rejectedHandler()(
      axiosError(403, "login_not_permitted", "/adaptive-journey/api/learner/dashboard/", true),
    );
    expect(await settles(q)).toBe("pending");
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("leaves the sign-in doors' own refusals to their forms", async () => {
    for (const url of [
      "/accounts/clients/33/user/login/",
      "/accounts/clients/33/user/login/google/",
      "/accounts/clients/33/user/signup/",
      "/accounts/clients/33/user/verify-email/",
      "/accounts/clients/33/user/resend-verification-email/",
    ]) {
      const p = rejectedHandler()(axiosError(403, "login_not_permitted", url, true));
      expect(await settles(p), url).toBe("rejected");
    }
    expect(signOut).not.toHaveBeenCalled();
    expect(getIsLoggingOut()).toBe(false);
  });

  it("ignores an unauthenticated request and a 403 with any other code", async () => {
    const anon = rejectedHandler()(
      axiosError(403, "login_not_permitted", "/api/clients/33/client-info/", false),
    );
    expect(await settles(anon)).toBe("rejected");
    const other = rejectedHandler()(
      axiosError(403, "permission_denied", "/accounts/clients/33/user-profile/", true),
    );
    expect(await settles(other)).toBe("rejected");
    expect(signOut).not.toHaveBeenCalled();
  });
});
