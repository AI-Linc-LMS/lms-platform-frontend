import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { CohortArtifact } from "@/lib/services/admin/admin-cohorts.service";

/**
 * The cohort Assignments tab against artifact types this build did not ship with.
 *
 * The server owns the list of artifact types. classic_course rows are PROTECT and will keep
 * coming back long after the classic UI is gone, and new types can arrive before a tenant's
 * site is rebuilt. Either way a row the build cannot name must not take the page down.
 */

vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { removeArtifact: vi.fn(), assignArtifact: vi.fn() },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/services/admin/admin-assessment.service", () => ({
  getAssessments: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/config", () => ({ config: { clientId: "1" } }));

import { CohortAssignmentsTab } from "./CohortAssignmentsTab";

// artifact_type is a plain string here on purpose: the point is types the union does not list.
function artifact(overrides: Omit<Partial<CohortArtifact>, "artifact_type"> & { artifact_type: string }): CohortArtifact {
  return {
    id: 1,
    target: { id: 10, label: "Target" },
    role: "supplemental",
    visibility: "enrolled_only",
    is_required: false,
    order: 0,
    weight: 1,
    status: "active",
    visible_from: null,
    available_from: null,
    due_at: null,
    closes_at: null,
    drip_mode: "none",
    drip_offset_days: 0,
    result_release_mode: "immediate",
    result_release_at: null,
    created_at: "2026-09-01T00:00:00Z",
    ...overrides,
  } as unknown as CohortArtifact;
}

describe("CohortAssignmentsTab with artifact types outside this build", () => {
  it("renders a row whose type the build does not know, alongside the known ones", () => {
    render(
      <CohortAssignmentsTab
        cohortId={5}
        onChanged={vi.fn()}
        artifacts={[
          artifact({ id: 1, artifact_type: "assessment", target: { id: 3, label: "Midterm" } }),
          artifact({ id: 2, artifact_type: "learning_path", target: { id: 4, label: "Path A" } }),
        ]}
      />,
    );

    expect(screen.getByText("Midterm")).toBeInTheDocument();
    expect(screen.getByText("Path A")).toBeInTheDocument();
    // The raw type, readable, so an admin can tell what the row is before removing it.
    expect(screen.getByText(/Learning path · supplemental/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove assignment" })).toHaveLength(2);
  });

  it("still lists an existing classic course row", () => {
    render(
      <CohortAssignmentsTab
        cohortId={5}
        onChanged={vi.fn()}
        artifacts={[artifact({ artifact_type: "classic_course", target: { id: 290, label: "Data Science" } })]}
      />,
    );

    expect(screen.getByText("Data Science")).toBeInTheDocument();
  });

  it("does not offer classic courses for a new assignment", async () => {
    render(<CohortAssignmentsTab cohortId={5} onChanged={vi.fn()} artifacts={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.mouseDown(within(dialog).getByRole("combobox", { name: /what do you want to give them/i }));
    const options = within(await screen.findByRole("listbox")).getAllByRole("option");
    const labels = options.map((o) => o.textContent ?? "");

    expect(labels.some((l) => /assessment/i.test(l))).toBe(true);
    expect(labels.some((l) => /classic/i.test(l))).toBe(false);
  });
});
