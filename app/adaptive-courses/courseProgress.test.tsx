import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

/**
 * Adaptive courses: a course you have started must not look like one you have never opened.
 *
 * Reported ("the course which already have some progress is not getting distinguished"):
 * every card on /adaptive-courses rendered the same six content counts and nothing about
 * the learner, so half-finished and untouched were pixel-identical.
 *
 * BEFORE THE FIX these fail, and they fail in the right place: `AdaptiveCourseListItem`
 * had no `progress` at all, so there was nothing to render and no `course-progress`
 * element to find.
 *
 * Three things are pinned, matching the three channels the meter uses — because colour
 * alone is not readable by everyone:
 *   - the worded state ("Not started" / "In progress" / "Completed"),
 *   - the percent, taken verbatim from the server and never re-derived here,
 *   - a determinate progress bar whose aria-valuenow is that same percent.
 */

// ---- viewport ---------------------------------------------------------------------------------
let phone = false;
const realMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: phone && /max-width:\s*599\.95px/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  phone = false;
  vi.clearAllMocks();
});

// ---- i18n -------------------------------------------------------------------------------------
// The REAL English bundle, resolved by key, so a missing/renamed key fails here rather than
// shipping the raw key to a learner.
import enCommon from "@/locales/en/common.json";

const translate = (key: string, vars?: Record<string, unknown>) => {
  const value = key.split(".").reduce<unknown>(
    (node, part) => (node as Record<string, unknown> | undefined)?.[part],
    enCommon as unknown,
  );
  if (typeof value !== "string") throw new Error(`missing locale key: ${key}`);
  return value.replace(/{{(\w+)}}/g, (_m, name: string) => String(vars?.[name] ?? ""));
};
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: translate }) }));

// ---- app seams --------------------------------------------------------------------------------
const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useIsAdaptiveQuizEnabled: () => true }));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title, action }: { title: string; action?: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {action}
    </header>
  ),
  HeaderActionButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@/components/scorecard/shared", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import type { AdaptiveCourseListItem, AdaptiveCourseProgress } from "@/lib/services/adaptive-course.service";

const base = (id: number, title: string): AdaptiveCourseListItem => ({
  id,
  title,
  slug: `c-${id}`,
  description: `About ${title}`,
  target_audience: "",
  duration_weeks: 4,
  difficulty_levels: [],
  module_count: 3,
  submodule_count: 9,
  quiz_count: 6,
  article_count: 9,
  updated_at: `2026-09-0${id}T00:00:00Z`,
});

const withProgress = (
  id: number,
  title: string,
  progress: AdaptiveCourseProgress,
): AdaptiveCourseListItem => ({ ...base(id, title), progress });

// The reported shape exactly: one untouched, one part-done, one finished, all identical
// otherwise (same counts, same description) so ONLY the progress can tell them apart.
const untouched = withProgress(1, "Never Opened", {
  percent: 0, steps_done: 0, steps_total: 12, state: "not_started",
});
const started = withProgress(2, "Half Way", {
  percent: 42, steps_done: 5, steps_total: 12, state: "in_progress",
});
const finished = withProgress(3, "All Done", {
  percent: 100, steps_done: 12, steps_total: 12, state: "completed",
});

const listCourses = vi.fn();
vi.mock("@/lib/services/adaptive-course.service", () => ({
  adaptiveCourseService: {
    listCourses: () => listCourses(),
    getCatalog: () => Promise.resolve([]),
    selfEnroll: vi.fn(),
  },
}));

import AdaptiveCourseListPage from "@/app/adaptive-courses/page";
import { CourseProgressMeter } from "@/components/courses/CourseProgressMeter";

const cardFor = async (title: string) => {
  const heading = await screen.findByText(title);
  const card = heading.closest("button") ?? heading.closest("[data-testid]");
  if (!card) throw new Error(`no card around ${title}`);
  return card as HTMLElement;
};

// ---- tests ------------------------------------------------------------------------------------

describe("adaptive course list: started vs untouched vs finished", () => {
  beforeEach(() => {
    listCourses.mockResolvedValue([untouched, started, finished]);
  });

  it("tells the three states apart in words, not only in colour", async () => {
    render(<AdaptiveCourseListPage />);

    expect(within(await cardFor("Never Opened")).getByText("Not started")).toBeInTheDocument();
    expect(within(await cardFor("Half Way")).getByText("In progress")).toBeInTheDocument();
    expect(within(await cardFor("All Done")).getByText("Completed")).toBeInTheDocument();
  });

  it("shows the server's percent verbatim - it is the number the course page shows", async () => {
    render(<AdaptiveCourseListPage />);

    // 42, not a percentage re-derived on the client from counts the card happens to hold.
    expect(within(await cardFor("Half Way")).getByText("42%")).toBeInTheDocument();
    expect(within(await cardFor("All Done")).getByText("100%")).toBeInTheDocument();
  });

  it("does not let a course with zero progress read as started", async () => {
    render(<AdaptiveCourseListPage />);
    const card = await cardFor("Never Opened");

    expect(within(card).getByText("0%")).toBeInTheDocument();
    expect(within(card).queryByText("In progress")).not.toBeInTheDocument();
    expect(
      within(card).getByTestId("course-progress").getAttribute("data-progress-state"),
    ).toBe("not_started");
  });

  it("keeps a completed course distinguishable from one in progress", async () => {
    render(<AdaptiveCourseListPage />);

    const done = within(await cardFor("All Done")).getByTestId("course-progress");
    const going = within(await cardFor("Half Way")).getByTestId("course-progress");
    expect(done.getAttribute("data-progress-state")).toBe("completed");
    expect(going.getAttribute("data-progress-state")).toBe("in_progress");
    // ...and the difference survives being read out, not just looked at
    expect(within(done as HTMLElement).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(within(going as HTMLElement).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
  });

  it("says how many steps are behind the percent", async () => {
    render(<AdaptiveCourseListPage />);
    expect(within(await cardFor("Half Way")).getByText("5 of 12 steps done")).toBeInTheDocument();
  });

  it("still renders a card for a server that sends no progress at all", async () => {
    // A frontend deployed ahead of the backend, and the self-enroll catalog, both send this.
    listCourses.mockResolvedValue([base(9, "No Progress Field")]);
    render(<AdaptiveCourseListPage />);

    await screen.findByText("No Progress Field");
    expect(screen.queryByTestId("course-progress")).not.toBeInTheDocument();
  });

  it("carries the state into the list view too - it is the same list", async () => {
    render(<AdaptiveCourseListPage />);
    await screen.findByText("Half Way");

    // Switch to rows. The toggle is labelled by the shared ViewToggle.
    fireEvent.click(screen.getByRole("button", { name: /list/i }));

    const meters = await screen.findAllByTestId("course-progress");
    expect(meters.map((m) => m.getAttribute("data-progress-state"))).toEqual(
      expect.arrayContaining(["not_started", "in_progress", "completed"]),
    );
  });

  it("gives a phone the same three answers", async () => {
    phone = true;
    render(<AdaptiveCourseListPage />);

    expect(within(await cardFor("Never Opened")).getByText("Not started")).toBeInTheDocument();
    expect(within(await cardFor("Half Way")).getByText("In progress")).toBeInTheDocument();
    expect(within(await cardFor("All Done")).getByText("Completed")).toBeInTheDocument();
  });
});

describe("CourseProgressMeter", () => {
  it("clamps a percent the server should never send rather than rendering a broken bar", () => {
    render(
      <CourseProgressMeter
        progress={{ percent: 137, steps_done: 9, steps_total: 9, state: "completed" }}
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("never prints '0%' next to 'In progress'", () => {
    // Production reality (2026-09-24): 131 of the 143 non-zero (learner, course) pairs are
    // under 10%, median 6%. One more rounding step down and the card would tell a learner
    // who HAS started "In progress · 0%", and the 0 is the half they would believe.
    render(
      <CourseProgressMeter
        progress={{ percent: 0, steps_done: 1, steps_total: 250, state: "in_progress" }}
      />,
    );
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("<1%")).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    // the exact figure is still on the card, and it is the board's own nodesDone/nodesTotal
    expect(screen.getByText("1 of 250 steps done")).toBeInTheDocument();
  });

  it("still prints a plain 0% for a course that genuinely has not been started", () => {
    render(
      <CourseProgressMeter
        progress={{ percent: 0, steps_done: 0, steps_total: 12, state: "not_started" }}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.queryByText("<1%")).not.toBeInTheDocument();
  });

  it("drops the step caption in the compact row layout but keeps the state and the percent", () => {
    render(
      <CourseProgressMeter
        compact
        progress={{ percent: 42, steps_done: 5, steps_total: 12, state: "in_progress" }}
      />,
    );
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.queryByText("5 of 12 steps done")).not.toBeInTheDocument();
  });
});
