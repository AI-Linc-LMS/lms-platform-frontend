import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * The free-text build bar must offer the same way out as the roadmap drawer.
 *
 * Asking for a course past the free allowance is a 402 carrying a price. The drawer has offered
 * checkout since the paywall shipped; this bar rendered the sentence and stopped, so the one
 * refusal a learner can actually act on was the one that looked most like a dead end. It matters
 * more now that the server refuses BEFORE building: until this release a prompt past the
 * allowance quietly produced a locked course instead of an error.
 */

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `t:${key}:${JSON.stringify(vars)}` : `t:${key}`,
  }),
}));

const handlePayment = vi.fn();
let busyKey: string | null = null;
vi.mock("@/hooks/usePayment", () => ({
  usePayment: () => ({ handlePayment, busyKey }),
}));

vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({
    push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), isPending: false,
  }),
}));
// The page is rendered bare: the shell pulls in the whole provider tree, and none of it is what
// this file is about. Same stubs the sibling roadmap page test uses.
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({ ModulePageHeader: () => null }));

import RoadmapsPage from "./page";
import {
  ForgeUnavailableError,
  forgeService,
  roadmapsService,
} from "@/lib/services/roadmaps.service";

const CATALOG = {
  categories: [
    { slug: "all", title: "All", sections: [{ title: "Skills", roadmaps: ["python"] }] },
  ],
  roadmaps: [
    { slug: "python", cardTitle: "Python", pageTitle: "Python", kind: "roadmap", steps: 12 },
  ],
} as never;

const paywalled = () =>
  new ForgeUnavailableError(
    "You have used your free course build. Buy another to build this one.",
    "allowance_exhausted",
    { status: 402, paymentRequired: true, price: "99.00", currency: "INR" }
  );

const notForSale = () =>
  new ForgeUnavailableError(
    "You have used your free course build, and more builds are not on sale here yet.",
    "not_for_sale",
    { status: 402, paymentRequired: false, price: null, currency: "INR" }
  );

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <RoadmapsPage />
    </QueryClientProvider>
  );
}

async function askFor(text: string) {
  const box = await screen.findByRole("textbox");
  await userEvent.type(box, `${text}{Enter}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  busyKey = null;
  vi.spyOn(roadmapsService, "catalog").mockResolvedValue(CATALOG);
});

describe("a prompt build refused for payment", () => {
  it("shows the price and a way to pay it", async () => {
    vi.spyOn(forgeService, "create").mockRejectedValue(paywalled());

    renderPage();
    await askFor("graph theory");

    expect(await screen.findByTestId("prompt-forge-refusal")).toHaveTextContent(
      /used your free course build/i
    );
    const pay = await screen.findByTestId("prompt-forge-pay");
    expect(pay).toHaveTextContent("INR 99.00");
  });

  it("buys one build and then builds the prompt that was refused", async () => {
    const create = vi
      .spyOn(forgeService, "create")
      .mockRejectedValueOnce(paywalled())
      .mockResolvedValueOnce({ id: 7, status: "queued", items: [] } as never);
    handlePayment.mockImplementation(({ onOutcome }) =>
      onOutcome?.({ kind: "verified", response: {} })
    );

    renderPage();
    await askFor("graph theory");
    await userEvent.click(await screen.findByTestId("prompt-forge-pay"));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    expect(handlePayment).toHaveBeenCalledWith(
      expect.objectContaining({ typeId: "1", paymentType: "ROADMAP" })
    );
    // The SAME prompt, not a blank one: the learner paid for the course they asked for.
    expect(create.mock.calls[1][0]).toEqual({ prompt: "graph theory" });
  });

  it("does not call a payment that is still settling a failure", async () => {
    vi.spyOn(forgeService, "create").mockRejectedValue(paywalled());
    handlePayment.mockImplementation(({ onOutcome }) =>
      onOutcome?.({ kind: "settling", message: "Your payment is still settling." })
    );

    renderPage();
    await askFor("graph theory");
    await userEvent.click(await screen.findByTestId("prompt-forge-pay"));

    const line = await screen.findByTestId("prompt-forge-refusal");
    expect(line).toHaveTextContent(/still settling/i);
    // The refusal is cleared, so the pay button goes with it: pressing build again is the move.
    expect(screen.queryByTestId("prompt-forge-pay")).toBeNull();
  });

  it("offers no checkout when the tenant has priced nothing", async () => {
    vi.spyOn(forgeService, "create").mockRejectedValue(notForSale());

    renderPage();
    await askFor("graph theory");

    expect(await screen.findByTestId("prompt-forge-refusal")).toHaveTextContent(
      /not on sale here yet/i
    );
    expect(screen.queryByTestId("prompt-forge-pay")).toBeNull();
  });

  it("still shows a plain refusal that has nothing to pay, like no material", async () => {
    vi.spyOn(forgeService, "create").mockRejectedValue(
      new ForgeUnavailableError("We do not have material for that yet.", "no_material", {
        status: 422,
      })
    );

    renderPage();
    await askFor("underwater basket weaving");

    expect(await screen.findByTestId("prompt-forge-refusal")).toHaveTextContent(
      /do not have material/i
    );
    expect(screen.queryByTestId("prompt-forge-pay")).toBeNull();
  });
});
