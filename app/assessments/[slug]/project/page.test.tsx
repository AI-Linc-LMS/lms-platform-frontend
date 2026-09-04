/**
 * Opening a project assessment for the first time.
 *
 * Reported: clicking Start on a project assessment showed "You have not started this assessment
 * yet." The detail page routes a take-home learner straight here, past the exam player — and the
 * player's route is what calls start-assessment — so no submission ever existed and this page
 * could only report that nothing had been started. The feature could not be begun at all.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getMyProjects = vi.fn();
const startAssessment = vi.fn();

vi.mock("@/lib/services/project-workspace.service", () => ({
  getMyProjects: (...a: unknown[]) => getMyProjects(...a),
  submitProjectAttempt: vi.fn(),
}));
vi.mock("@/lib/services/assessment.service", () => ({
  assessmentService: { startAssessment: (...a: unknown[]) => startAssessment(...a) },
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "my-project" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/projects/ProjectWorkspace", () => ({
  default: () => <div data-testid="workspace" />,
}));

import ProjectPage from "./page";

function httpError(status: number, data?: unknown) {
  const e = new Error(`status ${status}`) as Error & { response?: unknown };
  e.response = { status, data };
  return e;
}

const OPEN = {
  assessment: { id: 1, slug: "my-project", title: "Build it", end_time: null, is_take_home: true },
  submission: { id: 9, status: "in_progress", is_open: true },
  workspaces: [{ id: 5, template: { id: 2, title: "Brief" } }],
};

describe("opening a project assessment", () => {
  beforeEach(() => {
    getMyProjects.mockReset();
    startAssessment.mockReset();
  });

  it("starts the attempt when there is not one yet, instead of reporting a dead end", async () => {
    getMyProjects
      .mockImplementationOnce(async () => {
        throw httpError(404, { error: "You have not started this assessment yet." });
      })
      .mockImplementationOnce(async () => OPEN);
    startAssessment.mockResolvedValue({});

    render(<ProjectPage />);

    await waitFor(() => expect(screen.getByTestId("workspace")).toBeTruthy());
    expect(startAssessment).toHaveBeenCalledWith("my-project");
    expect(getMyProjects).toHaveBeenCalledTimes(2);
  });

  it("does not re-start an attempt that already exists", async () => {
    getMyProjects.mockResolvedValue(OPEN);
    render(<ProjectPage />);
    await waitFor(() => expect(screen.getByTestId("workspace")).toBeTruthy());
    expect(startAssessment).not.toHaveBeenCalled();
  });

  it("repeats the server's own refusal rather than a generic failure", async () => {
    // The window, the device rule and the paywall are the things a learner can act on.
    getMyProjects.mockImplementation(async () => {
      throw httpError(404, {});
    });
    startAssessment.mockImplementation(async () => {
      throw httpError(400, { error: "This assessment has not opened yet." });
    });

    render(<ProjectPage />);
    await waitFor(() =>
      expect(screen.getByText("This assessment has not opened yet.")).toBeTruthy()
    );
  });

  it("names a paywall as a paywall", async () => {
    getMyProjects.mockImplementation(async () => {
      throw httpError(404, {});
    });
    startAssessment.mockImplementation(async () => {
      throw httpError(402, {});
    });
    render(<ProjectPage />);
    await waitFor(() =>
      expect(screen.getByText(/has to be purchased/)).toBeTruthy()
    );
  });
});
