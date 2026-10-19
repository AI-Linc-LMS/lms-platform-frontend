/**
 * The emailed link has to survive the proxy.
 *
 * /set-password is where an admin-added learner lands from their invitation, with no session
 * and no password. If it is not in publicRoutes the proxy 307s to /login and the redirect
 * DROPS the token - verified live before this page existed:
 *
 *   learn.agileologyedu.com/set-password?token=abc
 *     -> 307 https://learn.agileologyedu.com/login?redirect=%2Fset-password
 *
 * The token is gone, and with it the only way into that account. This asserts the entry is
 * there, because the failure is invisible in every local test: the page renders perfectly in
 * isolation and only dies in front of a real learner.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const proxy = readFileSync(join(process.cwd(), "proxy.ts"), "utf8");

describe("the set-password route", () => {
  it("is listed as public so the token is not stripped on the way in", () => {
    const block = proxy.slice(
      proxy.indexOf("const publicRoutes"),
      proxy.indexOf("const isPublicRoute")
    );
    expect(block).toContain('"/set-password"');
  });

  it("sits beside the other credential routes, not somewhere unrelated", () => {
    const block = proxy.slice(
      proxy.indexOf("const publicRoutes"),
      proxy.indexOf("const isPublicRoute")
    );
    for (const route of ['"/login"', '"/forgot-password"', '"/set-password"']) {
      expect(block).toContain(route);
    }
  });
});
