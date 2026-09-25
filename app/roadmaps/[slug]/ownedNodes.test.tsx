import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RoadmapGraph, RoadmapOwned } from "@/lib/services/roadmaps.service";

/**
 * The reported bug, at the page level.
 *
 * A learner clicked a step on the map, read a drawer asking "Create a course on this?", pressed
 * "Yes, build it" - and only then saw a dialog: "You already have this course." Nothing on the
 * map distinguished the steps whose course they already held.
 *
 * Every test here fails against the old page, which passed the graph and nothing else to the
 * map and sent every trackable click into the build drawer.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "sql" }),
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/roadmaps/sql",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({ ModulePageHeader: () => null }));
// The page offers checkout for a refused build, and `usePayment` reads the auth context. This
// file renders the page bare, so the hook is stubbed rather than the whole provider tree stood
// up: nothing here is about paying for anything.
vi.mock("@/hooks/usePayment", () => ({
  usePayment: () => ({ handlePayment: vi.fn(), busyKey: null }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}` }),
}));

const graphFn = vi.fn();
const ownedFn = vi.fn();
const nodeFn = vi.fn();
const createFn = vi.fn();
vi.mock("@/lib/services/roadmaps.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/roadmaps.service")>();
  return {
    ...actual,
    roadmapsService: {
      ...actual.roadmapsService,
      graph: (slug: string) => graphFn(slug),
      owned: (slug: string) => ownedFn(slug),
      node: (slug: string, id: number) => nodeFn(slug, id),
    },
    forgeService: { ...actual.forgeService, create: (b: unknown) => createFn(b) },
  };
});

import RoadmapDetailPage from "./page";

/**
 * A map the size of the shipped `sql` roadmap the bug was reported on: 35 trackable steps.
 * The biggest shipped map is 210, which is the number the per-node cost tests care about.
 */
function graphOf(steps: number): RoadmapGraph {
  const nodes: RoadmapGraph["nodes"] = [
    {
      id: 1, slug: "sec", title: "SQL basics", kind: "milestone", order: 0, parentId: null,
      isRequired: true, isTrackable: false, legendId: null,
    },
  ];
  for (let i = 0; i < steps; i++) {
    nodes.push({
      id: 100 + i, slug: `step-${i}`, title: `Step ${i}`, kind: "topic", order: i + 1,
      parentId: 1, isRequired: true, isTrackable: true, legendId: null,
    });
  }
  return {
    slug: "sql", cardTitle: "SQL", pageTitle: "SQL", kind: "skill", summary: "",
    version: 1, nodes, edges: [], legends: [], related: [], faqs: [],
  };
}

/** The three nodes student 20973 really holds on prod's `sql` map, in the states they are in. */
const OWNED: RoadmapOwned = {
  nodes: {
    100: { courseId: 4011, state: "inProgress", unitsComplete: 2, unitsTotal: 4 },
    101: { courseId: 4012, state: "ready", unitsComplete: 0, unitsTotal: 23 },
    102: { courseId: 4013, state: "done", unitsComplete: 4, unitsTotal: 4 },
  },
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={qc}>
      <RoadmapDetailPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  graphFn.mockResolvedValue(graphOf(35));
  ownedFn.mockResolvedValue(OWNED);
  nodeFn.mockResolvedValue({ id: 103, slug: "s", title: "Step 3", kind: "topic", summary: "",
    isRequired: true, resources: [], opens: [] });
  createFn.mockResolvedValue({ id: 1, status: "queued", title: "x", sourceKind: "roadmap_node",
    totalItems: 1, completedItems: 0, failedItems: 0, percent: 0, courseId: null,
    isStalled: false, items: [], errors: [] });
});

describe("a roadmap step the learner already has", () => {
  it("is marked on the map, before anything is clicked", async () => {
    renderPage();
    const marks = await screen.findAllByTestId("owned-badge");
    expect(marks).toHaveLength(3);
  });

  it("says WHICH state it is in, in words rather than by colour", async () => {
    renderPage();
    await screen.findAllByTestId("owned-badge");
    const states = screen
      .getAllByTestId("owned-badge")
      .map((el) => el.getAttribute("data-owned"));
    expect(states.sort()).toEqual(["done", "inProgress", "ready"]);
    // Every badge carries readable text, so none of them depends on its colour.
    for (const el of screen.getAllByTestId("owned-badge")) {
      expect((el.textContent || "").trim().length).toBeGreaterThan(0);
    }
  });

  it("tells a screen reader the same thing the mark tells the eye", async () => {
    renderPage();
    await screen.findAllByTestId("owned-badge");
    expect(
      screen.getByLabelText(/Step 0 - you have this course and are part way through it/)
    ).toBeInTheDocument();
  });

  it("leaves the steps they do NOT have unmarked", async () => {
    renderPage();
    await screen.findAllByTestId("owned-badge");
    const buttons = screen.getAllByRole("button");
    const marked = buttons.filter((b) => b.getAttribute("data-owned"));
    expect(marked).toHaveLength(3);
    expect(buttons.length).toBeGreaterThan(30);
  });

  it("opens the course on click instead of offering to build it again", async () => {
    renderPage();
    await screen.findAllByTestId("owned-badge");
    fireEvent.click(screen.getByLabelText(/Step 0 -/));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/adaptive-courses/4011"));
    // The redundancy the report was about: no "Create a course on this?" ask, and nothing is
    // POSTed only to be told the learner already has it.
    expect(createFn).not.toHaveBeenCalled();
    expect(screen.queryByText(/Create a course on this\?/)).not.toBeInTheDocument();
  });

  it("still opens the reading drawer for a step they do not have", async () => {
    renderPage();
    await screen.findAllByTestId("owned-badge");
    fireEvent.click(screen.getByText("Step 3"));
    expect(await screen.findByText(/Create a course on this\?/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("explains the mark once, above the map", async () => {
    renderPage();
    expect(await screen.findByTestId("owned-legend")).toBeInTheDocument();
  });

  it("shows no legend when the learner has nothing on this map", async () => {
    ownedFn.mockResolvedValue({ nodes: {} });
    renderPage();
    await waitFor(() => expect(ownedFn).toHaveBeenCalled());
    expect(screen.queryByTestId("owned-legend")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("owned-badge")).toHaveLength(0);
  });
});

describe("marking the map costs no request per node", () => {
  it("asks once for a 35-step map", async () => {
    renderPage();
    await screen.findAllByTestId("owned-badge");
    expect(ownedFn).toHaveBeenCalledTimes(1);
    expect(graphFn).toHaveBeenCalledTimes(1);
  });

  it("still asks exactly once for the biggest shipped map, 210 steps", async () => {
    graphFn.mockResolvedValue(graphOf(210));
    renderPage();
    await screen.findAllByTestId("owned-badge");
    expect(ownedFn).toHaveBeenCalledTimes(1);
    // The node-detail endpoint is the per-node one. Nothing may call it just to draw the map.
    expect(nodeFn).not.toHaveBeenCalled();
  });
});
