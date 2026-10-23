import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { isLoginNotPermitted } from "@/lib/auth/tenant-status";

/**
 * A removed student, or one no admin ever added, is refused with `login_not_permitted` on every
 * sign-in path. Before this, the central Google sign-in's redirect code was unknown to the login
 * page, so it said "Google sign-in didn't complete. Please try again." and sent them back to a
 * button that could never work. Every path now says the same thing: not enrolled here, contact
 * your administrator. The t() mock returns the key, so the assertions name the copy key.
 */

const { login, showToast } = vi.hoisted(() => ({ login: vi.fn(), showToast: vi.fn() }));

vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: null, loading: false, error: null, refreshClientInfo: vi.fn() }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", dir: () => "ltr" },
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));
vi.mock("@/components/auth/GoogleSignIn", () => ({ GoogleSignIn: () => null }));
vi.mock("@/components/auth/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ login, user: null, isAuthenticated: false, loading: false, celebrate: vi.fn() }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast }) }));

import LoginPage from "@/app/(auth)/login/page";

function at(search: string) {
  window.history.pushState({}, "", `/login${search}`);
}

afterEach(() => {
  at("");
  login.mockReset();
  showToast.mockReset();
});

describe("isLoginNotPermitted", () => {
  it("recognises the server's non-member refusal and nothing else", () => {
    expect(isLoginNotPermitted({ response: { status: 403, data: { code: "login_not_permitted" } } })).toBe(true);
    expect(isLoginNotPermitted({ response: { status: 403, data: { code: "tenant_inactive" } } })).toBe(false);
    expect(isLoginNotPermitted({ response: { status: 401, data: { error: "Invalid credentials" } } })).toBe(false);
    expect(isLoginNotPermitted(new Error("Network Error"))).toBe(false);
    expect(isLoginNotPermitted(null)).toBe(false);
  });
});

describe("the login page tells a non-member they are not enrolled", () => {
  it("after the central Google sign-in refuses them", async () => {
    at("?auth_error=login_not_permitted");
    render(<LoginPage />);
    expect(await screen.findByText("auth.notEnrolled")).toBeInTheDocument();
    expect(screen.queryByText("Google sign-in didn't complete. Please try again.")).toBeNull();
  });

  it("after a live session was ended because an admin removed them", async () => {
    at("?reason=not_permitted");
    render(<LoginPage />);
    expect(await screen.findByText("auth.notEnrolled")).toBeInTheDocument();
  });

  it("still gives an unknown Google code the generic sentence (control)", async () => {
    at("?auth_error=something_new");
    render(<LoginPage />);
    expect(await screen.findByText("Google sign-in didn't complete. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("auth.notEnrolled")).toBeNull();
  });

  it("after a password sign-in is refused, on the page rather than in a toast", async () => {
    login.mockRejectedValueOnce({
      response: { status: 403, data: { code: "login_not_permitted", detail: "server words" } },
    });
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/auth.email/), "removed@example.com");
    await userEvent.type(screen.getByLabelText(/auth.password/), "Correct-Password-1");
    await userEvent.click(screen.getByRole("button", { name: /auth\.login|Login|Sign in/i }));
    await waitFor(() => expect(login).toHaveBeenCalled());
    expect(await screen.findByText("auth.notEnrolled")).toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it("keeps every other password failure in a toast (control)", async () => {
    login.mockRejectedValueOnce({ response: { status: 401, data: { error: "Invalid credentials" } } });
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/auth.email/), "someone@example.com");
    await userEvent.type(screen.getByLabelText(/auth.password/), "Wrong-Password-1");
    await userEvent.click(screen.getByRole("button", { name: /auth\.login|Login|Sign in/i }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("Invalid credentials", "error"));
    expect(screen.queryByText("auth.notEnrolled")).toBeNull();
  });
});
