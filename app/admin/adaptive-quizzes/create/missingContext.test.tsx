import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * The wizard's Publish used to fail with "Request failed with status code 400" when a question
 * pointed at a figure, table or code it did not include. It now names the questions and lets the
 * author go back to Review, or save anyway (the same request with confirm_missing_context).
 */

const h = vi.hoisted(() => ({
  push: vi.fn(),
  showToast: vi.fn(),
  finalize: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
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
vi.mock("./_components/Step1Configure", () => ({ Step1Configure: () => <div>stub-configure</div> }));
vi.mock("./_components/Step2Generate", () => ({ Step2Generate: () => <div>stub-generate</div> }));
vi.mock("./_components/Step3Review", () => ({ Step3Review: () => <div>stub-review</div> }));
vi.mock("./_components/Step4Publish", () => ({ Step4Publish: () => <div>stub-publish</div> }));
vi.mock("@/lib/services/admin/admin-adaptive-quiz.service", () => ({
  adminAdaptiveQuizService: { finalize: h.finalize },
}));

const FINE = {
  question_text: "Which join keeps every row of the left table?",
  option_a: "LEFT", option_b: "INNER", option_c: "CROSS", option_d: "NATURAL",
  correct_option: "A" as const, difficulty_level: "Medium" as const,
};
const MISSING = { ...FINE, question_text: "How many rows does an INNER JOIN of customers to orders return here?" };

// A draft that has been through Configure and Generate, so Next is enabled on every step.
vi.mock("@/lib/stores/adaptive-quiz-draft", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stores/adaptive-quiz-draft")>();
  return {
    ...actual,
    emptyDraft: () => ({
      ...actual.emptyDraft(),
      title: "Joins",
      topic: "SQL joins",
      sub_skills: ["inner join"],
      matrix: { "inner join": { Easy: 1, Medium: 1, Hard: 0 } },
      mcqs: [FINE, MISSING],
    }),
  };
});

import CreateAdaptiveQuizPage from "./page";

const REFUSAL = {
  message: "Request failed with status code 400",
  response: {
    status: 400,
    data: {
      detail: 'Question 2 ("How many rows does an INNER JOIN of customers to orders ret…") seems to refer to a figure, table or code it doesn\'t include, so learners can\'t answer it.',
      code: "missing_context",
      questions: [{
        index: 1, id: null, question_text: MISSING.question_text, rule: "here-without-scenario",
        phrase: "JOIN of customers to orders return here",
        reason: 'The question says "JOIN of customers to orders return here" but does not include what it refers to.',
      }],
    },
  },
};

function toPublishStep() {
  render(<CreateAdaptiveQuizPage />);
  for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole("button", { name: "Next →" }));
  expect(screen.getByText("stub-publish")).toBeInTheDocument();
}

beforeEach(() => {
  h.push.mockReset();
  h.showToast.mockReset();
  h.finalize.mockReset();
});

describe("Publishing a quiz with a question that points at missing context", () => {
  it("shows the question and its reason instead of an error, and Save anyway resends with the flag", async () => {
    h.finalize.mockRejectedValueOnce(REFUSAL).mockResolvedValueOnce({ config_id: 9 });
    toPublishStep();
    fireEvent.click(screen.getByRole("button", { name: "Publish ✓" }));

    const dialog = await screen.findByTestId("missing-context-dialog");
    expect(within(dialog).getByText("Question 2")).toBeInTheDocument();
    expect(within(dialog).getByText(MISSING.question_text)).toBeInTheDocument();
    expect(within(dialog).getByText(/does not include what it refers to/)).toBeInTheDocument();
    expect(h.showToast).not.toHaveBeenCalledWith(expect.anything(), "error");
    expect(h.finalize.mock.calls[0][0]).not.toHaveProperty("confirm_missing_context");

    fireEvent.click(within(dialog).getByRole("button", { name: "Save anyway" }));
    await waitFor(() => expect(h.finalize).toHaveBeenCalledTimes(2));
    expect(h.finalize.mock.calls[1][0]).toMatchObject({ title: "Joins", confirm_missing_context: true, mcqs: [FINE, MISSING] });
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/admin/adaptive-quizzes"));
  });

  it("Go back and fix returns to Review and sends nothing", async () => {
    h.finalize.mockRejectedValueOnce(REFUSAL);
    toPublishStep();
    fireEvent.click(screen.getByRole("button", { name: "Publish ✓" }));
    const dialog = await screen.findByTestId("missing-context-dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Go back and fix" }));
    await waitFor(() => expect(screen.queryByTestId("missing-context-dialog")).not.toBeInTheDocument());
    expect(screen.getByText("stub-review")).toBeInTheDocument();
    expect(h.finalize).toHaveBeenCalledTimes(1);
    expect(h.push).not.toHaveBeenCalled();
  });

  it("any other refusal shows the server's words, not Axios's", async () => {
    h.finalize.mockRejectedValueOnce({
      message: "Request failed with status code 400",
      response: { status: 400, data: { detail: "min_questions cannot exceed max_questions." } },
    });
    toPublishStep();
    fireEvent.click(screen.getByRole("button", { name: "Publish ✓" }));
    await waitFor(() => expect(h.showToast).toHaveBeenCalledWith("min_questions cannot exceed max_questions.", "error"));
    expect(screen.queryByTestId("missing-context-dialog")).not.toBeInTheDocument();
  });
});
