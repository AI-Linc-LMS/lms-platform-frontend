/**
 * A learner who comes back after a week is still signed in - and the app must know it.
 *
 * Reported as "the left-side navigation bar appears empty when returning to the website, and only
 * loads after manually refreshing". The access token cookie lasts 7 days and the refresh token 30.
 * Returning in between left only the refresh token, and the auth context - which asked
 * "is there an access token?" - concluded nobody was signed in: no user, no role, no nav. The
 * dashboard still loaded, because its own requests refreshed the token, so a reload then "fixed"
 * it. These pin the returning state from the auth context's side.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserProfile = vi.fn();
vi.mock("../services/accounts.service", () => ({
  accountsService: {
    getUserProfile: (...args: unknown[]) => getUserProfile(...args),
    login: vi.fn(), googleLogin: vi.fn(), logout: vi.fn(),
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/common/AuthCelebration", () => ({ AuthCelebration: () => null }));

import { AuthProvider, useAuth } from "./auth-context";
import { authUtils } from "./auth-utils";

function Probe() {
  const { user, loading } = useAuth();
  return <div data-testid="probe">{loading ? "loading" : user ? `role:${user.role}` : "signed-out"}</div>;
}

function clearAll() {
  for (const name of ["access_token", "refresh_token", "user_role"]) Cookies.remove(name);
}

beforeEach(() => {
  clearAll();
  getUserProfile.mockReset();
});
afterEach(clearAll);

describe("a session with only the refresh token left", () => {
  it("counts as a session", () => {
    Cookies.set("refresh_token", "r");
    expect(authUtils.hasSession()).toBe(true);
    expect(authUtils.isAuthenticated()).toBe(false);
  });

  it("restores the user - the profile call is made, and the role arrives", async () => {
    Cookies.set("refresh_token", "r");
    Cookies.set("user_role", "student");
    getUserProfile.mockResolvedValue({ id: 5, role: "student", is_profile_active: true });
    await act(async () => {
      render(<AuthProvider><Probe /></AuthProvider>);
    });
    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("role:student"));
    expect(getUserProfile).toHaveBeenCalledTimes(1);
  });

  it("keeps the role from the cookie if the profile call fails", async () => {
    // The 30-day role cookie is enough to draw the right nav while the network misbehaves.
    Cookies.set("refresh_token", "r");
    Cookies.set("user_role", "admin");
    getUserProfile.mockRejectedValue(new Error("offline"));
    await act(async () => {
      render(<AuthProvider><Probe /></AuthProvider>);
    });
    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("role:admin"));
  });
});

describe("somebody genuinely signed out", () => {
  it("is not asked for a profile at all", async () => {
    await act(async () => {
      render(<AuthProvider><Probe /></AuthProvider>);
    });
    await waitFor(() => expect(screen.getByTestId("probe").textContent).toBe("signed-out"));
    expect(getUserProfile).not.toHaveBeenCalled();
  });
});
