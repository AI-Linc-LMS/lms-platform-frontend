import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

/**
 * What the Razorpay checkout sheet is actually opened with.
 *
 * Two fields were wrong for every purchase on every tenant: `amount` carried the major-unit price
 * (1 for a 1 SAR order, where checkout expects 100 halalas), and `prefill.contact` read
 * `user.phone`, which the profile payload never fills, so it was always blank.
 */

const mocks = vi.hoisted(() => ({
  user: null as Record<string, unknown> | null,
  order: {} as Record<string, unknown>,
  opened: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { name: "InUn" } }),
}));
vi.mock("@/lib/config", () => ({ config: { clientId: "28" } }));
vi.mock("@/lib/services/payment.service", () => ({
  PaymentType: { ADAPTIVE_COURSE: "ADAPTIVE_COURSE" },
  paymentService: { createOrder: vi.fn(async () => mocks.order), verifyPayment: vi.fn() },
}));
vi.mock("@/lib/utils/razorpay", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/razorpay")>()),
  loadRazorpayScript: vi.fn(async () => true),
}));

import { usePayment } from "./usePayment";
import { PaymentType } from "@/lib/services/payment.service";

class FakeRazorpay {
  constructor(options: Record<string, unknown>) {
    mocks.opened.push(options);
  }
  on() {}
  open() {}
}

async function openCheckout() {
  const { result } = renderHook(() => usePayment());
  await act(async () => {
    await result.current.handlePayment({
      typeId: "38",
      paymentType: PaymentType.ADAPTIVE_COURSE,
      description: "Data Science",
    });
  });
  expect(mocks.opened).toHaveLength(1);
  return mocks.opened[0] as { amount?: unknown; prefill: Record<string, unknown> };
}

beforeEach(() => {
  mocks.opened = [];
  mocks.user = { first_name: "Sara", last_name: "A", email: "s@x.com", phone: "", phone_number: "+966501234567" };
  mocks.order = { order_id: "order_1", key: "rzp_live_x", currency: "SAR", amount: 1, amount_minor: 100 };
  (window as unknown as { Razorpay: unknown }).Razorpay = FakeRazorpay;
});

describe("usePayment checkout options", () => {
  it("sends the minor-unit amount the order was created with, not the display price", async () => {
    const options = await openCheckout();
    expect(options.amount).toBe(100);
  });

  it("leaves the amount out rather than guessing when the server gives no minor figure", async () => {
    mocks.order = { order_id: "order_1", key: "rzp_live_x", currency: "SAR", amount: 1 };
    const options = await openCheckout();
    expect("amount" in options).toBe(false);
  });

  it.each([
    ["a fractional amount_minor", 100.5],
    ["a string amount_minor", "100"],
    ["a zero amount_minor", 0],
  ])("does not trust %s", async (_label, amountMinor) => {
    mocks.order = { ...mocks.order, amount_minor: amountMinor };
    const options = await openCheckout();
    expect("amount" in options).toBe(false);
  });

  it("prefills the profile's phone_number with its country code", async () => {
    const options = await openCheckout();
    expect(options.prefill.contact).toBe("+966501234567");
  });

  it("gives an older bare Indian mobile its +91", async () => {
    mocks.user = { ...mocks.user, phone_number: "9876543210" };
    const options = await openCheckout();
    expect(options.prefill.contact).toBe("+919876543210");
  });

  it("sends no contact at all for a number whose country it cannot know", async () => {
    // Razorpay would read a bare number as Indian; a blank field lets the learner type it.
    mocks.user = { ...mocks.user, phone_number: "0501234567" };
    const options = await openCheckout();
    expect("contact" in options.prefill).toBe(false);
  });

  it("sends no contact for a learner with no number", async () => {
    mocks.user = { ...mocks.user, phone_number: null };
    const options = await openCheckout();
    expect("contact" in options.prefill).toBe(false);
  });
});
