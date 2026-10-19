// @vitest-environment jsdom
/**
 * Filling the form and pressing the button must actually call the API.
 *
 * It did not. The page used `password` / `confirmPassword` while
 * resetPasswordNewOnlySchema validates `new_password` / `confirm_password`, so Yup checked two
 * fields the form never rendered. Validation failed on every submit, Formik therefore never
 * called onSubmit, and the resulting errors attached to inputs that do not exist - so the
 * button did nothing at all: no request, no redirect, no error message.
 *
 * Nothing caught it. tsc is happy because Formik and Yup do not cross-check field names, the
 * backend tests drove the API directly, and the only page test asserted the proxy route entry.
 * A test has to press the button.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setPasswordFromOnboarding = vi.fn();
const replace = vi.fn();

vi.mock("@/lib/services/accounts.service", () => ({
  accountsService: { setPasswordFromOnboarding },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("token=a-real-looking-token"),
}));

const showToast = vi.fn();
vi.mock("@/components/common/Toast", () => ({
  useToast: () => ({ showToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/AuthLayout", () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

async function renderPage() {
  const Page = (await import("./page")).default;
  return render(<Page />);
}

function fill(value: string, confirm = value) {
  fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: confirm } });
}

describe("the set-password form", () => {
  beforeEach(() => {
    setPasswordFromOnboarding.mockReset();
    showToast.mockReset();
    replace.mockReset();
  });

  it("calls the API with the token and the chosen password", async () => {
    setPasswordFromOnboarding.mockResolvedValue({ detail: "ok", email: "a@b.test" });
    await renderPage();
    fill("Str0ngPassw0rd");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => expect(setPasswordFromOnboarding).toHaveBeenCalled());
    expect(setPasswordFromOnboarding).toHaveBeenCalledWith(
      "a-real-looking-token",
      "Str0ngPassw0rd"
    );
  });

  it("confirms success and says which address to sign in with", async () => {
    setPasswordFromOnboarding.mockResolvedValue({ detail: "ok", email: "asha@school.test" });
    await renderPage();
    fill("Str0ngPassw0rd");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/your password is set/i)).toBeInTheDocument();
    expect(screen.getByText(/asha@school.test/)).toBeInTheDocument();
  });

  it("shows the server's message when the link is spent, rather than failing silently", async () => {
    setPasswordFromOnboarding.mockRejectedValue({
      response: { data: { detail: "This link is no longer valid.", code: "invalid_token" } },
    });
    await renderPage();
    fill("Str0ngPassw0rd");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(showToast.mock.calls[0][0]).toMatch(/no longer valid/i);
  });

  /**
   * A toast is gone in three seconds. Browser-checking this flow on a phone, the 400 for
   * "password is too similar to the username" showed for a moment and then left a form that
   * looked exactly as it had before the tap - indistinguishable from the field-name bug this
   * page already shipped once. The refusal has to stay on the page.
   */
  it("keeps the server's refusal on the page after the toast is gone", async () => {
    setPasswordFromOnboarding.mockRejectedValue({
      response: { data: { detail: "The password is too similar to the username." } },
    });
    await renderPage();
    fill("Str0ngPassw0rd");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/too similar to the username/i);
  });

  it("clears the previous refusal when the learner tries again", async () => {
    setPasswordFromOnboarding.mockRejectedValueOnce({
      response: { data: { detail: "The password is too similar to the username." } },
    });
    await renderPage();
    fill("Str0ngPassw0rd");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));
    await screen.findByRole("alert");

    setPasswordFromOnboarding.mockResolvedValue({ detail: "ok", email: "asha@school.test" });
    fill("An0therPassw0rd");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/your password is set/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not call the API when the two passwords differ", async () => {
    await renderPage();
    fill("Str0ngPassw0rd", "Different0ne");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() => expect(screen.getByText(/passwords must match/i)).toBeInTheDocument());
    expect(setPasswordFromOnboarding).not.toHaveBeenCalled();
  });

  it("shows a reason when the password is too weak, rather than doing nothing", async () => {
    await renderPage();
    fill("abc");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    );
    expect(setPasswordFromOnboarding).not.toHaveBeenCalled();
  });
});
