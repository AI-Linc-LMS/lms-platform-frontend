import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type { EmailJob } from "@/lib/services/admin/admin-email-jobs.service";

/**
 * Admin Settings and the email job card on a phone.
 *
 * jsdom has no layout, so what is pinned is the emitted CSS: each phone-only size sits inside the
 * max-width:599.95px block (a phone sees it) and nowhere a desktop browser can see it, and each
 * raised type size keeps its authored value from 600px up.
 */

vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/razorpay.service", () => ({
  razorpayService: {
    get: vi.fn(async () => ({
      connected: true,
      webhook_ready: true,
      credentials: {
        key_id_masked: "rzp_live_****1234",
        settles_to: "tenant",
        secret_configured: true,
        webhook_configured: true,
        webhook_url: "https://be.example.com/webhooks/clients/34/razorpay/",
        is_active: true,
      },
    })),
    save: vi.fn(),
  },
}));

import { MediaField } from "@/components/admin/branding/MediaField";
import { PaymentAccountCard } from "./PaymentAccountCard";
import { RazorpaySetupGuide } from "./RazorpaySetupGuide";
import { EmailJobCard } from "@/components/admin/emails/EmailJobCard";

afterEach(() => cleanup());

/** `decl` reaches a phone and no desktop browser. */
function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

describe("MediaField on a phone", () => {
  const field = () =>
    render(
      <MediaField
        label="Logo"
        value="https://cdn.example.com/logo.png"
        onChange={() => {}}
        onUpload={() => {}}
        brandText="Demo Client"
      />
    );

  it("the clear button is a 44px target on a phone and stays 22px on a desktop", () => {
    field();
    const clear = screen.getByRole("button", { name: "Clear Logo" });
    expectPhoneOnly(clear, /width:44px;height:44px/);
    expect(cssByMedia(clear).unscoped).toMatch(/width:22px/);
  });

  it("the URL input is 44px tall on a phone only", () => {
    field();
    const input = screen.getByLabelText("Logo URL").closest(".MuiTextField-root")!;
    expectPhoneOnly(input, /\.MuiOutlinedInput-root\{min-height:44px/);
  });

  it("the preview tile stacks above the fields on a phone only", () => {
    field();
    const row = screen.getByLabelText("Logo preview").parentElement!;
    expectPhoneOnly(row, /flex-direction:column/);
  });

  it("the sample brand name is 12px on a phone, 0.55rem on a desktop", () => {
    field();
    const brand = screen.getByText("Demo Client");
    expectPhoneOnly(brand, /font-size:0\.75rem/);
    expect(cssByMedia(brand).unscoped).toMatch(/font-size:0\.55rem/);
  });
});

describe("PaymentAccountCard on a phone", () => {
  it("the copy button and the actions are 44px on a phone only", async () => {
    render(<PaymentAccountCard />);
    const copy = await screen.findByRole("button", { name: "Copy webhook URL" });
    expectPhoneOnly(copy, /width:44px;height:44px/);
    const actions = screen.getByRole("button", { name: /Pause payments/ }).parentElement!;
    expectPhoneOnly(actions, /\.MuiButton-root\{min-height:44px/);
    const guide = screen.getByRole("button", { name: /setup guide/ });
    expectPhoneOnly(guide, /min-height:44px/);
  });
});

describe("RazorpaySetupGuide on a phone", () => {
  it("inline code is 12px on a phone and keeps 0.72rem from 600px up", () => {
    render(<RazorpaySetupGuide webhookUrl="https://x" />);
    const code = screen.getByText("order.paid");
    const css = cssByMedia(code);
    expect(css.base).toMatch(/font-size:0\.75rem/);
    expect(css.desktop).toMatch(/font-size:0\.72rem/);
  });
});

describe("EmailJobCard on a phone", () => {
  const job = {
    task_id: "t1",
    status: "failed",
    subject: "Reminder",
    created_at: "2026-09-01T10:00:00Z",
    trigger_source: "reminder_120m",
  } as unknown as EmailJob;

  const card = () =>
    render(
      <EmailJobCard
        job={job}
        displayName="Reminder"
        createdLabel="1 Sep 2026"
        isFailed
        retrying={false}
        onView={() => {}}
        onRetry={() => {}}
      />
    );

  it("Retry and View are 44px targets and the footer wraps, on a phone only", () => {
    card();
    const footer = screen.getByRole("button", { name: /View/ }).parentElement!.parentElement!;
    expectPhoneOnly(footer, /flex-wrap:wrap/);
    expectPhoneOnly(footer, /\.MuiButtonBase-root\{min-height:44px/);
  });

  it("the status, trigger and date labels reach 12px on a phone and keep their desktop sizes", () => {
    card();
    for (const [text, desk] of [
      ["failed", "0.68rem"],
      ["Reminder · 2h before", "0.7rem"],
      ["1 Sep 2026", "0.72rem"],
    ]) {
      const css = cssByMedia(screen.getByText(text));
      expect(css.base).toMatch(/font-size:0\.75rem/);
      expect(css.desktop).toContain(`font-size:${desk}`);
    }
  });
});
