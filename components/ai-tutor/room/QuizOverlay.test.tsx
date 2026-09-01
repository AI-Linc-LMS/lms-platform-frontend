// @vitest-environment jsdom
/**
 * "After answering a quiz question, the quiz does not close and the tutor continues asking
 *  multiple questions one after another."
 *
 * The overlay always had a manual exit - the CTA becomes "Back to the lesson" once graded - but
 * nothing ever dismissed it. An abandoned overlay sits on screen while the tutor talks past it,
 * and it costs money: the room suspends the idle watchdog for as long as it is up, so the cost
 * guard is disabled and the session runs to its server deadline with nothing refunded.
 *
 * The dwell has to be unhurried, though. Closing the instant the grade lands takes away the
 * explanation and the tutor's spoken reaction, which is the thing this dialog exists to show.
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuizOverlay } from "./QuizOverlay";
import type { PooledQuestion, QuizGradeResult } from "@/lib/services/ai-tutor.service";

const QUESTION: PooledQuestion = {
  id: 1,
  question: "What does range(3) produce?",
  image: "",
  image_alt: "",
  options: [
    { id: "a", label: "0, 1, 2" },
    { id: "b", label: "1, 2, 3" },
  ],
  style: "single",
  difficulty: "medium",
  topic: "loops",
};

const GRADED: QuizGradeResult = {
  ok: true,
  is_correct: true,
  correct: ["a"],
  selected: ["a"],
  explanation: "Right - it stops before 3.",
};

function setup(props: Partial<React.ComponentProps<typeof QuizOverlay>> = {}) {
  const onClose = vi.fn();
  const onAnswer = vi.fn(async () => GRADED);
  const view = render(
    <QuizOverlay question={QUESTION} onAnswer={onAnswer} onClose={onClose} {...props} />,
  );
  return { onClose, onAnswer, view };
}

/** Answer the question and let the grade land. */
async function answer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("0, 1, 2"));
  await user.click(screen.getByText("Check my answer"));
}

describe("the graded quiz leaves on its own", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("stays put while the tutor is still reacting to the answer", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose, view } = setup({ tutorTurnId: 0 });
    await answer(user);

    // The tutor starts talking about this answer.
    view.rerender(
      <QuizOverlay
        question={QUESTION}
        onAnswer={vi.fn(async () => GRADED)}
        onClose={onClose}
        tutorTurnId={1}
        tutorSpeaking
      />,
    );
    await act(async () => await vi.advanceTimersByTimeAsync(5000));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes shortly after the tutor finishes reacting", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose, view } = setup({ tutorTurnId: 0 });
    await answer(user);

    view.rerender(
      <QuizOverlay
        question={QUESTION}
        onAnswer={vi.fn(async () => GRADED)}
        onClose={onClose}
        tutorTurnId={1}
        tutorSpeaking={false}
      />,
    );
    await act(async () => await vi.advanceTimersByTimeAsync(2500));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("closes on the backstop even if the tutor never says a word", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onClose } = setup({ tutorTurnId: 0 });
    await answer(user);

    await act(async () => await vi.advanceTimersByTimeAsync(4000));
    expect(onClose).not.toHaveBeenCalled(); // no reaction yet, so it waits

    await act(async () => await vi.advanceTimersByTimeAsync(12000));
    // onClose rides on the dialog's exit transition, not on close() itself.
    await act(async () => await vi.advanceTimersByTimeAsync(600));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("never auto-closes when grading FAILED - that needs a deliberate retry", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onClose = vi.fn();
    render(
      <QuizOverlay
        question={QUESTION}
        onAnswer={vi.fn(async () => null)}
        onClose={onClose}
        tutorTurnId={0}
      />,
    );
    await answer(user);
    await act(async () => await vi.advanceTimersByTimeAsync(30000));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close an UNANSWERED question out from under the learner", async () => {
    const { onClose } = setup();
    await act(async () => await vi.advanceTimersByTimeAsync(30000));
    expect(onClose).not.toHaveBeenCalled();
  });
});
