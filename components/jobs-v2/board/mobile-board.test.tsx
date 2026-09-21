/**
 * The job board on a PHONE.
 *
 * Measured on a real 390x844 viewport against a signed-in tenant, the board failed in four ways
 * that no existing suite could see, because every one of them is a layout claim and jsdom has no
 * layout engine. They are all expressible as rules on the emitted CSS and on the DOM's shape,
 * which is what this file pins:
 *
 *   1. **The filter row was a plain `overflow: auto` box.** Its content reached x=598 inside a
 *      390px screen and ended at the card's edge with nothing to say more existed. It is a
 *      `ScrollRow` now — a named scroll region with snap points and a trailing fade.
 *   2. **The one control that opens every filter was the last thing in that row**, so on a phone
 *      the "Filters" button was the button off the screen. It is pinned outside the scroller.
 *   3. **Opening a job stacked two heroes.** `/jobs-v2/[id]` renders the posting inside the
 *      board, so below `lg` the board's "Career · Jobs" hero sat on top of the posting's own
 *      "Role · <title>" one — roughly a third of the screen before the job began.
 *   4. **Dismissable filter chips were 36px.** A chip whose entire purpose is to be tapped away
 *      has to be a thumb target.
 *
 * Desktop is asserted in the same breath every time: each rule names the breakpoint it starts
 * at, so a regression that "fixes" the phone by changing `lg` fails here.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";
import { DESKTOP, PHONE, styleAt } from "../responsiveSx.testutil";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { JobV2 } from "@/lib/services/jobs-v2.service";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const replace = vi.fn();
const push = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, back: vi.fn() }),
  usePathname: () => "/jobs-v2",
  useSearchParams: () => new URLSearchParams(search),
}));

const getJobs = vi.fn();
const getMyApplications = vi.fn();
const toggleFavorite = vi.fn();
const confirmApplied = vi.fn();
vi.mock("@/lib/services/jobs-v2.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/jobs-v2.service")>(
    "@/lib/services/jobs-v2.service",
  );
  return {
    ...actual,
    jobsV2Service: {
      getJobs: (...args: unknown[]) => getJobs(...args),
      getMyApplications: (...args: unknown[]) => getMyApplications(...args),
      toggleFavorite: (...args: unknown[]) => toggleFavorite(...args),
      confirmApplied: (...args: unknown[]) => confirmApplied(...args),
    },
  };
});

vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useModuleLocked: () => ({ locked: false, ready: true, showLock: false, reportError: () => false }),
  useProfileGate: () => ({ percentage: 40, status: "ready", lockedModules: [], skills: [] }),
  useOutstandingFields: () => [],
}));

vi.mock("@/components/common/ProfileLock", () => ({
  ProfileLockBanner: () => <div data-testid="lock-banner" />,
  ProfileLockCard: ({ preview }: { preview?: ReactNode }) => <div data-testid="lock-card">{preview}</div>,
}));

vi.mock("@/components/common/PageGuide", () => ({ PageGuide: () => null }));

vi.mock("@/lib/contexts/AdminModeContext", () => ({
  useAdminMode: () => ({ isAdminMode: false }),
}));

const showToast = vi.fn();
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast }) }));

import { JobBoard } from "./JobBoard";

const JOB: JobV2 = {
  id: 1,
  job_title: "Frontend Engineer",
  company_name: "Acme",
  location: "Bengaluru",
  job_type: "job",
  years_of_experience: "1-3",
  tags: ["React", "TypeScript"],
  created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
};


beforeEach(() => {
  vi.clearAllMocks();
  search = "";
  getJobs.mockResolvedValue({ results: [JOB], count: 1 });
  getMyApplications.mockResolvedValue({ results: [], count: 0 });
});

/** The filter row's scroll region. Named, so a screen reader can reach it as a unit too. */
const facetRow = () => screen.getByRole("group", { name: /job filters/i });

describe("the filter row on a phone", () => {
  it("is a scroll region with an edge fade, and stays a wrapping row on a desktop", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getAllByRole("searchbox")).toHaveLength(1));

    const row = facetRow();
    // A phone: one line that scrolls, with a fade saying there is more to the right.
    expect(styleAt(row, PHONE, "overflow-x")).toBe("auto");
    expect(styleAt(row, PHONE, "flex-wrap")).toBe("nowrap");
    expect(styleAt(row, PHONE, "-webkit-mask-image") ?? styleAt(row, PHONE, "mask-image")).toContain(
      "linear-gradient",
    );
    expect(styleAt(row, PHONE, "scroll-snap-type")).toBe("x proximity");

    // A desktop: exactly the wrapping row it has always been. No scroller, no fade.
    expect(styleAt(row, DESKTOP, "overflow-x")).toBe("visible");
    expect(styleAt(row, DESKTOP, "flex-wrap")).toBe("wrap");
    // Both axes visible, or the browser silently makes the desktop row a clipping scroller.
    expect(styleAt(row, DESKTOP, "overflow-y")).toBe("visible");
    expect(styleAt(row, DESKTOP, "scroll-snap-type")).toBe("none");
    expect(styleAt(row, DESKTOP, "-webkit-mask-image") ?? styleAt(row, DESKTOP, "mask-image")).toBe(
      "none",
    );
  });

  it("fades the edge the row overflows toward, which in Arabic is the left one", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getAllByRole("searchbox")).toHaveLength(1));

    const row = facetRow();
    const mask = (opts?: { within?: string }, width = PHONE) =>
      styleAt(row, width, "-webkit-mask-image", opts) ?? styleAt(row, width, "mask-image", opts);
    const RTL = { within: '[dir="rtl"]' };

    // Left-to-right the row overflows to the right, so the right edge fades.
    expect(mask()).toContain("to right");
    // Right-to-left it starts at the right and overflows LEFT. A `to right` fade there would
    // hide the first pill and hard-cut the side that still has more.
    expect(mask(RTL)).toContain("to left");
    expect(mask(RTL)).not.toContain("to right");
    // Neither direction fades on a desktop.
    expect(mask(RTL, DESKTOP)).toBe("none");
  });

  it("ends the scroller past the fade, so the last pill comes fully clear", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getAllByRole("searchbox")).toHaveLength(1));

    const row = facetRow();
    // Logical padding, so it sits at the left in Arabic, where the row ends.
    expect(styleAt(row, PHONE, "padding-inline-end")).toBe("16px");
    expect(styleAt(row, DESKTOP, "padding-inline-end")).toBe("0px");
  });

  it("pins the Filters opener outside the scroller, so it can never scroll off a 390px screen", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getAllByRole("searchbox")).toHaveLength(1));

    const filters = screen.getByRole("button", { name: /^filters/i });
    // The facets scroll; the control that reaches ALL of them does not move.
    expect(facetRow()).not.toContainElement(filters);
    // ...and it is still in the same bar, immediately after the scroller.
    expect(facetRow().parentElement).toContainElement(filters);
    expect(facetRow().nextElementSibling).toContainElement(filters);
  });

  it("still opens the whole filter set, with its outcome named on a full-width action", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getAllByRole("searchbox")).toHaveLength(1));

    await userEvent.click(screen.getByRole("button", { name: /^filters/i }));

    const sheet = await screen.findByRole("dialog");
    // Deferred apply: the footer states the real result of the draft, and Clear all is beside it.
    expect(within(sheet).getByRole("button", { name: /show 1 job/i })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: /clear all/i })).toBeInTheDocument();
    // Every client facet is reachable from the one button.
    expect(within(sheet).getByText("Experience")).toBeInTheDocument();
    expect(within(sheet).getByText("Skills")).toBeInTheDocument();
  });

  it("gives a dismissable filter chip a thumb-sized target on a phone", async () => {
    search = "loc=Bengaluru";
    render(<JobBoard />);
    const chip = await screen.findByRole("button", { name: /remove/i });

    // 36px was the measured height. A chip whose only job is to be tapped away is a touch target.
    expect(styleAt(chip, PHONE, "min-height")).toBe("44px");
    // Desktop density is untouched.
    expect(styleAt(chip, DESKTOP, "min-height")).toBe("30px");
  });
});

describe("a posting opened on a phone", () => {
  const POSTING = <div data-testid="posting">The full Frontend Engineer posting</div>;
  const boardHero = () => document.querySelector('[data-jobs-chrome="board-header"]')!;

  it("collapses the board's own hero, which the posting has already replaced", async () => {
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(screen.getByTestId("posting")).toBeInTheDocument());

    // Below lg the posting IS the page and draws its own "Role · <title>" hero. Two stacked
    // heroes cost roughly a third of a 390x844 screen before the job began.
    expect(styleAt(boardHero(), PHONE, "display")).toBe("none");
    // At lg+ the board's hero is the only one drawn, so nothing there moves.
    expect(styleAt(boardHero(), DESKTOP, "display")).toBe("block");
  });

  it("keeps the whole board around the posting on a desktop", async () => {
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(screen.getByTestId("posting")).toBeInTheDocument());

    // The chrome is still rendered — it is hidden by breakpoint, not unmounted — which is what
    // keeps one render tree and the tour ids present at every width.
    expect(screen.getByText(/Discover roles matched to you/)).toBeInTheDocument();
    expect(boardHero()).toContainElement(screen.getByText(/Discover roles matched to you/));
  });

  it("draws the board's hero normally when no posting is open", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getAllByRole("searchbox")).toHaveLength(1));

    // No selection, no breakpoint rule: the board hero is simply the page's hero.
    expect(styleAt(boardHero(), PHONE, "display")).toBeNull();
  });
});
