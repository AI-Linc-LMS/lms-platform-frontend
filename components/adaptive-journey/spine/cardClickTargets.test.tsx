import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * A control inside the module card must go where IT says, not where the card says.
 *
 * Reported live: "Learn with AI Tutor is redirecting to course, not ai tutor - same is
 * happening with assessment". One cause for both. The whole card carries `onClick={go}` so
 * that clicking anywhere on a module opens it, and the tutor button, the triad tiles and the
 * interview button all sit inside it. A click on any of them fired its own handler and then
 * BUBBLED to the card, whose handler ran second and won - so every nested control ended up
 * opening the module.
 *
 * Each case below asserts `push` was called exactly ONCE, and with the right URL. Asserting
 * only the last call would have passed throughout the bug.
 */

const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, prefetch: vi.fn(), replace: vi.fn(), isPending: false }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useIsAiVoiceTutorEnabled: () => true }));
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
    render(<NodeRow node={mod()} courseId={14} stepNo={1} checkpoint={paper()} moduleNo={1} />);
    fireEvent.click(screen.getByRole("button", { name: /with the AI Tutor/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    const href = push.mock.calls[0][0] as string;
    expect(href.startsWith("/ai-tutor/session/new?")).toBe(true);
    expect(href).not.toContain("/adaptive-courses/");
  });

  it("sends the AI TUTOR tile to the tutor, not to the module", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} checkpoint={paper()} moduleNo={1} />);
    fireEvent.click(screen.getByRole("button", { name: /AI TUTOR/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toContain("/ai-tutor/session/new");
  });

  it("sends the ASSESSMENT tile to the paper, not to the module", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} checkpoint={paper()} moduleNo={1} />);
    fireEvent.click(screen.getByRole("button", { name: /ASSESSMENT/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    const href = push.mock.calls[0][0] as string;
    expect(href).toContain("/assessments/imp-14-wk01-final");
    expect(href.startsWith("/adaptive-courses/14/submodule")).toBe(false);
  });

  it("sends a finished paper's tile to its result", async () => {
    const done = paper({ status: "done", score: { earned: 17, total: 240 } });
    render(<NodeRow node={mod()} courseId={14} stepNo={1} checkpoint={done} moduleNo={1} />);
    fireEvent.click(screen.getByRole("button", { name: /ASSESSMENT/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toContain("/assessments/result/imp-14-wk01-final");
  });

  it("sends the LESSONS tile into the module, which IS where the card goes", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} checkpoint={paper()} moduleNo={1} />);
    fireEvent.click(screen.getByRole("button", { name: /LESSONS/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    // Same destination as the card, but still exactly one navigation.
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toBe("/adaptive-courses/14/submodule/912");
  });

  it("still opens the module when the card itself is clicked", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} checkpoint={paper()} moduleNo={1} />);
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
