/**
 * An attempt nobody has submitted is not a submission.
 *
 * Reported from the admin side: a paper showed two attempts for one learner, one of them "In
 * progress · 0/0 answered", and the header counted it. The same mistake was on this page - the
 * roster and the counts above it were built from every attempt row that existed, and a row exists
 * from the moment a learner opens the paper.
 *
 * The fix separates rather than hides: submitted attempts are the roster and the count, and open
 * attempts get their own block, because an instructor genuinely does need to spot someone who is
 * stuck, failed a device check, or walked away. These tests pin both halves - that an open attempt
 * never appears among the results, and that it is still on the page and labelled for what it is.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getAssessmentSubmissions = vi.fn();
const getQuestionsExportJson = vi.fn();

vi.mock("@/lib/services/instructor.service", () => ({
  instructorService: {
    getAssessmentSubmissions: (...a: unknown[]) => getAssessmentSubmissions(...a),
  },
}));
vi.mock("@/lib/services/admin/admin-assessment.service", () => ({
  getQuestionsExportJson: (...a: unknown[]) => getQuestionsExportJson(...a),
  getSubmissionsExportJson: vi.fn(),
  isCodingQuestion: () => false,
  isMCQQuestion: () => true,
  isSubjectiveQuestion: () => false,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "745" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title }: { title?: string }) => <h1>{title}</h1>,
}));
vi.mock("@/components/scorecard/shared", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

import InstructorAssessmentDetailPage from "./page";

function submittedRow(over: Record<string, unknown> = {}) {
  return {
    submission_id: 18041,
    student_id: 20982,
    name: "Scarlet Mondal",
    email: "scarlet@example.com",
    score: 8,
    max_marks: 8,
    status: "submitted",
    review_status: "not_required",
    started_at: "2026-09-09T11:08:36Z",
    completed_at: "2026-09-09T11:23:42Z",
    submitted_at: "2026-09-09T11:23:42Z",
    ...over,
  };
}

function openAttempt(over: Record<string, unknown> = {}) {
  return {
    submission_id: 18106,
    user_profile_id: 21314,
    name: "Priya Nair",
    email: "priya@example.com",
    started_at: "2026-09-17T16:20:53Z",
    last_activity_at: "2026-09-17T16:41:02Z",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getQuestionsExportJson.mockResolvedValue({ assessment: { id: 745, title: "Calibration" }, sections: [] });
});

describe("an open attempt is kept out of the submissions roster", () => {
  it("does not list a learner who is still attempting among the results", async () => {
    getAssessmentSubmissions.mockResolvedValue({
      assessment: { id: 745, title: "Calibration", max_marks: 8, course_title: "Data Analytics" },
      count: 1,
      pending_grading: 0,
      results: [submittedRow()],
      in_progress: [openAttempt()],
      in_progress_count: 1,
    });

    render(<InstructorAssessmentDetailPage />);

    await waitFor(() => expect(screen.getAllByText("Scarlet Mondal").length).toBeGreaterThan(0));
    // Priya is on the page, but never inside the results table.
    const roster = await screen.findByTestId("in-progress-attempts");
    expect(roster).toHaveTextContent("Priya Nair");
  });

  it("gives the open attempts their own heading, count and explanation", async () => {
    getAssessmentSubmissions.mockResolvedValue({
      assessment: { id: 745, title: "Calibration", max_marks: 8, course_title: "Data Analytics" },
      count: 1,
      pending_grading: 0,
      results: [submittedRow()],
      in_progress: [openAttempt(), openAttempt({ submission_id: 18107, name: "Arun Das" })],
      in_progress_count: 2,
    });

    render(<InstructorAssessmentDetailPage />);

    const panel = await screen.findByTestId("in-progress-attempts");
    // The count is its own, and says what it counts.
    expect(panel).toHaveTextContent("Still attempting (2)");
    // And it says, in words, that these are not results.
    expect(panel).toHaveTextContent(/not submitted/i);
    expect(panel).toHaveTextContent(/nothing to grade/i);
  });

  it("renders nothing at all when every attempt is finished", async () => {
    getAssessmentSubmissions.mockResolvedValue({
      assessment: { id: 745, title: "Calibration", max_marks: 8, course_title: "Data Analytics" },
      count: 1,
      pending_grading: 0,
      results: [submittedRow()],
      in_progress: [],
      in_progress_count: 0,
    });

    render(<InstructorAssessmentDetailPage />);

    await waitFor(() => expect(screen.getAllByText("Scarlet Mondal").length).toBeGreaterThan(0));
    // An empty box is worse than no box: it reads as a section that failed to load.
    expect(screen.queryByTestId("in-progress-attempts")).toBeNull();
  });

  it("survives a backend that predates the split and sends no in_progress key", async () => {
    getAssessmentSubmissions.mockResolvedValue({
      assessment: { id: 745, title: "Calibration", max_marks: 8, course_title: "Data Analytics" },
      count: 1,
      pending_grading: 0,
      results: [submittedRow()],
    });

    render(<InstructorAssessmentDetailPage />);

    await waitFor(() => expect(screen.getAllByText("Scarlet Mondal").length).toBeGreaterThan(0));
    expect(screen.queryByTestId("in-progress-attempts")).toBeNull();
  });

  it("says nobody has SUBMITTED, not that nobody has sat it, when the only attempt is open", async () => {
    getAssessmentSubmissions.mockResolvedValue({
      assessment: { id: 745, title: "Calibration", max_marks: 8, course_title: "Data Analytics" },
      count: 0,
      pending_grading: 0,
      results: [],
      in_progress: [openAttempt()],
      in_progress_count: 1,
    });

    render(<InstructorAssessmentDetailPage />);

    // "Nobody has sat this paper" in front of a person who is sitting it right now is simply wrong.
    expect(await screen.findByText(/has submitted this paper yet/i)).toBeTruthy();
    expect(screen.queryByText(/has sat this paper yet/i)).toBeNull();
    expect(await screen.findByTestId("in-progress-attempts")).toHaveTextContent("Priya Nair");
  });
});
