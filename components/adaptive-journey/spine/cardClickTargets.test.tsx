import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * A control inside the module card must go where IT says, not where the card says.
 *
 * Reported live: "Learn with AI Tutor is redirecting to course, not ai tutor - same is
 * happening with assessment". One cause for both. The whole card carries `onClick={go}` so
 * that clicking anywhere on a module opens it, and the tutor button and the interview button
 * sit inside it. A click on either fired its own handler and then BUBBLED to the card, whose
 * handler ran second and won - so every nested control ended up opening the module.
 *
 * Each case below asserts `push` was called exactly ONCE, and with the right URL. Asserting
 * only the last call would have passed throughout the bug.
 */

const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, prefetch: vi.fn(), replace: vi.fn(), isPending: false }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useIsAiVoiceTutorEnabled: () => true,
  useIsInterviewV2Enabled: () => false,
}));
const startTemplateInterview = vi.fn();
vi.mock("@/lib/services/mock-interview.service", () => ({
  default: { startTemplateInterview: (...a: unknown[]) => startTemplateInterview(...a) },
}));
vi.mock("@/lib/hooks/useInterviewerVoice", () => ({ prefetchInterviewerClip: vi.fn() }));

import { NodeRow } from "./NodeRow";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const mod = (over: Partial<JourneyNodeView> = {}): JourneyNodeView =>
  ({
    id: 1, type: "topic", title: "Java Fundamentals & Complexity Analysis", order: 0,
    status: "current", score: { earned: 50, total: 2200 }, weight: 1, basePoints: 2200,
    unlockRule: "sequential", lockReason: null, isCalibration: false,
    content: { articles: 5, quizzes: 2, coding: 2, videos: 0 },
    itemCount: 9, questionCount: 0, proctored: false, durationMinutes: null,
    tutor: { state: "ready", sessions: 0, minutes: 0 },
    ref: { submoduleId: 912 }, ...over,
  }) as JourneyNodeView;

const paper = (over: Partial<JourneyNodeView> = {}): JourneyNodeView =>
  ({
    ...mod(), id: 9, type: "week_final", title: "Week 1 Check", status: "available",
    score: { earned: 0, total: 240 }, weight: 2, questionCount: 20, itemCount: 0,
    content: null, tutor: null,
    ref: { assessmentId: 77, assessmentSlug: "imp-14-wk01-final" }, ...over,
  }) as JourneyNodeView;

beforeEach(() => {
  push.mockClear();
  startTemplateInterview.mockReset();
});

describe("a control inside the module card", () => {
  it("sends Learn with AI Tutor to the tutor, not to the module", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={1} />);
    fireEvent.click(screen.getByRole("button", { name: /with the AI Tutor/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    const href = push.mock.calls[0][0] as string;
    expect(href.startsWith("/ai-tutor/session/new?")).toBe(true);
    expect(href).not.toContain("/adaptive-courses/");
  });

  it("has NO tutor tile - the pill above is the only way in", () => {
    // There used to be a tile as well, and two controls for one thing is what kept making an
    // optional help sit in a row of steps. The pill is asserted in the test above this one.
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={1} />);
    expect(screen.queryByText("AI TUTOR")).toBeNull();
  });

  it("still opens the module when the card itself is clicked", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={1} />);
    fireEvent.click(screen.getByText("Java Fundamentals & Complexity Analysis"));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toBe("/adaptive-courses/14/submodule/912");
  });

  it("starts the interview from an interview step without opening anything else first", async () => {
    startTemplateInterview.mockResolvedValue({ id: 5501, opening_question_text: null });
    const iv = mod({
      id: 5, type: "interview", title: "Mock interview", tutor: null,
      durationMinutes: 20, ref: { interviewTemplateId: 28 },
    });
    render(<NodeRow node={iv} courseId={14} stepNo={2} />);
    fireEvent.click(screen.getByRole("button", { name: /mock interview/i }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toContain("/adaptive-courses/14/interview/5501");
  });
});

/**
 * The week's paper is the WEEK's, not any one topic's.
 *
 * Reported: "The assessment are built week wise but they are being shown topic wise, for
 * example in week 2, 2 topics are there and both have the same assessment so if a student
 * completes the content of arrays and try to take the assessment, he will face questions from
 * strings also." On production, Impacteers week 2 is `Arrays & Matrix Problems` + `Strings` +
 * one `Week 2 Check`, and the paper was taken off the rail and redrawn as a tile on BOTH topic
 * cards. Naming the tile after the paper ("WEEK 2 CHECK") was tried first and was not enough:
 * a control sitting on a topic's card reads as that topic's, whatever it is called.
 */
describe("a module card", () => {
  it("offers no assessment at all", () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={1} />);
    expect(screen.queryByText(/CHECK|ASSESSMENT/)).toBeNull();
    expect(screen.queryByTestId("module-triad")).toBeNull();
  });

  it("states its own contents on the line where the tiles used to be", () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={1} />);
    expect(screen.getByText("2 quizzes · 5 articles · 2 coding")).toBeInTheDocument();
  });
});

describe("the week's paper, on its own row", () => {
  it("goes to the paper", async () => {
    render(<NodeRow node={paper()} courseId={14} stepNo={2} />);
    fireEvent.click(screen.getByText("Week 1 Check"));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toContain("/assessments/imp-14-wk01-final");
  });

  it("goes to the result once it is done", async () => {
    render(<NodeRow node={paper({ status: "done", score: { earned: 17, total: 240 } })}
                    courseId={14} stepNo={2} />);
    fireEvent.click(screen.getByText("Week 1 Check"));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toContain("/assessments/result/imp-14-wk01-final");
  });
});
