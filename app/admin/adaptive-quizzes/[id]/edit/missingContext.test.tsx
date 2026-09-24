import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * The quiz editor: a save that the server refuses because a new or reworded question points at a
 * figure, table or code it does not include shows those questions; Save anyway resends the same
 * diff with confirm_missing_context.
 */

const h = vi.hoisted(() => ({
  showToast: vi.fn(),
  getDetail: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
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
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/adaptive-quiz/shared/AdaptiveSectionShell", () => ({
  AdaptiveSectionShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/adaptive-quiz/shared/AdaptiveSectionHero", () => ({
  AdaptiveSectionHero: ({ rightSlot }: { rightSlot?: ReactNode }) => <div>{rightSlot}</div>,
}));
vi.mock("@/components/admin/adaptive-quiz/MCQReviewTable", () => ({ MCQReviewTable: () => <div>stub-table</div> }));
vi.mock("@/lib/services/admin/admin-adaptive-quiz.service", () => ({
  adminAdaptiveQuizService: { getDetail: h.getDetail, update: h.update },
}));

import EditAdaptiveQuizPage from "./page";

const MCQS = [
  { id: 1, question_text: "Which join keeps every row of the left table?", option_a: "LEFT", option_b: "INNER",
    option_c: "CROSS", option_d: "NATURAL", correct_option: "A", difficulty_level: "Medium", explanation: "", skills: "", topic: "" },
  { id: 2, question_text: "Which rows does this dataset keep?", option_a: "All", option_b: "None", option_c: "Some",
    option_d: "Half", correct_option: "A", difficulty_level: "Medium", explanation: "", skills: "", topic: "" },
];
const DETAIL = {
  config_id: 7, title: "Joins", target_skills: ["joins"], mcq_count: 2, min_questions: 2, max_questions: 2,
  se_threshold: 0.35, hint_tokens: 2, confidence_prompt_enabled: true, is_active: true, updated_at: "",
  instructions: "", mcqs: MCQS,
};
const REFUSAL = {
  response: {
    status: 400,
    data: {
      detail: 'Question 2 ("Which rows does this dataset keep?") seems to refer to a figure, table or code it doesn\'t include, so learners can\'t answer it.',
      code: "missing_context",
      questions: [{ index: 1, id: 2, question_text: MCQS[1].question_text, rule: "demonstrative-block",
                    phrase: "this dataset", reason: 'The question says "this dataset" but does not include the data.' }],
    },
  },
};

beforeEach(() => {
  h.showToast.mockReset();
  h.getDetail.mockReset().mockResolvedValue(DETAIL);
  h.update.mockReset();
});

describe("Saving a quiz whose edited question points at missing context", () => {
  it("asks, and Save anyway resends the same diff with confirm_missing_context", async () => {
    h.update.mockRejectedValueOnce(REFUSAL).mockResolvedValueOnce(DETAIL);
    render(<EditAdaptiveQuizPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Save changes" }));

    const dialog = await screen.findByTestId("missing-context-dialog");
    expect(within(dialog).getByText("Question 2")).toBeInTheDocument();
    expect(within(dialog).getByText("Which rows does this dataset keep?")).toBeInTheDocument();
    expect(h.showToast).not.toHaveBeenCalledWith(expect.anything(), "error");

    fireEvent.click(within(dialog).getByRole("button", { name: "Save anyway" }));
    await waitFor(() => expect(h.update).toHaveBeenCalledTimes(2));
    const [first, second] = h.update.mock.calls;
    expect(first[1]).not.toHaveProperty("confirm_missing_context");
    expect(second[0]).toBe(7);
    expect(second[1]).toEqual({ ...first[1], confirm_missing_context: true });
    await waitFor(() => expect(h.showToast).toHaveBeenCalledWith("Saved.", "success"));
  });

  it("Go back and fix closes the dialog without saving", async () => {
    h.update.mockRejectedValueOnce(REFUSAL);
    render(<EditAdaptiveQuizPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Save changes" }));
    const dialog = await screen.findByTestId("missing-context-dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Go back and fix" }));
    await waitFor(() => expect(screen.queryByTestId("missing-context-dialog")).not.toBeInTheDocument());
    expect(h.update).toHaveBeenCalledTimes(1);
  });

  it("any other refusal shows the server's words, not Axios's", async () => {
    h.update.mockRejectedValueOnce({
      message: "Request failed with status code 400",
      response: { status: 400, data: { detail: "min_questions cannot exceed max_questions." } },
    });
    render(<EditAdaptiveQuizPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(h.showToast).toHaveBeenCalledWith("min_questions cannot exceed max_questions.", "error"));
  });
});
