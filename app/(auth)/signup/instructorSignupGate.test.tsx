// @vitest-environment jsdom
/**
 * Signing up as an instructor must not be possible through Google.
 *
 * Google sends an id_token and nothing else. `GoogleLoginView` creates the UserProfile with
 * `get_or_create(user=..., client=...)` and no `role`, so it takes the model default,
 * `student` - and there is no CV and no `pending_status` either, which the email path both
 * requires and sets. So pressing "Sign up with Google" with the instructor switch on produced
 * an ordinary approved student, with no application for an admin to review and nothing on
 * screen saying the choice had been dropped.
 *
 * The switch therefore has to be able to disable that button, which is why it is component
 * state rather than a Formik field: the Google button renders outside <Formik>.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signup = vi.fn(async () => ({}));
vi.mock("@/lib/services/accounts.service", () => ({
  accountsService: { signup },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

const showToast = vi.fn();
vi.mock("@/components/common/Toast", () => ({
  useToast: () => ({ showToast }),
}));

vi.mock("@/components/auth/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({
    clientInfo: { allow_instructor_self_signup: true },
    loading: false,
  }),
}));

/**
 * The real GoogleSignIn is stubbed down to the one thing under test: whether it was handed
 * `disabled`. Its own disabled path (MUI `disabled`, `pointerEvents: none` on both the visible
 * button and the GSI overlay, and an early return in the redirect fallback) is already wired;
 * what this file pins is that signup passes the flag at all.
 */
vi.mock("@/components/auth/GoogleSignIn", () => ({
  GoogleSignIn: ({ disabled, label }: { disabled?: boolean; label?: string }) => (
    <button type="button" disabled={disabled} data-testid="google">
      {label}
    </button>
  ),
}));

async function renderPage() {
  const Page = (await import("./page")).default;
  return render(<Page />);
}

const toggle = () => screen.getByRole("switch");
const google = () => screen.getByTestId("google") as HTMLButtonElement;

describe("the instructor switch and Google", () => {
  beforeEach(() => {
    signup.mockClear();
    showToast.mockClear();
  });

  it("leaves Google enabled for a student signup", async () => {
    await renderPage();
    expect(google().disabled).toBe(false);
  });

  it("disables Google as soon as the switch goes on", async () => {
    await renderPage();
    fireEvent.click(toggle());
    await waitFor(() => expect(google().disabled).toBe(true));
  });

  it("says why, instead of leaving a dead grey button", async () => {
    // A disabled control with no explanation beside it is the UI version of a bare 403: the
    // one thing the person needs is that the switch did this and the email form still works.
    await renderPage();
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(toggle());
    const note = await screen.findByRole("status");
    expect(note.textContent).toMatch(/cv|email/i);
  });

  it("re-enables Google when the switch goes back off", async () => {
    await renderPage();
    fireEvent.click(toggle());
    await waitFor(() => expect(google().disabled).toBe(true));
    fireEvent.click(toggle());
    await waitFor(() => expect(google().disabled).toBe(false));
  });

  it("puts the switch above the Google button in the document", async () => {
    // Order is the point of the change: the switch used to sit below the password fields, so
    // the obvious action - press Google - came first. DOCUMENT_POSITION_FOLLOWING means the
    // button comes after the switch.
    await renderPage();
    const rel = toggle().compareDocumentPosition(google());
    expect(rel & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("the email form still carries the role", () => {
  beforeEach(() => signup.mockClear());

  it("blocks submit until a CV is attached, then sends signup_as: instructor", async () => {
    await renderPage();

    const field = (id: string) =>
      document.getElementById(id) as HTMLInputElement;
    fireEvent.change(field("first_name"), { target: { value: "Asha" } });
    fireEvent.change(field("last_name"), { target: { value: "Rao" } });
    fireEvent.change(field("email"), { target: { value: "asha@x.com" } });
    fireEvent.click(toggle());

    // No CV yet, so the submit button is unavailable rather than silently posting an
    // application with nothing to review.
    const submit = document.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit.disabled).toBe(true));

    const file = new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(submit.disabled).toBe(false));
  });
});
