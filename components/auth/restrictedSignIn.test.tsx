import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * A tenant with `restrict_login_to_added_members` creates its own accounts, and the server refuses
 * every self-signup and every Google sign-in from a stranger. The auth pages must not then offer
 * a form whose only outcome is that refusal: the login page drops its "Sign up" link for a sentence
 * that says what to do, and the signup page says the same instead of rendering the form.
 *
 * The flag is read unauthenticated off client-info, exactly as the instructor-signup flag is, so
 * these mock that one hook and nothing about the server. Everything heavy around the pages
 * (Google button, layout, auth, router, toast, i18n) is stubbed; what is under test is the branch.
 */

const clientInfoState: { clientInfo: Record<string, unknown> | null; loading: boolean } = {
  clientInfo: null,
  loading: false,
};

vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ ...clientInfoState, error: null, refreshClientInfo: vi.fn() }),
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
  useAuth: () => ({ login: vi.fn(), user: null, isAuthenticated: false }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/accounts.service", () => ({
  accountsService: { signup: vi.fn(), initiateSignup: vi.fn() },
}));
vi.mock("mui-tel-input", () => ({
  MuiTelInput: (props: { value?: string }) => <input aria-label="phone" value={props.value ?? ""} readOnly />,
}));

import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";

afterEach(() => {
  clientInfoState.clientInfo = null;
  clientInfoState.loading = false;
});

describe("the login page on a restricted tenant", () => {
  it("replaces the sign-up link with the sentence that says what to do", () => {
    clientInfoState.clientInfo = { restrict_login_to_added_members: true };
    render(<LoginPage />);
    expect(screen.getByTestId("restricted-sign-in")).toHaveTextContent("auth.restrictedSignIn");
    expect(screen.queryByRole("link", { name: "auth.signUp" })).toBeNull();
  });

  it("still offers sign-up on an open tenant", () => {
    clientInfoState.clientInfo = { restrict_login_to_added_members: false };
    render(<LoginPage />);
    expect(screen.queryByTestId("restricted-sign-in")).toBeNull();
    expect(screen.getByRole("link", { name: "auth.signUp" })).toHaveAttribute("href", "/signup");
  });

  it("offers sign-up while client-info has not arrived, rather than guessing closed", () => {
    clientInfoState.clientInfo = null;
    clientInfoState.loading = true;
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: "auth.signUp" })).toBeInTheDocument();
  });
});

describe("the signup page on a restricted tenant", () => {
  it("says sign-up is by invitation instead of rendering the form", () => {
    clientInfoState.clientInfo = { restrict_login_to_added_members: true };
    render(<SignupPage />);
    expect(screen.getByTestId("restricted-signup")).toHaveTextContent("auth.restrictedSignUpTitle");
    expect(screen.getByTestId("restricted-signup")).toHaveTextContent("auth.restrictedSignIn");
    expect(document.querySelector("form")).toBeNull();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/login");
  });

  it("renders the form on an open tenant", () => {
    clientInfoState.clientInfo = { restrict_login_to_added_members: false };
    render(<SignupPage />);
    expect(screen.queryByTestId("restricted-signup")).toBeNull();
    expect(document.querySelector("form")).not.toBeNull();
  });

  it("does not flash the notice while client-info is still loading", () => {
    clientInfoState.clientInfo = { restrict_login_to_added_members: true };
    clientInfoState.loading = true;
    render(<SignupPage />);
    expect(screen.queryByTestId("restricted-signup")).toBeNull();
    expect(document.querySelector("form")).not.toBeNull();
  });
});
