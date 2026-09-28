// @vitest-environment jsdom
/**
 * "When the coding IDE is open and the candidate asks the AI for clarification, the AI does not
 *  provide any response."
 *
 * The AI was not refusing - it could not hear them. The room force-muted the microphone for as
 * long as a structured question's modal was up:
 *
 *     setMicMuted(structuredOpen ? true : muted);
 *
 * and the modal covers the room's own mic button, so there was no way to turn it back on. A
 * candidate spoke, nothing reached the model, and it looked like silence.
 *
 * The mute itself is worth keeping - its comment says why, and it is right: thinking aloud over
 * an editor should not be transcribed as the answer to a question nobody asked. So the default
 * stays muted. What is pinned here is that the candidate can deliberately turn the mic on from
 * inside the modal, and that the control tells the truth about which state it is in.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

import { CodingQuestionModal } from "./CodingQuestionModal";

const problem = {
  title: "Two Sum",
  description: "Find two numbers that add to the target.",
  language: "python",
  starter_code: "def solve():\n    pass\n",
} as never;

describe("asking the interviewer during a coding question", () => {
  it("offers a way to be heard, and says the mic is off", () => {
    render(
      <CodingQuestionModal
        open
        problem={problem}
        micMuted
        onToggleMic={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    const btn = screen.getByTestId("coding-ask-mic");
    expect(btn).toHaveTextContent(/ask a question/i);
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("turning it on is a deliberate act, reported to the room", async () => {
    const onToggleMic = vi.fn();
    render(
      <CodingQuestionModal
        open
        problem={problem}
        micMuted
        onToggleMic={onToggleMic}
        onSubmit={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId("coding-ask-mic"));
    expect(onToggleMic).toHaveBeenCalledTimes(1);
  });

  it("says it is listening once the mic is live", () => {
    render(
      <CodingQuestionModal
        open
        problem={problem}
        micMuted={false}
        onToggleMic={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    const btn = screen.getByTestId("coding-ask-mic");
    expect(btn).toHaveTextContent(/listening/i);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders no mic control at all when the room does not pass one", () => {
    // The modal is reused by admin review, which has no microphone and no room behind it.
    render(<CodingQuestionModal open problem={problem} onSubmit={vi.fn()} />);
    expect(screen.queryByTestId("coding-ask-mic")).toBeNull();
  });
});
