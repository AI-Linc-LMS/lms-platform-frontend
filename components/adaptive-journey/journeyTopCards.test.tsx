import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

/**
 * The two header cards above Course Overview.
 *
 * Measured on demo.ailinc.com as student1 on course 33 (Advanced Python): the pair took 332px of
 * vertical band at 1440 and 737px at 390, which put Course Overview at y=894 and y=1350 - below
 * the fold on both. On that learner the calibration test was already DONE, so a third of a
 * desktop screen was spent explaining the rules of a test that is over.
 *
 * What is pinned here is the RULE, not a course: a card opens expanded only while its own data
 * says it still asks the learner for something, the learner's own choice overrides that per
 * course and per card, and the expander is a real button that says what it does.
 *
 * jsdom has no layout, so nothing here measures a box. The phone check instead reads the CSS
 * emotion emitted, split by where it applies: a phone value must sit inside the
 * max-width:599.95px block and nowhere a 1440px browser can match.
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
      matches, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}

// ---- app seams --------------------------------------------------------------------------------
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, vars?: Record<string, unknown>) => (vars ? `t:${key}:${JSON.stringify(vars)}` : `t:${key}`) }),
}));
const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, prefetch: vi.fn() }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/mock-interview.service", () => ({ default: { startTemplateInterview: vi.fn() } }));
vi.mock("@/lib/hooks/useInterviewerVoice", () => ({ prefetchInterviewerClip: vi.fn() }));
// The learner id behind the storage key comes from the access token's `user_id` claim.
vi.mock("@/lib/utils/profile-cache", () => ({ currentUserId: () => "77" }));

import { JourneyTopCards } from "./JourneyTopCards";
import { topCardStorageKey } from "./topCardCollapse";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

// ---- fixtures ---------------------------------------------------------------------------------
type Calibration = JourneyBoard["calibration"];
type Interview = JourneyBoard["interview"];

const calibration = (over: Partial<NonNullable<Calibration["card"]>> = {}, outer: Partial<Calibration> = {}): Calibration => ({
  required: true,
  done: over.status === "done",
  card: {
    assessmentId: 9, assessmentSlug: "calib-py", title: "Calibration", points: 200,
    durationMinutes: 45, questionCount: 30, proctored: true, configured: true, generating: false,
    status: "not_started",
    ...over,
  },
  ...outer,
});

const interview = (over: Partial<NonNullable<Interview["card"]>> = {}, outer: Partial<Interview> = {}): Interview => ({
  required: true,
  done: over.status === "done",
  card: {
    templateId: 48, title: "AI Mock Interviewer", topic: "Python", difficulty: "medium",
    durationMinutes: 10, points: 100, configured: true, status: "not_started",
    ...over,
  },
  ...outer,
});

const COURSE = 33;
const expander = (title: string) =>
  screen.getAllByRole("button").find((b) => (b.getAttribute("aria-label") ?? "").includes(title))!;

beforeEach(() => {
  viewport(1440);
  window.sessionStorage.clear();
  push.mockClear();
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  window.sessionStorage.clear();
});

// ---- the collapsed-by-default rule ------------------------------------------------------------
describe("what the card opens as", () => {
  it("collapses a calibration test that is already done, and keeps its result reachable", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "done" })} interview={interview()} />);

    const button = expander("Calibration Assessment");
    expect(button).toHaveAttribute("aria-expanded", "false");
    // The paragraph is what cost the fold; it must be gone, not merely hidden behind an opacity.
    expect(screen.queryByText(/same fixed question set for every learner/)).not.toBeInTheDocument();
    // The one-liner says what the card is FOR now - finished - rather than re-teaching the rules.
    expect(screen.getByText(/t:adaptiveTopCards.calibrationDone/)).toBeInTheDocument();
    // And the primary action survives the collapse.
    fireEvent.click(screen.getByText("t:adaptiveTopCards.viewResults"));
    expect(push).toHaveBeenCalledWith(`/assessments/calib-py/calibration?courseId=${COURSE}`);
  });

  it("collapses a calibration test this tenant has not configured", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "not_configured", configured: false, assessmentSlug: null })} interview={interview()} />);
    expect(expander("Calibration Assessment")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("t:adaptiveTopCards.calibrationNotConfigured")).toBeInTheDocument();
  });

  it("collapses a calibration test that is still being generated - there is nothing to press", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "not_started", generating: true })} interview={interview()} />);
    expect(expander("Calibration Assessment")).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses a mock interview this course has not configured", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration()} interview={interview({ configured: false, templateId: null })} />);
    expect(expander("AI Mock Interviewer")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Rehearse with a voice-and-text AI interviewer/)).not.toBeInTheDocument();
  });

  it("collapses a mock interview that has already been taken", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration()} interview={interview({ status: "done" })} />);
    expect(expander("AI Mock Interviewer")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(/t:adaptiveTopCards.interviewDone/)).toBeInTheDocument();
  });

  it("opens the calibration card when it is required, configured and never taken", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration()} interview={interview({ status: "done" })} />);
    expect(expander("Calibration Assessment")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/same fixed question set for every learner/)).toBeInTheDocument();
  });

  it("opens the interview card when it is configured and never taken", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "done" })} interview={interview()} />);
    expect(expander("AI Mock Interviewer")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Rehearse with a voice-and-text AI interviewer/)).toBeInTheDocument();
  });

  it("renders neither card when the board sends neither", () => {
    const { container } = render(
      <JourneyTopCards courseId={COURSE} calibration={{ required: false, done: false, card: null }} interview={{ required: false, done: false, card: null }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

// ---- the expander itself ----------------------------------------------------------------------
describe("the expander", () => {
  it("is a real button that names the panel it opens, and flips aria-expanded", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "done" })} interview={interview({ status: "done" })} />);
    const button = expander("Calibration Assessment");

    expect(button.tagName).toBe("BUTTON");
    const panelId = button.getAttribute("aria-controls")!;
    expect(panelId).toBe(`journey-top-card-calibration-${COURSE}`);
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("t:adaptiveTopCards.expandAria"));
    // The panel it names exists while the card is CLOSED too - an `aria-controls` pointing at an
    // id nothing owns is a broken promise to a screen reader, not a lazy render.
    expect(document.getElementById(panelId)).not.toBeNull();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("t:adaptiveTopCards.collapseAria"));
    // aria-controls now resolves to something real, which is the whole point of naming it.
    expect(document.getElementById(panelId)).not.toBeNull();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("puts no button inside another button - the collapsed row is a row, not a giant target", () => {
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "done" })} interview={interview({ status: "done" })} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button.querySelector("button")).toBeNull();
    }
  });
});

// ---- remembering the learner's choice ----------------------------------------------------------
describe("the learner's own choice", () => {
  it("survives a remount, scoped to this learner, course and card", () => {
    const board = { calibration: calibration({ status: "done" }), interview: interview({ status: "done" }) };
    const first = render(<JourneyTopCards courseId={COURSE} {...board} />);
    fireEvent.click(expander("Calibration Assessment"));

    const key = topCardStorageKey("calibration", COURSE);
    expect(key).toBe(`adaptiveTopCard:77:${COURSE}:calibration`);
    expect(window.sessionStorage.getItem(key!)).toBe("1");
    // Only the card that was clicked is remembered.
    expect(window.sessionStorage.getItem(topCardStorageKey("interview", COURSE)!)).toBeNull();

    first.unmount();
    render(<JourneyTopCards courseId={COURSE} {...board} />);
    expect(expander("Calibration Assessment")).toHaveAttribute("aria-expanded", "true");
    expect(expander("AI Mock Interviewer")).toHaveAttribute("aria-expanded", "false");
  });

  it("does not leak to another course", () => {
    const board = { calibration: calibration({ status: "done" }), interview: interview({ status: "done" }) };
    const first = render(<JourneyTopCards courseId={COURSE} {...board} />);
    fireEvent.click(expander("Calibration Assessment"));
    first.unmount();

    render(<JourneyTopCards courseId={41} {...board} />);
    expect(expander("Calibration Assessment")).toHaveAttribute("aria-expanded", "false");
  });

  it("can close a card the data opened, and remembers that too", () => {
    const board = { calibration: calibration(), interview: interview({ status: "done" }) };
    const first = render(<JourneyTopCards courseId={COURSE} {...board} />);
    expect(expander("Calibration Assessment")).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(expander("Calibration Assessment"));
    expect(window.sessionStorage.getItem(topCardStorageKey("calibration", COURSE)!)).toBe("0");

    first.unmount();
    render(<JourneyTopCards courseId={COURSE} {...board} />);
    expect(expander("Calibration Assessment")).toHaveAttribute("aria-expanded", "false");
  });

  it("renders and toggles normally when sessionStorage throws", () => {
    const blocked = () => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    };
    const real = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get: () => ({ getItem: blocked, setItem: blocked, removeItem: blocked, clear: blocked }),
    });
    try {
      render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "done" })} interview={interview({ status: "done" })} />);
      const button = expander("Calibration Assessment");
      expect(button).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
    } finally {
      if (real) Object.defineProperty(window, "sessionStorage", real);
    }
  });
});

// ---- phone sizing, and the promise that it stays on the phone ------------------------------------
const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";
/**
 * `phone` is what emotion put inside the max-width:599.95px block for this element; `unscoped` is
 * every rule a desktop browser can match, including MUI's `(min-width:0px)` block for xs values.
 */
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style")).map((s) => s.textContent ?? "").join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes.flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`))).join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) => (q.trim() === PHONE_QUERY ? "" : block));
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

describe("on a phone", () => {
  it("gives the expander a 44px target and the row's action a 44px one - and neither on desktop", () => {
    viewport(390);
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "done" })} interview={interview({ status: "done" })} />);

    const button = expander("Calibration Assessment");
    const css = cssOf(button);
    expect(css.phone).toMatch(/width:\s*44px/);
    expect(css.phone).toMatch(/height:\s*44px/);
    // The negative half: a 1440px browser matches `unscoped` and must still see the 32px chip.
    expect(css.unscoped).not.toMatch(/(width|height):\s*44px/);
    expect(css.unscoped).toMatch(/width:\s*32px/);

    const action = screen.getByText("t:adaptiveTopCards.viewResults").closest("button")!;
    const actionCss = cssOf(action);
    expect(actionCss.phone).toMatch(/min-height:\s*44px/);
    expect(actionCss.unscoped).not.toMatch(/min-height:\s*44px/);
  });

  it("keeps the collapsed summary at or above the 12px floor, only below 600px", () => {
    viewport(390);
    render(<JourneyTopCards courseId={COURSE} calibration={calibration({ status: "done" })} interview={interview({ status: "done" })} />);

    const summary = screen.getByText(/t:adaptiveTopCards.calibrationDone/);
    const css = cssOf(summary);
    expect(css.phone).toMatch(/font-size:\s*0\.78rem/); // 12.5px
    expect(css.unscoped).toMatch(/font-size:\s*0\.76rem/); // the authored desktop size, untouched
    // …and it wraps on a phone rather than truncating the one line a learner has.
    expect(css.phone).toMatch(/white-space:\s*normal/);
  });
});
