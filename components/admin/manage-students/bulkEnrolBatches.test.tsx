import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * Manage Students -> bulk enrol: batches, the confirmation, and the per-student report.
 *
 * Three things this pins, each of which the old flow got wrong:
 *  - a BATCH is a target, not just a course (there was no way to put a selection in one);
 *  - the admin confirms a sentence naming the count and the targets before anything is written;
 *  - the result is a report, not "37 ok" - already-enrolled and refused learners are named.
 */

const mocks = vi.hoisted(() => ({ showToast: vi.fn(), bulk: vi.fn() }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: { bulkCourseAction: mocks.bulk },
}));

// The REAL strings, so a key that is missing from the locale file fails the test rather than
// rendering "bulkEnrol.somethingOrOther" to an admin.
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
  { id: 9, name: "Lina", email: "lina@x.com" },
] as never[];
const courses = [{ id: 3, title: "React Fundamentals" }];
const batches = [
  { id: 11, name: "Autumn 2026" },
  { id: 12, name: "Spring 2027" },
];

function open(selected = students, extra: Record<string, unknown> = {}) {
  const onDone = vi.fn();
  render(
    <BulkActionToolbar
      selected={selected}
      courses={courses}
      adaptiveCourses={[]}
      batches={batches}
      onClear={vi.fn()}
      onDone={onDone}
      {...extra}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.enrolButton }));
  return { onDone };
}

async function pickBatch(name: string) {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: en.bulkEnrol.batchesLabel }));
  const list = await screen.findByRole("listbox");
  fireEvent.click(within(list).getByRole("option", { name }));
  fireEvent.keyDown(list, { key: "Escape" });
}

beforeEach(() => {
  mocks.showToast.mockReset();
  mocks.bulk.mockReset();
});

describe("bulk enrol into a batch", () => {
  it("confirms the exact count and target before it writes anything", async () => {
    mocks.bulk.mockResolvedValue({ action: "enroll", succeeded: 3, failed: 0, enrolled: 3, results: [] });
    open();
    await pickBatch("Autumn 2026");

    // Step one is a picker: nothing has been sent.
    expect(mocks.bulk).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.continue }));

    const confirm = await screen.findByTestId("bulk-enrol-confirm");
    expect(confirm).toHaveTextContent("3 selected students will be enrolled into the batch Autumn 2026.");
    // Still nothing sent until the admin says yes.
    expect(mocks.bulk).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.enrolAction }));
    await waitFor(() => expect(mocks.bulk).toHaveBeenCalledTimes(1));
    expect(mocks.bulk).toHaveBeenCalledWith("enroll", [7, 8, 9], [], [], { cohortIds: [11] });
  });

  it("sends courses and batches together in one action", async () => {
    mocks.bulk.mockResolvedValue({ action: "enroll", succeeded: 6, failed: 0, enrolled: 6, results: [] });
    open();
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Courses" }));
    const courseList = await screen.findByRole("listbox");
    fireEvent.click(within(courseList).getByRole("option", { name: /React Fundamentals/ }));
    fireEvent.keyDown(courseList, { key: "Escape" });
    await pickBatch("Spring 2027");

    fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.continue }));
    fireEvent.click(await screen.findByRole("button", { name: en.bulkEnrol.enrolAction }));
    await waitFor(() =>
      expect(mocks.bulk).toHaveBeenCalledWith("enroll", [7, 8, 9], [3], [], { cohortIds: [12] })
    );
  });

  it("shows no batch picker at all when the tenant has none", () => {
    render(
      <BulkActionToolbar
        selected={students}
        courses={courses}
        adaptiveCourses={[]}
        batches={[]}
        onClear={vi.fn()}
        onDone={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.enrolButton }));
    expect(screen.queryByRole("combobox", { name: en.bulkEnrol.batchesLabel })).toBeNull();
  });
});

describe("the per-student report", () => {
  const mixed = {
    action: "enroll",
    succeeded: 2,
    failed: 1,
    enrolled: 1,
    already_enrolled: 1,
    refused: 1,
    errors: 0,
    results: [
      { student_id: 7, cohort_id: 11, status: "ok", outcome: "enrolled" },
      { student_id: 8, cohort_id: 11, status: "ok", outcome: "already_enrolled" },
      {
        student_id: 9,
        cohort_id: 11,
        status: "error",
        outcome: "refused",
        code: "student_inactive",
        detail: "This student's account is deactivated. Reactivate them first.",
      },
    ],
  };

  async function run() {
    const { onDone } = open();
    await pickBatch("Autumn 2026");
    fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.continue }));
    fireEvent.click(await screen.findByRole("button", { name: en.bulkEnrol.enrolAction }));
    return { onDone };
  }

  it("names who was enrolled, who already had it, and who was refused and why", async () => {
    mocks.bulk.mockResolvedValue(mixed);
    await run();

    const report = await screen.findByTestId("bulk-enrol-report");
    // A bare "2 ok" would have hidden both of the rows below.
    expect(within(report).getByText("Already in the batch Autumn 2026")).toBeInTheDocument();
    expect(within(report).getByText("Omar")).toBeInTheDocument();
    expect(
      within(report).getByText("This student's account is deactivated. Reactivate them first.")
    ).toBeInTheDocument();
    expect(within(report).getByText("Lina")).toBeInTheDocument();
    expect(within(report).getByText("Enrolled into the batch Autumn 2026")).toBeInTheDocument();
    expect(within(report).getByText("Sara")).toBeInTheDocument();
  });

  it("survives the selection being cleared, which is what onDone does", async () => {
    mocks.bulk.mockResolvedValue(mixed);
    const onDone = vi.fn();
    const toolbar = (selected: never[]) => (
      <BulkActionToolbar
        selected={selected}
        courses={courses}
        adaptiveCourses={[]}
        batches={batches}
        onClear={vi.fn()}
        onDone={onDone}
      />
    );
    const { rerender } = render(toolbar(students));
    fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.enrolButton }));
    await pickBatch("Autumn 2026");
    fireEvent.click(screen.getByRole("button", { name: en.bulkEnrol.continue }));
    fireEvent.click(await screen.findByRole("button", { name: en.bulkEnrol.enrolAction }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());

    // What the page really does on onDone: the selection goes empty, so this toolbar has nothing
    // to render. The report must not go with it - it is the only place the outcome is written.
    rerender(toolbar([] as never[]));
    expect(screen.queryByRole("button", { name: en.bulkEnrol.enrolButton })).toBeNull();
    expect(screen.getByTestId("bulk-enrol-report")).toBeInTheDocument();
    expect(screen.getByText("Lina")).toBeInTheDocument();
  });
});

describe("the size ceiling", () => {
  const many = Array.from({ length: 501 }, (_, i) => ({
    id: i + 1,
    name: `S${i}`,
    email: `s${i}@x.com`,
  })) as never[];

  it("refuses before sending, and says how many were selected", async () => {
    open(many);
    await pickBatch("Autumn 2026");
    const notice = screen.getByTestId("bulk-over-cap");
    expect(notice).toHaveTextContent("501 students");
    expect(notice).toHaveTextContent("500 students and 500");
    expect(screen.getByRole("button", { name: en.bulkEnrol.continue })).toBeDisabled();
    expect(mocks.bulk).not.toHaveBeenCalled();
  });

  it("counts PAIRS, not just students", async () => {
    const threeHundred = Array.from({ length: 300 }, (_, i) => ({
      id: i + 1,
      name: `S${i}`,
      email: `s${i}@x.com`,
    })) as never[];
    open(threeHundred);
    await pickBatch("Autumn 2026");
    expect(screen.queryByTestId("bulk-over-cap")).toBeNull();
    await pickBatch("Spring 2027");
    expect(screen.getByTestId("bulk-over-cap")).toHaveTextContent("600");
  });
});
