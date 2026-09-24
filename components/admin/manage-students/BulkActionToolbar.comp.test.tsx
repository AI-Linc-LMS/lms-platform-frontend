import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * Manage Students -> bulk enrol into a PAID adaptive course.
 *
 * The API always accepted comp_paid; no screen ever sent it, so a paid course came back as
 * "0 ok, 1 failed" with no reason. The prompt has to be answered BEFORE onDone: onDone clears the
 * selection, and this toolbar renders nothing without one.
 */

const mocks = vi.hoisted(() => ({ showToast: vi.fn(), bulk: vi.fn() }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: { bulkCourseAction: mocks.bulk },
}));

// The real strings, so a renamed button in the locale file shows up here rather than in prod.
import en from "@/locales/en/common.json";
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      const value = key
        .split(".")
        .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], en);
      if (typeof value !== "string") return key;
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars?.[k] ?? ""));
    },
  }),
}));

import { BulkActionToolbar } from "./BulkActionToolbar";

const students = [
  { id: 7, name: "Sara", email: "sara@x.com" },
  { id: 8, name: "Omar", email: "omar@x.com" },
] as never[];
const adaptiveCourses = [
  { id: 40, title: "Data Science" },
  { id: 41, title: "Intro" },
];

async function enrollBoth() {
  const onDone = vi.fn();
  render(<BulkActionToolbar selected={students} courses={[]} adaptiveCourses={adaptiveCourses} onClear={vi.fn()} onDone={onDone} />);
  fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.enrolButton }));
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Adaptive courses" }));
  const list = await screen.findByRole("listbox");
  fireEvent.click(within(list).getByRole("option", { name: /Data Science/ }));
  fireEvent.click(within(list).getByRole("option", { name: /Intro/ }));
  fireEvent.keyDown(list, { key: "Escape" });
  // Two steps now: pick the targets, then confirm the sentence that names them.
  fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.continue }));
  fireEvent.click(await screen.findByRole("button", { name: en.bulkEnrol.enrolAction }));
  return { onDone };
}

const firstPass = {
  action: "enroll", succeeded: 2, failed: 2,
  results: [
    { student_id: 7, adaptive_course_id: 40, status: "error", code: "paid_course_requires_comp", detail: "paid" },
    { student_id: 8, adaptive_course_id: 40, status: "error", code: "paid_course_requires_comp", detail: "paid" },
    { student_id: 7, adaptive_course_id: 41, status: "ok" },
    { student_id: 8, adaptive_course_id: 41, status: "ok" },
  ],
};

beforeEach(() => {
  mocks.showToast.mockReset();
  mocks.bulk.mockReset();
});

describe("BulkActionToolbar on a paid adaptive course", () => {
  it("asks before refreshing, then comps only the refused learners and course", async () => {
    mocks.bulk.mockResolvedValueOnce(firstPass).mockResolvedValueOnce({ action: "enroll", succeeded: 2, failed: 0, results: [] });
    const { onDone } = await enrollBoth();

    const prompt = await screen.findByRole("dialog", { name: "Give a paid course for free?" });
    expect(within(prompt).getByText("Data Science")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(mocks.bulk).toHaveBeenLastCalledWith("enroll", [7, 8], [], [40, 41], { cohortIds: [] });

    fireEvent.click(within(prompt).getByRole("button", { name: "Give free access" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(mocks.bulk).toHaveBeenLastCalledWith("enroll", [7, 8], [], [40], { compPaid: true });
    expect(mocks.showToast).toHaveBeenLastCalledWith("Enrolled 4 (2 free of charge)", "success");
  });

  it("gives nothing away when the admin declines, and still refreshes", async () => {
    mocks.bulk.mockResolvedValueOnce(firstPass);
    const { onDone } = await enrollBoth();
    const prompt = await screen.findByRole("dialog", { name: "Give a paid course for free?" });
    fireEvent.click(within(prompt).getByRole("button", { name: "Don't give it" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(mocks.bulk).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).toHaveBeenLastCalledWith(expect.stringMatching(/^Enrolled 2\. The paid course was not given/), "info");
  });

  it("goes straight to the report when nothing was refused for being paid", async () => {
    mocks.bulk.mockResolvedValueOnce({
      action: "enroll", succeeded: 4, failed: 0, enrolled: 4, already_enrolled: 0, refused: 0,
      results: [
        { student_id: 7, adaptive_course_id: 41, status: "ok", outcome: "enrolled" },
        { student_id: 8, adaptive_course_id: 41, status: "ok", outcome: "enrolled" },
      ],
    });
    const { onDone } = await enrollBoth();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog", { name: "Give a paid course for free?" })).toBeNull();
    expect(await screen.findByTestId("bulk-enrol-report")).toBeInTheDocument();
  });

  it("comps only the pairs that were refused, one request per course", async () => {
    // Learner 7 bought Intro but not Data Science; learner 8 bought Data Science but not Intro.
    const crossed = {
      action: "enroll", succeeded: 2, failed: 3,
      results: [
        { student_id: 7, adaptive_course_id: 40, status: "error", code: "paid_course_requires_comp", detail: "paid" },
        { student_id: 8, adaptive_course_id: 41, status: "error", code: "paid_course_requires_comp", detail: "paid" },
        { student_id: 7, adaptive_course_id: 41, status: "ok" },
        { student_id: 8, adaptive_course_id: 40, status: "ok" },
        { student_id: 8, course_id: 3, status: "error", detail: "You cannot manage this course." },
      ],
    };
    mocks.bulk
      .mockResolvedValueOnce(crossed)
      .mockResolvedValueOnce({ action: "enroll", succeeded: 1, failed: 0, results: [] })
      .mockResolvedValueOnce({ action: "enroll", succeeded: 1, failed: 0, results: [] });
    const { onDone } = await enrollBoth();
    const prompt = await screen.findByRole("dialog", { name: "Give a paid course for free?" });
    fireEvent.click(within(prompt).getByRole("button", { name: "Give free access" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(mocks.bulk).toHaveBeenCalledWith("enroll", [7], [], [40], { compPaid: true });
    expect(mocks.bulk).toHaveBeenCalledWith("enroll", [8], [], [41], { compPaid: true });
    expect(mocks.bulk).toHaveBeenCalledTimes(3);
    // 2 first-pass + 2 comps; the unrelated legacy-course failure is still reported.
    expect(mocks.showToast).toHaveBeenLastCalledWith("Enrolled 4 (2 free of charge), 1 failed", "warning");
  });
});
