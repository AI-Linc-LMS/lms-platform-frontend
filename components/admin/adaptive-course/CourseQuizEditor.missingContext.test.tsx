import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * The course builder's quiz editor sends only complete questions, so the server's "question 2" is
 * the second question SENT. The dialog numbers it as this list shows it, and Save anyway resends
 * with confirm_missing_context.
 */

const h = vi.hoisted(() => ({
  showToast: vi.fn(),
  getDetail: vi.fn(),
  update: vi.fn(),
  onSaved: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | { defaultValue?: string; [k: string]: unknown }) => {
      const template = typeof opts === "string" ? opts : opts?.defaultValue;
      if (!template) return key;
      return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        typeof opts === "object" && opts && k in opts ? String(opts[k]) : "",
      );
    },
  }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: h.showToast }) }));
vi.mock("@/components/admin/adaptive-quiz/MCQReviewTable", () => ({ MCQReviewTable: () => <div>stub-table</div> }));
vi.mock("@/lib/services/admin/admin-adaptive-quiz.service", () => ({
  adminAdaptiveQuizService: { getDetail: h.getDetail, update: h.update, regenerateQuestion: vi.fn() },
}));

import { CourseQuizEditor } from "./CourseQuizEditor";

const base = { option_a: "A", option_b: "B", option_c: "C", option_d: "D", correct_option: "A",
               difficulty_level: "Medium", explanation: "", skills: "", topic: "" };
const MCQS = [
  { ...base, id: 1, question_text: "Which join keeps every row of the left table?" },
  { ...base, id: 2, question_text: "A question still being written", option_d: "" }, // incomplete: not sent
  { ...base, id: 3, question_text: "What does the following code print?" },
];

beforeEach(() => {
  h.showToast.mockReset();
  h.onSaved.mockReset();
  h.getDetail.mockReset().mockResolvedValue({ target_skills: ["joins"], mcqs: MCQS });
  h.update.mockReset();
});

describe("CourseQuizEditor and a question that points at missing context", () => {
  it("numbers the question as the list shows it, and Save anyway resends with the flag", async () => {
    h.update
      .mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            detail: 'Question 2 ("What does the following code print?") seems to refer to ...',
            code: "missing_context",
            questions: [{ index: 1, id: 3, question_text: MCQS[2].question_text, rule: "the-following-block",
                          phrase: "the following code", reason: 'The question says "the following code" but does not include the code.' }],
          },
        },
      })
      .mockResolvedValueOnce({ mcqs: [MCQS[0], MCQS[2]] });
    render(<CourseQuizEditor configId={7} topic="Joins" onSaved={h.onSaved} />);
    fireEvent.click(await screen.findByRole("button", { name: /Save questions/ }));

    const dialog = await screen.findByTestId("missing-context-dialog");
    expect(within(dialog).getByText("Question 3")).toBeInTheDocument();
    expect(within(dialog).getByText("What does the following code print?")).toBeInTheDocument();
    expect(h.showToast).not.toHaveBeenCalledWith(expect.anything(), "error");
    expect(h.update.mock.calls[0][1].mcqs_upsert.map((m: { id: number }) => m.id)).toEqual([1, 3]);

    fireEvent.click(within(dialog).getByRole("button", { name: "Save anyway" }));
    await waitFor(() => expect(h.update).toHaveBeenCalledTimes(2));
    expect(h.update.mock.calls[1][1]).toEqual({ ...h.update.mock.calls[0][1], confirm_missing_context: true });
    await waitFor(() => expect(h.onSaved).toHaveBeenCalledWith(7, 2));
  });
});
