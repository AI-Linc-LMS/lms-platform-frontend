import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * Enrolling learners into a PAID course from the course page.
 *
 * It used to come back "Enrolled 0" with no reason and no way through, while the platform's own
 * messages told admins to "enroll individual students as a comp". An institution whose learners
 * cannot pay by card (InUn) collects offline and has to be able to grant access itself.
 */

const mocks = vi.hoisted(() => ({ showToast: vi.fn(), enroll: vi.fn() }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: vi.fn(async () => ({
      students: [{ id: 7, name: "Sara Ahmed", email: "sara@x.com" }],
      pagination: { total_pages: 1 },
    })),
  },
}));
// No batches on this tenant: the optional batch picker stays hidden and the payload is unchanged.
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/admin/admin-adaptive-course.service")>()),
  adminAdaptiveCourseService: { enrollStudents: mocks.enroll },
}));

import { EnrollAdaptiveStudentsDialog } from "./EnrollAdaptiveStudentsDialog";

const refused = (canComp: boolean | undefined) => ({
  succeeded: 0, skipped: 0, failed: [], missing: [],
  refused: [{ student_id: 7, detail: "This course must be purchased." }],
  code: "paid_course_requires_comp",
  ...(canComp === undefined ? {} : { can_comp: canComp }),
});

async function pickAndEnroll(props: Partial<Parameters<typeof EnrollAdaptiveStudentsDialog>[0]> = {}) {
  const onEnrolled = vi.fn();
  const onClose = vi.fn();
  render(
    <EnrollAdaptiveStudentsDialog open courseId={40} enrolledIds={new Set()} onClose={onClose} onEnrolled={onEnrolled} {...props} />,
  );
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
  return { onEnrolled, onClose };
}

beforeEach(() => {
  mocks.showToast.mockReset();
  mocks.enroll.mockReset();
});

describe("EnrollAdaptiveStudentsDialog on a paid course", () => {
  it("asks an admin whether to give it free, then enrols only the refused learners with comp", async () => {
    mocks.enroll.mockResolvedValueOnce(refused(true)).mockResolvedValueOnce({ succeeded: 1, skipped: 0, refused: [], failed: [] });
    const { onEnrolled, onClose } = await pickAndEnroll();

    expect(await screen.findByText("Give this paid course for free?")).toBeInTheDocument();
    expect(mocks.enroll).toHaveBeenCalledTimes(1);
    expect(mocks.enroll).toHaveBeenLastCalledWith(40, [7], { compPaid: false });

    fireEvent.click(screen.getByRole("button", { name: "Give free access" }));
    await waitFor(() => expect(mocks.enroll).toHaveBeenCalledTimes(2));
    expect(mocks.enroll).toHaveBeenLastCalledWith(40, [7], { compPaid: true });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onEnrolled).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenLastCalledWith("Enrolled 1 (1 free of charge)", "success");
  });

  it("never comps without the admin saying yes", async () => {
    mocks.enroll.mockResolvedValueOnce(refused(true));
    const { onClose } = await pickAndEnroll();
    const prompt = await screen.findByRole("dialog", { name: "Give this paid course for free?" });
    fireEvent.click(within(prompt).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Give this paid course for free?" })).toBeNull());
    expect(mocks.enroll).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("tells someone who may not comp why, instead of offering what the server will refuse", async () => {
    mocks.enroll.mockResolvedValueOnce(refused(false));
    await pickAndEnroll();
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        expect.stringContaining("only an admin can give it to learners who haven't bought it"),
        "error",
      ),
    );
    expect(screen.queryByText("Give this paid course for free?")).toBeNull();
  });

  it("does not offer a comp an older server would silently ignore", async () => {
    mocks.enroll.mockResolvedValueOnce(refused(undefined));
    await pickAndEnroll();
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith(expect.stringMatching(/have to buy it/), "error"));
    expect(screen.queryByText("Give this paid course for free?")).toBeNull();
  });

  it("does not arm the prompt when the dialog was closed while the request was out", async () => {
    let release: (v: unknown) => void = () => {};
    mocks.enroll.mockReturnValueOnce(new Promise((r) => { release = r; }));
    const onClose = vi.fn();
    const { rerender } = render(
      <EnrollAdaptiveStudentsDialog open courseId={40} enrolledIds={new Set()} onClose={onClose} onEnrolled={vi.fn()} />,
    );
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    rerender(<EnrollAdaptiveStudentsDialog open={false} courseId={40} enrolledIds={new Set()} onClose={onClose} onEnrolled={vi.fn()} />);
    release(refused(true));
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalled());
    rerender(<EnrollAdaptiveStudentsDialog open courseId={40} enrolledIds={new Set()} onClose={onClose} onEnrolled={vi.fn()} />);
    await screen.findByRole("checkbox");
    expect(screen.queryByText("Give this paid course for free?")).toBeNull();
  });

  it("still reports first-pass failures after a comp, and keeps the dialog open", async () => {
    mocks.enroll
      .mockResolvedValueOnce({ ...refused(true), failed: [{ student_id: 9, detail: "Student belongs to a different institution than the course." }] })
      .mockResolvedValueOnce({ succeeded: 1, skipped: 0, refused: [], failed: [] });
    const { onClose } = await pickAndEnroll();
    fireEvent.click(await screen.findByRole("button", { name: "Give free access" }));
    await waitFor(() => expect(mocks.enroll).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenLastCalledWith("Enrolled 1 (1 free of charge) · 1 failed", "error"),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("never arms a prompt from a request sent by an EARLIER opening (closed and reopened while out)", async () => {
    let release: (v: unknown) => void = () => {};
    mocks.enroll.mockReturnValueOnce(new Promise((r) => { release = r; }));
    const props = { courseId: 40, enrolledIds: new Set<number>(), onClose: vi.fn(), onEnrolled: vi.fn() };
    const { rerender } = render(<EnrollAdaptiveStudentsDialog open {...props} />);
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    rerender(<EnrollAdaptiveStudentsDialog open={false} {...props} />);
    rerender(<EnrollAdaptiveStudentsDialog open {...props} />);
    release({ ...refused(true), succeeded: 1 });
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        "Enrolled 1 · 1 not enrolled: this is a paid course. Enroll them again to give it to them free.",
        "error",
      ),
    );
    expect(screen.queryByRole("dialog", { name: "Give this paid course for free?" })).toBeNull();
    expect(mocks.enroll).toHaveBeenCalledTimes(1);
  });

  it("reports the first pass when the admin declines the prompt", async () => {
    mocks.enroll.mockResolvedValueOnce({
      ...refused(true), succeeded: 2, missing: [11],
      failed: [{ student_id: 9, detail: "Student belongs to a different institution than the course." }],
    });
    await pickAndEnroll();
    const prompt = await screen.findByRole("dialog", { name: "Give this paid course for free?" });
    fireEvent.click(within(prompt).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenLastCalledWith(
        "Enrolled 2 · 1 not found · 1 failed · 1 not enrolled: the paid course was not given free",
        "error",
      ),
    );
    expect(mocks.enroll).toHaveBeenCalledTimes(1);
  });

  it("keeps the first pass in the message when the comp request itself fails", async () => {
    mocks.enroll
      .mockResolvedValueOnce({ ...refused(true), succeeded: 2 })
      .mockRejectedValueOnce({ response: { data: { detail: "Only an admin can give a paid course for free." } } });
    await pickAndEnroll();
    fireEvent.click(await screen.findByRole("button", { name: "Give free access" }));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenLastCalledWith(
        "Enrolled 2 · 1 not given free: Only an admin can give a paid course for free.",
        "error",
      ),
    );
  });

  it("a success from an earlier opening does not close the dialog the admin reopened", async () => {
    let release: (v: unknown) => void = () => {};
    mocks.enroll.mockReturnValueOnce(new Promise((r) => { release = r; }));
    const onClose = vi.fn();
    const props = { courseId: 40, enrolledIds: new Set<number>(), onClose, onEnrolled: vi.fn() };
    const { rerender } = render(<EnrollAdaptiveStudentsDialog open {...props} />);
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    rerender(<EnrollAdaptiveStudentsDialog open={false} {...props} />);
    rerender(<EnrollAdaptiveStudentsDialog open {...props} />);
    release({ succeeded: 1, skipped: 0, refused: [], failed: [] });
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith("Enrolled 1", "success"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
