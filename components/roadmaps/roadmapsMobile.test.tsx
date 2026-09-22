import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * Roadmaps on a phone.
 *
 * Measured on an iPhone 14 (390px) against the demo tenant: every catalogue row was 38px, every
 * leaf on the map 32px and every step 40px, the "needs" chips 18px with 9.5px labels, the node
 * drawer's chips 10-11px, and the map's only hint said "Right-click", which a phone cannot do.
 *
 * jsdom has no layout, so nothing here measures a box. What is pinned is the CSS emotion emits,
 * split by where it applies: the phone values must sit inside the max-width:599.95px block and
 * nowhere a desktop browser can match, so a screen of 600px or more is exactly what main renders.
 */

// ---- viewport ---------------------------------------------------------------------------------
const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

// ---- app seams --------------------------------------------------------------------------------
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `t:${key}` }),
}));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/services/roadmaps.service", async (orig) => ({
  ...(await orig<typeof import("@/lib/services/roadmaps.service")>()),
  forgeService: { job: vi.fn() },
  roadmapsService: { node: vi.fn(() => new Promise(() => {})) },
}));

import { RoadmapIndex } from "./RoadmapIndex";
import { RoadmapSpine } from "./RoadmapSpine";
import { NodeStateMenu } from "./NodeStateMenu";
import { ForgeProgressDialog } from "./ForgeProgressDialog";
import { BuildCourseDrawer } from "./BuildCourseDrawer";
import type { ForgeJob, RoadmapGraph } from "@/lib/services/roadmaps.service";

// ---- emitted CSS, split by where it applies -----------------------------------------------------
const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";
/**
 * `phone` is what emotion put inside the max-width:599.95px block for this element; `unscoped` is
 * every rule a desktop browser can match, including MUI's `(min-width:0px)` block for xs values.
 */
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes
      .flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`)))
      .join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) => (q.trim() === PHONE_QUERY ? "" : block));
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

// ---- fixtures -----------------------------------------------------------------------------------
const node = (id: number, over: Partial<RoadmapGraph["nodes"][number]>) =>
  ({
    id,
    slug: `n-${id}`,
    title: `Node ${id}`,
    kind: "topic",
    order: id,
    parentId: null,
    isRequired: true,
    isTrackable: true,
    legendId: null,
    ...over,
  }) as RoadmapGraph["nodes"][number];

const graph: RoadmapGraph = {
  slug: "frontend",
  cardTitle: "Frontend",
  pageTitle: "Frontend Developer",
  kind: "role",
  summary: "",
  version: 1,
  nodes: [
    node(1, { kind: "milestone", title: "HTML and CSS", isTrackable: false }),
    node(2, { parentId: 1, title: "Semantic HTML" }),
    node(3, { parentId: 1, title: "Flexbox", isRequired: false }),
    node(4, { parentId: 2, kind: "subtopic", title: "Landmarks" }),
  ],
  edges: [{ from: 2, to: 3, kind: "depends" }],
  legends: [],
  related: [{ slug: "backend", cardTitle: "Backend", pageTitle: "Backend Developer", kind: "role" }],
  faqs: [],
} as unknown as RoadmapGraph;

function renderSpine() {
  return render(
    <RoadmapSpine
      graph={graph}
      onOpenNode={vi.fn()}
      onOpenRoadmap={vi.fn()}
      onSetNodeState={vi.fn()}
    />,
  );
}

function withQuery(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// ================================================================================================

describe("the catalogue", () => {
  it("gives each roadmap row a 44px target on a phone and leaves the desktop row alone", () => {
    render(
      <RoadmapIndex
        title="Role based"
        icon="solar:layers-linear"
        roadmaps={[{ slug: "frontend", pageTitle: "Frontend Developer" } as never]}
        onOpen={vi.fn()}
      />,
    );
    const row = screen.getByRole("button", { name: "Frontend Developer" });
    const css = cssOf(row);
    expect(css.phone).toMatch(/min-height:44px/);
    expect(css.unscoped).not.toMatch(/min-height:44px/);
  });

  it("raises the section eyebrow to 12px on a phone only", () => {
    render(
      <RoadmapIndex
        title="Role based"
        icon="solar:layers-linear"
        roadmaps={[{ slug: "frontend", pageTitle: "Frontend Developer" } as never]}
        onOpen={vi.fn()}
      />,
    );
    const css = cssOf(screen.getByText("Role based"));
    expect(css.phone).toMatch(/font-size:0\.75rem/);
    expect(css.unscoped).toMatch(/font-size:0\.74rem/);
    expect(css.unscoped).not.toMatch(/font-size:0\.75rem/);
  });
});

describe("the map", () => {
  it("makes every step and leaf a 44px target on a phone only", () => {
    renderSpine();
    for (const name of ["Semantic HTML", "Landmarks"]) {
      const box = screen.getByText(name, { selector: "button span:not(.MuiChip-label)" }).closest("button") as HTMLElement;
      const css = cssOf(box);
      expect(css.phone).toMatch(/min-height:44px/);
      expect(css.unscoped).not.toMatch(/min-height:44px/);
    }
  });

  it("turns the 18px 'needs' chip into a 44px target with 12px text on a phone", () => {
    renderSpine();
    const chip = screen.getByText("Semantic HTML", { selector: ".MuiChip-label" }).closest(".MuiChip-root") as HTMLElement;
    const css = cssOf(chip);
    expect(css.phone).toMatch(/height:44px/);
    expect(css.phone).toMatch(/font-size:12px/);
    expect(css.unscoped).toMatch(/height:18px/);
    expect(css.unscoped).not.toMatch(/height:44px/);
  });

  it("tells a phone to tap and long-press instead of right-click, in both locales' copy", () => {
    renderSpine();
    const desktop = screen.getByText(/Right-click to mark it done/);
    const phone = screen.getByText("t:roadmapsMobile.mapHint");
    // The desktop sentence is hidden on a phone and the phone sentence hidden everywhere else.
    expect(cssOf(desktop).phone).toMatch(/display:none/);
    expect(cssOf(desktop).unscoped).not.toMatch(/display:none/);
    expect(cssOf(phone).unscoped).toMatch(/display:none/);
    expect(cssOf(phone).phone).toMatch(/display:inline/);
  });

  it("keeps the related-track buttons at 44px on a phone", () => {
    renderSpine();
    const css = cssOf(screen.getByRole("button", { name: "Backend Developer" }));
    expect(css.phone).toMatch(/min-height:44px/);
    expect(css.unscoped).not.toMatch(/min-height:44px/);
  });
});

describe("the status menu", () => {
  it("drops the keyboard shortcut on a phone, where it means nothing", () => {
    render(<NodeStateMenu anchor={{ x: 10, y: 10 }} current="pending" onClose={vi.fn()} onPick={vi.fn()} />);
    const kbd = document.querySelector("kbd") as HTMLElement;
    expect(cssOf(kbd).phone).toMatch(/display:none/);
    expect(cssOf(kbd).unscoped).not.toMatch(/display:none/);
  });
});

describe("the course build progress", () => {
  const running: ForgeJob = {
    id: 9,
    status: "running",
    title: "Frontend essentials",
    items: [],
    progress: 0,
  } as unknown as ForgeJob;
  const done: ForgeJob = { ...running, status: "completed", courseId: 44 } as unknown as ForgeJob;

  it("is a bottom sheet on a phone and the original dialog on a desktop", () => {
    viewport(390);
    const { unmount } = render(withQuery(<ForgeProgressDialog job={running} open onClose={vi.fn()} />));
    expect(screen.getByTestId("forge-progress-sheet")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeTruthy();
    expect(document.querySelector(".MuiDialog-root")).toBeNull();
    unmount();

    viewport(1440);
    render(withQuery(<ForgeProgressDialog job={running} open onClose={vi.fn()} />));
    expect(screen.queryByTestId("forge-progress-sheet")).toBeNull();
    expect(document.querySelector(".MuiDialog-root")).toBeTruthy();
  });

  it("cannot be dismissed while the build is still running, on a phone", () => {
    viewport(390);
    const onClose = vi.fn();
    render(withQuery(<ForgeProgressDialog job={running} open onClose={onClose} />));
    fireEvent.keyDown(screen.getByTestId("forge-progress-sheet"), { key: "Escape" });
    fireEvent.click(document.querySelector(".MuiBackdrop-root") as Element);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("puts both finished actions under the thumb, full width, on a phone", () => {
    viewport(390);
    render(withQuery(<ForgeProgressDialog job={done} open onClose={vi.fn()} />));
    const sheet = screen.getByTestId("forge-progress-sheet");
    for (const name of ["Stay here", /Start learning/]) {
      const css = cssOf(within(sheet).getByRole("button", { name }));
      expect(css.phone).toMatch(/min-height:44px/);
      expect(css.unscoped).not.toMatch(/min-height:44px/);
    }
  });
});

describe("the build-a-course drawer", () => {
  const topic = node(2, { parentId: 1, title: "Semantic HTML" });

  it("sits above the app bar on a phone, where it is the whole screen, and stays put on a desktop", () => {
    render(withQuery(<BuildCourseDrawer slug="frontend" node={topic} onClose={vi.fn()} onBuild={vi.fn()} />));
    const root = document.querySelector(".MuiDrawer-root") as HTMLElement;
    // The app bar is drawer + 1 (1201); the drawer's own layer is 1200, so its header and close
    // button were underneath the bar on a full-width phone drawer.
    expect(cssOf(root).phone).toMatch(/z-index:1300/);
    // Elsewhere the drawer keeps its own layer: the last z-index MUI emits for it is 1200.
    expect(cssOf(root).unscoped).toMatch(/z-index:1200;\}/);
  });

  it("has a 44px close and keeps the header off the notch on a phone", () => {
    render(withQuery(<BuildCourseDrawer slug="frontend" node={topic} onClose={vi.fn()} onBuild={vi.fn()} />));
    const close = screen.getByRole("button", { name: "Close" });
    expect(cssOf(close).phone).toMatch(/width:44px/);
    expect(cssOf(close).unscoped).not.toMatch(/44px/);
    const paper = document.querySelector(".MuiDrawer-paper") as HTMLElement;
    expect(cssOf(paper).phone).toMatch(/safe-area-inset-top/);
    expect(cssOf(paper).unscoped).not.toMatch(/safe-area-inset-top/);
  });
});
