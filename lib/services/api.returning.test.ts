import axios from "axios";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ensureFreshAccessToken } from "./api";

/**
 * The first request after a learner comes back.
 *
 * The access token cookie expires after 7 days, the refresh token after 30. Coming back in between,
 * there is no access token at all - and the request interceptor treated "no token" as "a public
 * call", sent it unauthenticated, took the 401, THEN refreshed and retried. Every first request of
 * every returning session paid that round trip. It now refreshes up front when there is a refresh
 * token to do it with.
 */

const post = vi.spyOn(axios, "post");

function clearAll() {
  for (const name of ["access_token", "refresh_token"]) Cookies.remove(name);
}

beforeEach(() => {
  clearAll();
  post.mockReset();
});
afterEach(clearAll);

describe("ensureFreshAccessToken", () => {
  it("refreshes when the access token is gone but a refresh token is still there", async () => {
    Cookies.set("refresh_token", "r");
    post.mockResolvedValue({ data: { access: "new-access" } });
    await expect(ensureFreshAccessToken()).resolves.toBe("new-access");
    expect(post).toHaveBeenCalledTimes(1);
    expect(String(post.mock.calls[0][0])).toContain("/accounts/token/refresh/");
    expect(Cookies.get("access_token")).toBe("new-access");
  });

  it("leaves a genuinely logged-out visitor's call unauthenticated", async () => {
    await expect(ensureFreshAccessToken()).resolves.toBeUndefined();
    expect(post).not.toHaveBeenCalled();
  });

  it("does not refresh a token that is present and fresh", async () => {
    // A JWT whose exp is an hour from now.
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = `h.${btoa(JSON.stringify({ exp })).replace(/=+$/, "")}.s`;
    Cookies.set("access_token", token);
    Cookies.set("refresh_token", "r");
    await expect(ensureFreshAccessToken()).resolves.toBe(token);
    expect(post).not.toHaveBeenCalled();
  });
});
