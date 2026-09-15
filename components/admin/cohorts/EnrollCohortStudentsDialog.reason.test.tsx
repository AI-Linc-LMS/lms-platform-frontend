import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * A refusal must reach the screen in the server's words. Adding learners to a batch an admin gave a
 * paid course is admin-only; a course manager used to see "Request failed with status code 403".
 */
const mocks = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: vi.fn(async () => ({ students: [{ id: 7, name: "Sara", email: "sara@x.com" }], pagination: { total_pages: 1 } })),
  },
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: {
    enrollMembers: vi.fn(async () => {
      const err = Object.assign(new Error("Request failed with status code 403"), {
        response: { status: 403, data: { detail: "An admin gave this batch a paid course, so only an admin can add learners to it.", code: "paid_grant_admin_only" } },
      });
      throw err;
    }),
  },
}));

import { EnrollCohortStudentsDialog } from "./EnrollCohortStudentsDialog";

describe("EnrollCohortStudentsDialog", () => {
  it("shows the server's reason for a refusal, not Axios's status line", async () => {
    render(<EnrollCohortStudentsDialog open cohortId={5} enrolledIds={new Set()} onClose={vi.fn()} onEnrolled={vi.fn()} />);
    fireEvent.click(await screen.findByText("Sara"));
    fireEvent.click(screen.getByRole("button", { name: /^enroll/i }));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        "An admin gave this batch a paid course, so only an admin can add learners to it.",
        "error",
      ),
    );
  });
});
