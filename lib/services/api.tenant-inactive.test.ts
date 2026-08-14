import { AxiosError, AxiosHeaders } from "axios";
import Cookies from "js-cookie";
import { describe, expect, it } from "vitest";
import apiClient from "./api";
import { isTenantDeactivated } from "@/lib/auth/tenant-status";

/**
 * The deactivated-tenant latch is a ONE-WAY module flag, so the whole contract has to be
 * asserted in a single pass: once it is raised, no later test in this file could observe the
 * "before" state again.
 */

/** Reject the way a real backend does, so the response interceptor sees a genuine AxiosError. */
function rejectWith(status: number, data: unknown) {
  return async () => {
    const error = new AxiosError(
      `Request failed with status code ${status}`,
      String(status),
      undefined,
      null,
      {
        status,
        statusText: "",
        data,
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      },
    );
    throw error;
  };
}

describe("403 tenant_inactive", () => {
  it("clears the session, latches the flag, and never settles the caller's promise", async () => {
    Cookies.set("access_token", "a");
    Cookies.set("refresh_token", "r");
    Cookies.set("user_role", "student");
    expect(isTenantDeactivated()).toBe(false);

    apiClient.defaults.adapter = rejectWith(403, { code: "tenant_inactive" });

    const settled = await Promise.race([
      apiClient.get("/anything/").then(
        () => "resolved",
        () => "rejected",
      ),
      new Promise<string>((r) => setTimeout(() => r("pending"), 50)),
    ]);

    // Pending on purpose: a settled rejection would let every in-flight widget stack its own
    // error toast on top of the deactivated screen.
    expect(settled).toBe("pending");
    expect(isTenantDeactivated()).toBe(true);
    expect(Cookies.get("access_token")).toBeUndefined();
    expect(Cookies.get("refresh_token")).toBeUndefined();
    expect(Cookies.get("user_role")).toBeUndefined();
  });

  it("leaves an ordinary 403 alone, so a per-object permission denial still reaches its caller", async () => {
    apiClient.defaults.adapter = rejectWith(403, {
      detail: "You do not have permission to perform this action.",
    });

    await expect(apiClient.get("/anything/")).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});
