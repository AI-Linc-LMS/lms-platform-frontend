import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Every refusal the build endpoint documents has to reach the learner as something they can act
 * on.
 *
 * Reported as "it is not asking for payments but it is not generating the course too". The
 * service translated ONLY a 422. A 402 (free build spent), a 429 (another build running, or the
 * daily ceiling of twelve) and a 404 left as bare axios errors, and the roadmap page collapsed
 * all of them into one generic sentence which it rendered behind the still-open drawer. Nothing
 * reached the learner at all — no course, and no way to pay for one.
 *
 * The other half is `PaymentType`: the server has accepted `ROADMAP` orders since the paywall
 * shipped, and the enum had no member for it, so no code path could open checkout.
 */

vi.mock("@/lib/services/api", () => ({
  default: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import apiClient from "@/lib/services/api";
import { ForgeUnavailableError, forgeService } from "@/lib/services/roadmaps.service";
import { PaymentType } from "@/lib/services/payment.service";

const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

const axiosError = (status: number, data: Record<string, unknown>) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  });

const build = () => forgeService.create({ nodeId: 412 });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("a refused build says why", () => {
  it("turns the paywall into a message with a price, not a bare axios error", async () => {
    post.mockRejectedValueOnce(
      axiosError(402, {
        detail: "You have used your free course build. Upgrade to build more from a roadmap.",
        payment_required: true,
        payment_type: "ROADMAP",
        code: "allowance_exhausted",
        price: "99.00",
        currency: "INR",
      })
    );
    const err = await build().catch((e) => e);
    expect(err).toBeInstanceOf(ForgeUnavailableError);
    expect(err.code).toBe("allowance_exhausted");
    expect(err.paymentRequired).toBe(true);
    expect(err.price).toBe("99.00");
    expect(err.currency).toBe("INR");
    expect(err.message).toMatch(/free course build/i);
  });

  it("does not offer checkout when the tenant has put nothing on sale", async () => {
    // The server declines rather than building a course that could never be opened. There is
    // no amount, so `paymentRequired` must stay false however the body is dressed up.
    post.mockRejectedValueOnce(
      axiosError(402, {
        detail: "You have used your free course build, and more builds are not on sale here yet.",
        payment_required: false,
        code: "not_for_sale",
        price: null,
        currency: "INR",
      })
    );
    const err = await build().catch((e) => e);
    expect(err).toBeInstanceOf(ForgeUnavailableError);
    expect(err.code).toBe("not_for_sale");
    expect(err.paymentRequired).toBe(false);
    expect(err.price).toBeNull();
  });

  it("speaks the daily ceiling out loud", async () => {
    post.mockRejectedValueOnce(
      axiosError(429, {
        detail: "You have built a lot of courses today. Try again tomorrow.",
        code: "daily_limit",
      })
    );
    const err = await build().catch((e) => e);
    expect(err).toBeInstanceOf(ForgeUnavailableError);
    expect(err.code).toBe("daily_limit");
    expect(err.message).toMatch(/tomorrow/i);
  });

  it("speaks a build that is already running out loud", async () => {
    post.mockRejectedValueOnce(
      axiosError(429, {
        detail: "One course is already being built. Give it a moment.",
        code: "build_in_progress",
      })
    );
    const err = await build().catch((e) => e);
    expect(err).toBeInstanceOf(ForgeUnavailableError);
    expect(err.code).toBe("build_in_progress");
  });

  it("still translates the 422 it always did", async () => {
    post.mockRejectedValueOnce(
      axiosError(422, { detail: "We have no material for that yet.", code: "no_material" })
    );
    const err = await build().catch((e) => e);
    expect(err).toBeInstanceOf(ForgeUnavailableError);
    expect(err.code).toBe("no_material");
  });

  it("leaves an expired session to the auth layer", async () => {
    // Dressing a 401 up as a build problem would send the learner looking for the wrong fix.
    const raw = axiosError(401, { detail: "Token expired" });
    post.mockRejectedValueOnce(raw);
    const err = await build().catch((e) => e);
    expect(err).not.toBeInstanceOf(ForgeUnavailableError);
    expect(err).toBe(raw);
  });

  it("passes a success straight through", async () => {
    post.mockResolvedValueOnce({ data: { id: 7, status: "queued" } });
    await expect(build()).resolves.toMatchObject({ id: 7 });
  });
});

describe("the payment route the paywall points at", () => {
  it("exists, so checkout can be opened for a roadmap build", () => {
    // `payment_gateway/views.py` has accepted this since the paywall shipped; the enum had no
    // member for it, so the 402 named a payment type the client could not send.
    expect(PaymentType.ROADMAP).toBe("ROADMAP");
  });
});
