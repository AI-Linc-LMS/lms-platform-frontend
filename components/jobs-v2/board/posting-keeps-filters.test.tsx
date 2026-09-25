/**
 * Opening a job keeps the applied filters visible — on a phone too.
 *
 * Reported as "when a job is selected, the filters at the top of the jobs page disappear,
 * preventing users from viewing or modifying the applied filters".
 *
 * At `lg+` that was fixed once already (#1617) and `detail-keeps-board.test.tsx` pins it: the
 * posting renders INSIDE the board, so the header, the tabs and the whole filter rail are still
 * there. Below `lg` they were not. The board's chrome carries `display:{xs:'none',lg:'block'}`
 * whenever a posting is open, so every filter control — the search box, all eight pills and the
 * mobile "Filters" button — went to `display: none` the moment a learner tapped a job, and the
 * filters they had applied became invisible and unreachable without a round trip through the
 * board.
 *
 * They were never UNMOUNTED and the filter state never reset: it rides on the URL. So these
 * assert both halves — the applied filter is still applied, and it is on screen and actionable.
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

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
  usePathname: () => "/jobs-v2/1",
  useSearchParams: () => new URLSearchParams(search),
  useParams: () => ({ id: "1" }),
}));

const getJobs = vi.fn();
const getMyApplications = vi.fn();
vi.mock("@/lib/services/jobs-v2.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/jobs-v2.service")>(
    "@/lib/services/jobs-v2.service",
  );
  return {
    ...actual,
    jobsV2Service: {
      getJobs: (...args: unknown[]) => getJobs(...args),
      getJobById: vi.fn(),
      getMyApplications: (...args: unknown[]) => getMyApplications(...args),
      toggleFavorite: vi.fn(),
      confirmApplied: vi.fn(),
    },
  };
});

vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useModuleLocked: () => ({ locked: false, ready: true, showLock: false, reportError: () => false }),
  useProfileGate: () => ({ percentage: 100, status: "ready", lockedModules: [], skills: [] }),
  useOutstandingFields: () => [],
}));
vi.mock("@/components/common/ProfileLock", () => ({
  ProfileLockBanner: () => <div data-testid="lock-banner" />,
  ProfileLockCard: () => <div data-testid="lock-card" />,
}));
vi.mock("@/components/common/PageGuide", () => ({ PageGuide: () => null }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/contexts/AdminModeContext", () => ({ useAdminMode: () => ({ isAdminMode: false }) }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { JobBoard } from "./JobBoard";

const JOB: JobV2 = {
  id: 1,
  job_title: "Frontend Engineer",
  company_name: "Acme",
  location: "Bengaluru",
  job_type: "job",
  years_of_experience: "1-3",
  tags: ["React"],
  created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
};

const POSTING = <div data-testid="posting">The full Frontend Engineer posting</div>;

/**
 * What a browser of a given width would actually paint for this element.
 *
 * jsdom computes no media queries, so both densities and every breakpoint rule sit in the DOM
 * at once and only the CSS separates them. MUI writes an `sx` breakpoint map as
 * `@media (min-width:0px){...}` for `xs` and `@media (min-width:1200px){...}` for `lg`, so the
 * answer at a width is the LAST matching rule - which is exactly what a browser does.
 */
function displayAt(el: Element, width: number): string {
  const css = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  let out = "";
  for (const c of Array.from(el.classList).filter((x) => x.startsWith("css-"))) {
    const re = new RegExp(`(?:@media \\(min-width:(\\d+)px\\)\\{)?\\.${c}\\{([^}]*)\\}`, "g");
    for (const m of css.matchAll(re)) {
      if (m[1] && Number(m[1]) > width) continue;
      const declared = Array.from(m[2].matchAll(/(?:^|;)display:([^;]+)/g)).at(-1);
      if (declared) out = declared[1];
    }
  }
  return out;
}

/** Is this element, or anything it sits inside, not painted at `width`? */
function hiddenAt(el: Element | null, width: number): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (displayAt(node, width) === "none") return true;
  }
  return false;
}

const PHONE_W = 390;
const DESKTOP_W = 1440;

/** `useMediaQuery(up("lg"))` answers as a desktop (or a phone) would. */
function asViewport(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: desktop && /min-width/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  vi.clearAllMocks();
  search = "loc=Bengaluru&ids=1";
  getJobs.mockResolvedValue({ results: [JOB], count: 1 });
  getMyApplications.mockResolvedValue({ results: [], count: 0 });
});

describe("a posting open on a phone", () => {
  it("still shows which filters are applied, and they are still applied", async () => {
    asViewport(false);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);

    const strip = await screen.findByTestId("jobs-posting-filters");
    // The chip names the filter that came in on the URL - it was never reset by the selection.
    expect(within(strip).getByText("Location: Bengaluru")).toBeInTheDocument();
    // And the strip itself is not the board chrome in disguise: it is phone-only.
    expect(hiddenAt(strip, PHONE_W)).toBe(false);
    expect(displayAt(strip, DESKTOP_W)).toBe("none");
  });

  it("is not the board chrome, which stays hidden where the list is not on screen", async () => {
    asViewport(false);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await screen.findByTestId("jobs-posting-filters");

    // The search box is still MOUNTED (nothing is destroyed, so no filter state is lost) but the
    // rail it belongs to is hidden below lg, which is what the strip exists to answer.
    const searchbox = screen.getByRole("searchbox");
    const rail = searchbox.closest("[class*='css-']")!;
    expect(rail).toBeInTheDocument();
  });

  it("reaches the full filter set with every filter still applied", async () => {
    asViewport(false);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    const strip = await screen.findByTestId("jobs-posting-filters");

    const toFilters = within(strip).getByRole("link", { name: /filters/i });
    // Back to the board, carrying the filter - never an unfiltered page 1. `ids` is the rail's
    // sibling set and belongs to a posting, so it is the one key that does not travel.
    const href = toFilters.getAttribute("href") ?? "";
    expect(href.startsWith("/jobs-v2?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("loc")).toBe("Bengaluru");
    expect(params.get("ids")).toBeNull();
  });

  it("counts the filters that are on, so the button says what is applied", async () => {
    search = "loc=Bengaluru&type=job&ids=1";
    asViewport(false);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    const strip = await screen.findByTestId("jobs-posting-filters");
    expect(within(strip).getByRole("link", { name: /filters \(2\)/i })).toBeInTheDocument();
  });

  it("lets a filter be removed from the posting, without resetting the rest", async () => {
    search = "loc=Bengaluru&type=job&ids=1";
    asViewport(false);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    const strip = await screen.findByTestId("jobs-posting-filters");

    fireEvent.click(within(strip).getByRole("button", { name: /Location: Bengaluru/i }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
    const [href] = replace.mock.calls.at(-1) as [string];
    const params = new URLSearchParams(href.split("?")[1] ?? "");
    expect(params.get("loc")).toBeNull();
    // The OTHER filter is untouched: removing one chip is not "clear all".
    expect(params.get("type")).toBe("job");
  });
});

describe("a posting open at lg+", () => {
  it("keeps the real filter rail and does not draw the phone strip twice over", async () => {
    asViewport(true);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(getJobs).toHaveBeenCalled());

    // #1617's contract, unchanged: the search box and the pills are right there beside the list.
    expect(screen.getAllByRole("searchbox")).toHaveLength(1);
    expect(screen.getAllByText("Location")).toHaveLength(1);
    // The strip is in the tree (one render tree at every breakpoint, spec 7.1) and CSS-hidden here.
    expect(displayAt(screen.getByTestId("jobs-posting-filters"), DESKTOP_W)).toBe("none");
  });
});

describe("the board with nothing selected", () => {
  it("draws no strip: the filters themselves are on screen", async () => {
    asViewport(false);
    render(<JobBoard />);
    await waitFor(() => expect(getJobs).toHaveBeenCalled());
    expect(screen.queryByTestId("jobs-posting-filters")).not.toBeInTheDocument();
  });
});

describe("the Saved tab, with a posting open", () => {
  it("does not say the same thing twice on a phone", async () => {
    // Saved unmounts the filter rail but keeps the active chips, because a filter carried in
    // from Browse is still applied. With the strip now carrying those chips below lg, the
    // board's own row has to step aside there or the learner sees each filter listed twice.
    search = "tab=saved&fav=1&loc=Bengaluru&ids=1";
    asViewport(false);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await screen.findByTestId("jobs-posting-filters");

    const onPhone = screen
      .getAllByRole("button", { name: /Location: Bengaluru/i })
      .filter((chip) => !hiddenAt(chip, PHONE_W));
    expect(onPhone).toHaveLength(1);
    expect(screen.getByTestId("jobs-posting-filters").contains(onPhone[0])).toBe(true);
  });

  it("still shows the board's own chip row at lg+, where the list is beside the posting", async () => {
    search = "tab=saved&fav=1&loc=Bengaluru&ids=1";
    asViewport(true);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await screen.findByTestId("jobs-posting-filters");

    // Both rows exist; the strip is the one CSS-hidden at lg+, and the board's row is not.
    const rows = screen.getAllByRole("button", { name: /Location: Bengaluru/i });
    expect(rows.length).toBe(2);
    const outsideStrip = rows.filter(
      (chip) => !screen.getByTestId("jobs-posting-filters").contains(chip),
    );
    expect(outsideStrip).toHaveLength(1);
    expect(hiddenAt(outsideStrip[0], DESKTOP_W)).toBe(false);
  });
});
