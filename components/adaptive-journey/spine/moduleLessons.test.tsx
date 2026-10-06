import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Opening a module to see what is in it.
 *
 * The board knows only how MANY items a module holds, so the titles are fetched on expand. The
 * rules worth pinning: the fetch happens once the learner asks and not before, a locked module
 * offers no chevron at all, and each row says only what the API actually carries - a quiz has
 * no duration, so its row does not invent one.
 */

const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, prefetch: vi.fn(), replace: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useIsAiVoiceTutorEnabled: () => true,
  useIsInterviewV2Enabled: () => false,
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/mock-interview.service", () => ({ default: { startTemplateInterview: vi.fn() } }));
vi.mock("@/lib/hooks/useInterviewerVoice", () => ({ prefetchInterviewerClip: vi.fn() }));

const getSubmodule = vi.fn();
vi.mock("@/lib/services/adaptive-course.service", () => ({
  adaptiveCourseService: { getSubmodule: (...a: unknown[]) => getSubmodule(...a) },
}));

import { NodeRow } from "./NodeRow";
import { stepMeta, stepTiers } from "./ModuleLessons";
import type { FlowStep } from "@/lib/adaptive/courseFlow";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const mod = (over: Partial<JourneyNodeView> = {}): JourneyNodeView =>
  ({
    id: 1, type: "topic", title: "Data wrangling with Pandas", order: 0, status: "current",
    score: { earned: 0, total: 2200 }, weight: 1, basePoints: 2200,
    unlockRule: "sequential", lockReason: null, isCalibration: false,
    content: { articles: 2, quizzes: 0, coding: 2, videos: 1 },
    itemCount: 5, questionCount: 0, proctored: false, durationMinutes: null,
    tutor: { state: "ready", sessions: 0, minutes: 0 },
    ref: { submoduleId: 912 }, ...over,
  }) as JourneyNodeView;

const submodule = {
  id: 912, order: 0, title: "Data wrangling with Pandas", description: "",
  video_companions: [
    { id: 1, title: "DataFrames from the ground up", video_title: "x", thumbnail_url: "",
      duration_seconds: 960, check_in_count: 0, completed: true },
  ],
  articles: [
    { article_id: 2, title: "Indexing, filtering, grouping", default_tier: "Intermediate",
      available_tiers: ["Beginner", "Intermediate", "Advanced", "Expert"],
      reading_time_minutes: 12, concepts: [], completed: true },
    { article_id: 3, title: "Cleaning & missing data", default_tier: "Intermediate",
      available_tiers: ["Beginner", "Intermediate", "Advanced", "Expert"],
      reading_time_minutes: 14, concepts: [], completed: false },
  ],
  quizzes: [{ config_id: 4, quiz_title: "Pandas check", completed: false }],
  coding_sets: [],
};

beforeEach(() => {
  push.mockClear();
  getSubmodule.mockReset();
  getSubmodule.mockResolvedValue(submodule);
});

describe("opening a module", () => {
  it("fetches nothing until the learner asks", () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={3} />);
    expect(getSubmodule).not.toHaveBeenCalled();
  });

  it("lists the lessons in the order they are taken", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={3} />);
    fireEvent.click(screen.getByRole("button", { name: /Show the lessons in/ }));
    await waitFor(() => expect(screen.getByText("DataFrames from the ground up")).toBeTruthy());
    expect(getSubmodule).toHaveBeenCalledWith(14, 912);
    const titles = ["DataFrames from the ground up", "Indexing, filtering, grouping",
                    "Cleaning & missing data", "Pandas check"];
    for (const t of titles) expect(screen.getByText(t)).toBeTruthy();
  });

  it("marks the first unfinished lesson, and only that one", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={3} />);
    fireEvent.click(screen.getByRole("button", { name: /Show the lessons in/ }));
    await waitFor(() => expect(screen.getByText("Cleaning & missing data")).toBeTruthy());
    expect(screen.getAllByText("NOW")).toHaveLength(1);
  });

  it("opens a lesson without also opening the module", async () => {
    // The row sits inside the card, whose own click opens the module. Both firing would land
    // the learner on the module instead of the lesson they picked.
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={3} />);
    fireEvent.click(screen.getByRole("button", { name: /Show the lessons in/ }));
    await waitFor(() => expect(screen.getByText("Cleaning & missing data")).toBeTruthy());
    push.mockClear();
    fireEvent.click(screen.getByText("Cleaning & missing data"));
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toContain("/article/3");
  });

  it("closes again", async () => {
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={3} />);
    fireEvent.click(screen.getByRole("button", { name: /Show the lessons in/ }));
    await waitFor(() => expect(screen.getByText("Pandas check")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Hide the lessons in/ }));
    expect(screen.queryByText("Pandas check")).toBeNull();
  });

  it("offers no chevron on a locked module", () => {
    // It would promise a list it then refuses to act on.
    render(<NodeRow node={mod({ status: "locked", lockReason: "Finish the one before" })} courseId={14} stepNo={1} moduleNo={3} />);
    expect(screen.queryByRole("button", { name: /lessons in/ })).toBeNull();
  });

  it("offers no chevron on a step that is not a module", () => {
    const paper = mod({ type: "week_final", title: "Week 1 Check", tutor: null,
                        ref: { assessmentId: 9, assessmentSlug: "wk1" } });
    render(<NodeRow node={paper} courseId={14} stepNo={2} />);
    expect(screen.queryByRole("button", { name: /lessons in/ })).toBeNull();
  });

  it("says so rather than hanging when the lessons cannot be loaded", async () => {
    getSubmodule.mockRejectedValue(new Error("502"));
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={3} />);
    fireEvent.click(screen.getByRole("button", { name: /Show the lessons in/ }));
    await waitFor(() => expect(screen.getByText(/Could not load this module/)).toBeTruthy());
  });

  it("says a module is empty rather than showing a blank panel", async () => {
    getSubmodule.mockResolvedValue({ ...submodule, video_companions: [], articles: [], quizzes: [], coding_sets: [] });
    render(<NodeRow node={mod()} courseId={14} stepNo={1} moduleNo={3} />);
    fireEvent.click(screen.getByRole("button", { name: /Show the lessons in/ }));
    await waitFor(() => expect(screen.getByText(/no lessons yet/)).toBeTruthy());
  });
});

describe("what a lesson row claims about itself", () => {
  const step = (kind: string, source: unknown): FlowStep =>
    ({ kind, key: "k", title: "t", href: "/h", completed: false, source }) as FlowStep;

  it("reads an article's reading time", () => {
    expect(stepMeta(step("article", { reading_time_minutes: 14 }))).toBe("Article · 14m");
  });

  it("turns a video's seconds into minutes", () => {
    expect(stepMeta(step("video", { duration_seconds: 960 }))).toBe("Video · 16m");
  });

  it("never rounds a short video down to zero minutes", () => {
    expect(stepMeta(step("video", { duration_seconds: 20 }))).toBe("Video · 1m");
  });

  it("claims no duration for a quiz or a coding problem, because the API carries none", () => {
    expect(stepMeta(step("quiz", { config_id: 1 }))).toBe("Quiz");
    expect(stepMeta(step("coding", { problem_id: 1 }))).toBe("Code");
  });

  it("counts reading tiers only on articles", () => {
    expect(stepTiers(step("article", { available_tiers: ["a", "b", "c", "d"] }))).toBe(4);
    expect(stepTiers(step("video", { duration_seconds: 10 }))).toBe(0);
    expect(stepTiers(step("article", {}))).toBe(0);
  });
});
