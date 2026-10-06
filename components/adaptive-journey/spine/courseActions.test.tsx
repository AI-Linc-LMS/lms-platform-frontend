import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * The two actions the spine added to a course: having the tutor teach a module, and sitting the
 * course's mock interview.
 *
 * Both are things the course page could not do before. The tutor had no link from any course
 * surface at all, and the interview step pointed at `/mock-interview/courses` - a generic list
 * with no course and no template - so the step that promised an interview led away from it.
 */

const push = vi.fn();
const prefetch = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, prefetch, replace: vi.fn(), isPending: false }),
}));

const showToast = vi.fn();
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast }) }));

let tutorEnabled = true;
let v2Enabled = false;
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useIsAiVoiceTutorEnabled: () => tutorEnabled,
  useIsInterviewV2Enabled: () => v2Enabled,
}));

const startTemplateInterview = vi.fn();
vi.mock("@/lib/services/mock-interview.service", () => ({
  default: { startTemplateInterview: (...a: unknown[]) => startTemplateInterview(...a) },
}));

const prefetchInterviewerClip = vi.fn();
vi.mock("@/lib/hooks/useInterviewerVoice", () => ({
  prefetchInterviewerClip: (t: unknown) => prefetchInterviewerClip(t),
}));

import { TutorAction } from "./TutorAction";
import { InterviewAction } from "./InterviewAction";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const node = (over: Partial<JourneyNodeView> = {}) =>
  ({
    id: 4,
    type: "topic",
    title: "Recursion and the call stack",
    order: 4,
    status: "current",
    score: { earned: 0, total: 30 },
    weight: 1,
    basePoints: 30,
    unlockRule: "sequential",
    lockReason: null,
    isCalibration: false,
    content: null,
    itemCount: 3,
    questionCount: 0,
    proctored: false,
    durationMinutes: null,
    ref: { submoduleId: 912 },
    ...over,
  }) as JourneyNodeView;

beforeEach(() => {
  push.mockClear();
  startTemplateInterview.mockReset();
  prefetchInterviewerClip.mockClear();
  showToast.mockClear();
  tutorEnabled = true;
  v2Enabled = false;
});

describe("having the tutor teach a module", () => {
  it("opens a lesson carrying the module itself, not just its name", () => {
    // `submoduleId` is the whole point: it is what lets the backend build the lesson from this
    // module's own articles instead of guessing from the title.
    render(<TutorAction node={node()} />);
    fireEvent.click(screen.getByRole("button", { name: /Learn Recursion and the call stack with the AI Tutor/ }));
    expect(push).toHaveBeenCalledTimes(1);
    const href = push.mock.calls[0][0] as string;
    expect(href.startsWith("/ai-tutor/session/new?")).toBe(true);
    // Read the query back rather than matching the string: URLSearchParams spells a space `+`,
    // so an `encodeURIComponent` comparison fails on a correct URL.
    const q = new URLSearchParams(href.split("?")[1]);
    expect(q.get("submoduleId")).toBe("912");
    expect(q.get("source")).toBe("course");
    expect(q.get("topic")).toBe("Recursion and the call stack");
  });

  it("opens the lesson at the learner's calibrated level when there is one", () => {
    render(<TutorAction node={node()} level="advanced" />);
    fireEvent.click(screen.getByRole("button", { name: /AI Tutor/ }));
    expect(push.mock.calls[0][0]).toContain("level=advanced");
  });

  it("stays silent for a tenant that does not have the tutor", () => {
    // Default-deny, and silence rather than a disabled button: a greyed-out control would
    // advertise a feature this tenant cannot buy from here.
    tutorEnabled = false;
    render(<TutorAction node={node()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("stays silent on a step with no module behind it", () => {
    render(<TutorAction node={node({ type: "checkpoint", ref: { assessmentId: 3 } })} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("sitting the course's mock interview", () => {
  const interviewNode = node({
    type: "interview",
    title: "Mock interview",
    durationMinutes: 20,
    ref: { interviewTemplateId: 28 },
  });

  it("mints an interview and lands inside the course, not on a generic list", async () => {
    startTemplateInterview.mockResolvedValue({ id: 5501, opening_question_text: "Tell me about yourself." });
    render(<InterviewAction node={interviewNode} courseId={7} done={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Start the mock interview/ }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(startTemplateInterview).toHaveBeenCalledWith(28);
    const href = push.mock.calls[0][0] as string;
    expect(href).toContain("/adaptive-courses/7/interview/5501");
    expect(href).not.toContain("/mock-interview/courses");
    expect(href).toContain("mins=20");
  });

  it("warms the interviewer's first line while the candidate reads the begin screen", async () => {
    startTemplateInterview.mockResolvedValue({ id: 5502, opening_question_text: "Walk me through a project." });
    render(<InterviewAction node={interviewNode} courseId={7} done={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(prefetchInterviewerClip).toHaveBeenCalledWith("Walk me through a project."));
    expect(sessionStorage.getItem("adaptiveInterviewOpening_5502")).toBe("Walk me through a project.");
  });

  it("says so and stays on the page when the interview cannot be started", async () => {
    startTemplateInterview.mockRejectedValue(new Error("502"));
    render(<InterviewAction node={interviewNode} courseId={7} done={false} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  it("will not mint two interviews from a double click", async () => {
    // The happy path deliberately leaves the button busy: the navigation is in flight, and a
    // second POST would bill a second interview and orphan the first.
    let resolve: (v: unknown) => void = () => {};
    startTemplateInterview.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<InterviewAction node={interviewNode} courseId={7} done={false} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    fireEvent.click(btn);
    resolve({ id: 5503, opening_question_text: null });
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(startTemplateInterview).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when the template behind the step is gone", () => {
    // An admin can deactivate a template after the step exists. A button that always fails is
    // worse than no button.
    render(<InterviewAction node={node({ type: "interview", ref: {} })} courseId={7} done={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers a finished interview again rather than going quiet", () => {
    render(<InterviewAction node={interviewNode} courseId={7} done />);
    expect(screen.getByRole("button", { name: /again/i })).toBeTruthy();
  });

  describe("on a tenant that has the rebuilt interview", () => {
    // Two interview stacks are mounted at once. A tenant with `interview_realtime` gets the
    // rebuilt room, which mints its own session - so the launch is a route and NOT a POST.
    // Routing a round at the legacy endpoint is the bug this guards: it mints a v1 sitting
    // that the journey step can never be completed by, because completion reads v2.
    beforeEach(() => {
      v2Enabled = true;
    });

    it("routes to the rebuilt room instead of minting a legacy interview", async () => {
      render(<InterviewAction node={interviewNode} courseId={14} done={false} />);
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => expect(push).toHaveBeenCalled());
      expect(startTemplateInterview).not.toHaveBeenCalled();
      expect(push.mock.calls[0][0]).toContain("/interview/room?template=28");
    });

    it("carries the course back, so finishing does not strand the learner on the hub", async () => {
      // The room is a shared runtime reached from the hub too. Without `from`, every exit -
      // cancel, a dropped call, the result page - lands on /interview, a page the learner
      // never visited.
      render(<InterviewAction node={interviewNode} courseId={14} done={false} />);
      fireEvent.click(screen.getByRole("button"));
      await waitFor(() => expect(push).toHaveBeenCalled());
      const href = push.mock.calls[0][0] as string;
      expect(new URL(href, "https://x.invalid").searchParams.get("from")).toBe("/adaptive-courses/14");
    });
  });
});
