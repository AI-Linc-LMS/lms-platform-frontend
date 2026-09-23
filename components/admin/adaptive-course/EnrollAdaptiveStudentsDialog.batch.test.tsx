import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * Enrolling a learner used to create a batch named after the course, behind the admin's back.
 * The server no longer does that; putting learners in a batch is now a choice made here, from the
 * tenant's EXISTING batches, and the default is "course only".
 */

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  enroll: vi.fn(),
  listCohorts: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: vi.fn(async () => ({
      students: [{ id: 7, name: "Sara Ahmed", email: "sara@x.com" }],
      pagination: { total_pages: 1 },
    })),
  },
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: mocks.listCohorts },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/admin/admin-adaptive-course.service")>()),
  adminAdaptiveCourseService: { enrollStudents: mocks.enroll },
}));

import { EnrollAdaptiveStudentsDialog } from "./EnrollAdaptiveStudentsDialog";

const batch = (id: number, name: string, status = "active") => ({
  id, name, status, code: null, start_date: null, end_date: null, timezone: "Asia/Kolkata",
  capacity: null, waitlist_enabled: false, enroll_mode: "open", is_template: false,
  member_count: 0, artifact_count: 0, created_at: "", updated_at: "",
});

function renderDialog() {
  const onClose = vi.fn();
  render(
    <EnrollAdaptiveStudentsDialog open courseId={40} enrolledIds={new Set()} onClose={onClose} onEnrolled={vi.fn()} />,
  );
  return { onClose };
}

beforeEach(() => {
  mocks.showToast.mockReset();
  mocks.enroll.mockReset();
  mocks.listCohorts.mockReset();
});

describe("EnrollAdaptiveStudentsDialog batch choice", () => {
  it("defaults to course only and sends no batch", async () => {
    mocks.listCohorts.mockResolvedValue([batch(3, "8026-M")]);
    mocks.enroll.mockResolvedValue({ succeeded: 1, skipped: 0, refused: [], failed: [] });
    renderDialog();
    expect(await screen.findByText("Course only. Enrolling never creates a batch.")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    await waitFor(() => expect(mocks.enroll).toHaveBeenCalledWith(40, [7], { compPaid: false }));
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith("Enrolled 1", "success"));
  });

  it("sends the chosen existing batch and reports who joined it", async () => {
    mocks.listCohorts.mockResolvedValue([batch(3, "8026-M"), batch(4, "Old", "archived")]);
    mocks.enroll.mockResolvedValue({
      succeeded: 1, skipped: 0, refused: [], failed: [],
      cohort: { id: 3, name: "8026-M", added: 1, already: 0 },
    });
    renderDialog();
    fireEvent.mouseDown(await screen.findByRole("combobox", { name: /also add to a batch/i }));
    const list = await screen.findByRole("listbox");
    // Archived batches are not offered.
    expect(within(list).queryByText("Old")).toBeNull();
    fireEvent.click(within(list).getByText("8026-M"));
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    await waitFor(() =>
      expect(mocks.enroll).toHaveBeenCalledWith(40, [7], { compPaid: false, cohortId: 3 }),
    );
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith("Enrolled 1 · 1 added to 8026-M", "success"),
    );
  });

  it("hides the picker when batches cannot be listed, and enrolment still works", async () => {
    mocks.listCohorts.mockRejectedValue(new Error("403"));
    mocks.enroll.mockResolvedValue({ succeeded: 1, skipped: 0, refused: [], failed: [] });
    renderDialog();
    fireEvent.click(await screen.findByRole("checkbox"));
    expect(screen.queryByRole("combobox", { name: /also add to a batch/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    await waitFor(() => expect(mocks.enroll).toHaveBeenCalledWith(40, [7], { compPaid: false }));
  });

  it("says WHY the server refused the batch, under the picker, and keeps the dialog open", async () => {
    // The batch holds a paid course an admin granted, so only an admin may add learners to it.
    // A toast would vanish, and the control the admin has to change is the picker itself.
    mocks.listCohorts.mockResolvedValue([batch(3, "8026-M")]);
    mocks.enroll.mockRejectedValue({
      response: {
        status: 403,
        data: {
          detail: "An admin gave this batch a paid course, so only an admin can add learners to it.",
          code: "paid_grant_admin_only",
        },
      },
    });
    const { onClose } = renderDialog();
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /also add to a batch/i }));
    fireEvent.click(await within(await screen.findByRole("listbox")).findByText("8026-M"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));

    expect(
      await screen.findByText(
        "An admin gave this batch a paid course, so only an admin can add learners to it.",
      ),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();

    // Picking another batch clears the refusal, so the admin can try again.
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /also add to a batch/i }));
    fireEvent.click(await within(await screen.findByRole("listbox")).findByText("No batch - course only"));
    await waitFor(() =>
      expect(
        screen.queryByText(
          "An admin gave this batch a paid course, so only an admin can add learners to it.",
        ),
      ).toBeNull(),
    );
  });
});
