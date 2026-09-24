/**
 * Removing an application question from the job form.
 *
 * "Add question" always CREATES a bank row - it never reuses one - so a tenant's shared bank
 * collects duplicates (production: the same text twice for client 5), and until now there was no
 * way to take one out. These tests pin the row affordance, the confirmation that states what will
 * happen, and the one rule that is easy to get wrong: the "N selected" chip and the list it opens
 * must move together, and removing a row must not change any OTHER row's selection.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobsScope } from "@/components/jobs-v2/ui";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { JobForm } from "./form/JobForm";

const BANK = [
  {
    id: 10,
    question_text: "What is your expected salary?",
    question_type: "text",
    is_required: false,
    order: 0,
    options: [],
  },
  {
    id: 11,
    question_text: "Why do you think you are a good fit for this role?",
    question_type: "textarea",
    is_required: false,
    order: 1,
    options: [],
  },
  // The duplicate from the report: same text, second row, created by a second "Add question".
  {
    id: 12,
    question_text: "Why do you think you are a good fit for this role?",
    question_type: "textarea",
    is_required: true,
    order: 2,
    options: [],
  },
];

const getQuestions = vi.fn();
const getQuestionUsage = vi.fn();
const removeQuestion = vi.fn();
const createQuestion = vi.fn();

vi.mock("@/lib/services/admin/admin-jobs-v2.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    adminJobsV2Service: {
      getQuestions: (...args: unknown[]) => getQuestions(...args),
      getQuestionUsage: (...args: unknown[]) => getQuestionUsage(...args),
      removeQuestion: (...args: unknown[]) => removeQuestion(...args),
      createQuestion: (...args: unknown[]) => createQuestion(...args),
    },
  };
});

vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: vi.fn().mockResolvedValue({ students: [], pagination: {} }),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "7" }),
  usePathname: () => "/admin/jobs-v2/7/edit",
  useSearchParams: () => new URLSearchParams(),
}));

const noop = () => undefined;

if (!("scrollIntoView" in Element.prototype)) {
  (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = noop;
}

const editedJob = (over: Partial<JobV2> = {}): JobV2 =>
  ({
    id: 7,
    job_title: "Backend Engineer",
    company_name: "Acme",
    status: "active",
    is_published: false,
    created_at: "2026-01-05T10:00:00Z",
    // Two of the three bank rows are on the job: the salary question and the SECOND copy of the
    // duplicate, exactly as the report's screenshot shows.
    question_ids: [10, 12],
    ...over,
  }) as JobV2;

function mountForm(job: JobV2 = editedJob()) {
  return render(
    <JobsScope surface="admin" theme="light">
      <JobForm
        mode="edit"
        initialKey={`job:${job.id}`}
        initialData={job}
        draftId={`qdel-${Math.random()}`}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={noop}
        saveLabel="Save job"
      />
    </JobsScope>,
  );
}

/** Walk to the last step, where the Application questions card lives. */
async function openAudienceStep(user: ReturnType<typeof userEvent.setup>) {
  const nav = await screen.findByRole("navigation", { name: /job form steps/i });
  const steps = within(nav).getAllByRole("button");
  await user.click(steps[steps.length - 1]);
  return screen.findByRole("checkbox", { name: /expected salary/i });
}

/**
 * The two identically-worded rows in DOM order. The card pins SELECTED questions to the top, so
 * the list reads 10, 12, 11 - the first "good fit" button is the selected duplicate (12) and the
 * second is the unselected one (11).
 */
const removeButtons = () => screen.getAllByRole("button", { name: /Remove .*good fit/i });

const selectedCount = () =>
  screen.getAllByRole("checkbox").filter((el) => el.getAttribute("aria-checked") === "true").length;

beforeEach(() => {
  vi.clearAllMocks();
  getQuestions.mockResolvedValue(BANK.map((q) => ({ ...q })));
  getQuestionUsage.mockResolvedValue({
    id: 12,
    question_text: BANK[2].question_text,
    archived: false,
    on_this_job: true,
    other_jobs: 2,
    answers: 3,
    applications: 3,
  });
  removeQuestion.mockResolvedValue({ id: 12, archived: true });
});

describe("removing an application question", () => {
  it("gives every question row its own remove control, named for the question", async () => {
    const user = userEvent.setup();
    mountForm();
    await openAudienceStep(user);
    // One per row, and each carries the question text, so a screen reader user knows which
    // of two identically-worded rows they are about to remove.
    expect(screen.getAllByRole("button", { name: /^Remove /i })).toHaveLength(BANK.length);
    expect(
      screen.getAllByRole("button", { name: /Remove .*good fit for this role/i }),
    ).toHaveLength(2);
    // Selected rows are PINNED to the top, so the two duplicates are NOT adjacent in bank
    // order: the list reads 10 (selected), 12 (selected), 11. `removeButtons()` encodes that.
  });

  it("asks the server what the removal would touch, and says so before committing", async () => {
    const user = userEvent.setup();
    mountForm();
    await openAudienceStep(user);
    await user.click(removeButtons()[0]);

    // The counts come from the server, scoped to the job being edited - never guessed.
    await waitFor(() => expect(getQuestionUsage).toHaveBeenCalledWith(12, 7));
    expect(await screen.findByText(/2 other job\(s\) keep asking it/i)).toBeTruthy();
    expect(screen.getByText(/3 answer\(s\) from 3 application\(s\) are kept/i)).toBeTruthy();
    // Nothing is written until the confirm is pressed.
    expect(removeQuestion).not.toHaveBeenCalled();
  });

  it("drops the row and the selection together when it was selected", async () => {
    const user = userEvent.setup();
    mountForm();
    await openAudienceStep(user);
    expect(selectedCount()).toBe(2);

    await user.click(removeButtons()[0]);
    await screen.findByText(/2 other job\(s\) keep asking it/i);
    await user.click(screen.getByRole("button", { name: /^Remove question$/i }));

    await waitFor(() => expect(removeQuestion).toHaveBeenCalledWith(12, 7));
    // The list loses exactly one row...
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox", { name: /good fit for this role/i })).toHaveLength(1),
    );
    // ...and the count agrees with it. The salary question is untouched.
    expect(selectedCount()).toBe(1);
    expect(
      screen.getByRole("checkbox", { name: /expected salary/i }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("does not SELECT a question on the way out when it was not selected", async () => {
    // The trap: reusing `toggleQuestion` to clean up would have added the unselected duplicate
    // to the job as it was being removed, and the chip would have counted a row that is gone.
    const user = userEvent.setup();
    getQuestionUsage.mockResolvedValue({
      id: 11,
      question_text: BANK[1].question_text,
      archived: false,
      on_this_job: false,
      other_jobs: 0,
      answers: 0,
      applications: 0,
    });
    removeQuestion.mockResolvedValue({ id: 11, archived: true });
    mountForm();
    await openAudienceStep(user);
    expect(selectedCount()).toBe(2);

    await user.click(removeButtons()[1]);
    expect(await screen.findByText(/Nobody has answered it/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Remove question$/i }));

    await waitFor(() => expect(removeQuestion).toHaveBeenCalledWith(11, 7));
    await waitFor(() =>
      expect(screen.getAllByRole("checkbox", { name: /good fit for this role/i })).toHaveLength(1),
    );
    expect(selectedCount()).toBe(2);
  });

  it("asks the bank for the job being edited, so a retired-but-still-asked row still lists", async () => {
    const user = userEvent.setup();
    mountForm();
    await openAudienceStep(user);
    expect(getQuestions).toHaveBeenCalledWith(undefined, 7);
  });

  it("leaves everything alone when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    mountForm();
    await openAudienceStep(user);
    await user.click(removeButtons()[0]);
    await screen.findByText(/2 other job\(s\) keep asking it/i);
    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /^Remove question$/i })).toBeNull(),
    );

    expect(removeQuestion).not.toHaveBeenCalled();
    expect(screen.getAllByRole("checkbox", { name: /good fit for this role/i })).toHaveLength(2);
    expect(selectedCount()).toBe(2);
  });
});

describe("the duplicate that made removal necessary", () => {
  it("warns when the typed question is already word-for-word in the bank", async () => {
    const user = userEvent.setup();
    mountForm();
    await openAudienceStep(user);
    await user.click(screen.getByRole("button", { name: /add question/i }));

    const field = await screen.findByLabelText(/^Question/i);
    await user.type(field, "  Why do you think you are a good fit for this role?  ");
    expect(await screen.findByText(/already has a question with this exact wording/i)).toBeTruthy();
  });

  it("stays quiet for wording that is genuinely new", async () => {
    const user = userEvent.setup();
    mountForm();
    await openAudienceStep(user);
    await user.click(screen.getByRole("button", { name: /add question/i }));

    const field = await screen.findByLabelText(/^Question/i);
    await user.type(field, "When can you start?");
    expect(screen.queryByText(/already has a question with this exact wording/i)).toBeNull();
  });
});
