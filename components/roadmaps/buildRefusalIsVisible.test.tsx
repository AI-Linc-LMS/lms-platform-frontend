import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * A refused build has to be visible from where the learner pressed the button.
 *
 * The drawer stays open when a build is refused — `pending` is only cleared on success — and the
 * page rendered the reason at the bottom of the map, *underneath* it. A MUI temporary Drawer
 * puts a backdrop over the page and is the full screen on a phone, so the learner pressed
 * "Yes, build it", watched the spinner come and go, and saw nothing whatsoever. That is the
 * reported "it is not asking for payments but it is not generating the course too": the server
 * answered, and the answer went somewhere no one could read it.
 */

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `t:${key}:${JSON.stringify(vars)}` : `t:${key}`,
  }),
}));

import { BuildCourseDrawer } from "./BuildCourseDrawer";
import { ForgeUnavailableError, roadmapsService, type RoadmapNode } from "@/lib/services/roadmaps.service";

const NODE = { id: 412, title: "Model explainability", kind: "subtopic", summary: "" } as RoadmapNode;

function renderDrawer(props: Partial<React.ComponentProps<typeof BuildCourseDrawer>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <BuildCourseDrawer
        slug="data-analytics-and-ai-engineer"
        node={NODE}
        onClose={vi.fn()}
        onBuild={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(roadmapsService, "node").mockResolvedValue({
    id: NODE.id, title: NODE.title, summary: "", totals: {}, opens: [], steps: [], resources: [],
  } as never);
});

const paywalled = new ForgeUnavailableError(
  "You have used your free course build. Upgrade to build more from a roadmap.",
  "allowance_exhausted",
  { status: 402, paymentRequired: true, price: "99.00", currency: "INR" }
);

describe("a refusal reaches the learner", () => {
  it("shows why the build did not start, where the button is", async () => {
    renderDrawer({ refusal: paywalled });
    expect(await screen.findByTestId("forge-refusal")).toHaveTextContent(
      /used your free course build/i
    );
  });

  it("shows the daily ceiling too, not only the paywall", async () => {
    renderDrawer({
      refusal: new ForgeUnavailableError(
        "You have built a lot of courses today. Try again tomorrow.",
        "daily_limit",
        { status: 429 }
      ),
    });
    expect(await screen.findByTestId("forge-refusal")).toHaveTextContent(/tomorrow/i);
  });

  it("offers checkout when there is a price to pay", async () => {
    const onPay = vi.fn();
    renderDrawer({ refusal: paywalled, onPay });
    const pay = await screen.findByTestId("forge-pay");
    expect(pay).toHaveTextContent(/INR 99\.00/);
    fireEvent.click(pay);
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it("offers no checkout when the tenant has put nothing on sale", async () => {
    // A dead paywall is worse than an honest no: there is no amount, so there is no button.
    renderDrawer({
      refusal: new ForgeUnavailableError(
        "You have used your free course build, and more builds are not on sale here yet.",
        "not_for_sale",
        { status: 402, paymentRequired: false, price: null }
      ),
      onPay: vi.fn(),
    });
    expect(await screen.findByTestId("forge-refusal")).toBeInTheDocument();
    expect(screen.queryByTestId("forge-pay")).toBeNull();
  });

  it("says nothing at all when nothing has been refused", async () => {
    renderDrawer();
    expect(await screen.findByText(/Create a course on this\?/)).toBeInTheDocument();
    expect(screen.queryByTestId("forge-refusal")).toBeNull();
  });

  it("carries a settling payment as a notice rather than an error", async () => {
    renderDrawer({ notice: "Payment received. We're confirming it now." });
    expect(await screen.findByTestId("forge-refusal")).toHaveTextContent(/confirming it now/i);
    expect(screen.queryByTestId("forge-pay")).toBeNull();
  });
});
