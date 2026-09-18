import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionPalette, countStatuses, statusOf, submitWarning } from "./QuestionPalette";

/**
 * The calibration question navigator.
 *
 * Requested as "a question navigation panel on the right side ... show all questions in boxes so we
 * can navigate between them", modelled on the prep platform's exam palette. Five states, a legend
 * with counts, and a jump to any question.
 */

describe("a question's state", () => {
  it("is not visited until the learner opens it", () => {
    expect(statusOf(false, false, false)).toBe("notVisited");
  });

  it("is not answered once opened and left without a choice", () => {
    expect(statusOf(false, true, false)).toBe("notAnswered");
  });

  it("is answered once a choice is made", () => {
    expect(statusOf(true, true, false)).toBe("answered");
  });

  it("is marked for review when flagged without an answer", () => {
    expect(statusOf(false, true, true)).toBe("marked");
  });

  it("is answered and marked when both", () => {
    expect(statusOf(true, true, true)).toBe("answeredMarked");
  });

  it("counts as answered even if the learner never 'visited' it on this device", () => {
    // Answers restore from the server on resume; the visited set lives in this browser. A restored
    // answer must still read as answered on a different laptop.
    expect(statusOf(true, false, false)).toBe("answered");
  });
});

describe("the warning before submitting", () => {
  it("is silent when every question is answered and nothing is flagged", () => {
    expect(submitWarning(countStatuses(["answered", "answered"]))).toBeNull();
  });

  it("counts unvisited, skipped and marked-but-unanswered questions as unanswered", () => {
    expect(submitWarning(countStatuses(["notVisited", "notAnswered", "marked", "answered"])))
      .toBe("3 questions unanswered and 1 marked for review");
  });

  it("still warns about a question answered but flagged to come back to", () => {
    // Submitting is the last chance to revisit it.
    expect(submitWarning(countStatuses(["answeredMarked", "answered"]))).toBe("1 marked for review");
  });

  it("uses the singular for one", () => {
    expect(submitWarning(countStatuses(["notVisited", "answered"]))).toBe("1 question unanswered");
  });
});

describe("the palette", () => {
  const statuses = ["answered", "notAnswered", "notVisited", "marked", "answeredMarked"] as const;

  it("shows one numbered box per question", () => {
    render(<QuestionPalette statuses={[...statuses]} current={0} onJump={vi.fn()} />);
    for (let n = 1; n <= 5; n += 1) {
      expect(screen.getByRole("button", { name: new RegExp(`^Question ${n} - `) })).toBeInTheDocument();
    }
  });

  it("jumps to a question when its box is clicked", () => {
    const onJump = vi.fn();
    render(<QuestionPalette statuses={[...statuses]} current={0} onJump={onJump} />);
    fireEvent.click(screen.getByRole("button", { name: /^Question 4 - / }));
    expect(onJump).toHaveBeenCalledWith(3);
  });

  it("names each box's state for a screen reader, and marks the current one", () => {
    render(<QuestionPalette statuses={[...statuses]} current={1} onJump={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Question 2 - Not answered (current)" }))
      .toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Question 5 - Answered & marked" })).toBeInTheDocument();
  });

  it("counts answered questions, including answered-and-marked", () => {
    render(<QuestionPalette statuses={[...statuses]} current={0} onJump={vi.fn()} />);
    expect(screen.getByText("2 / 5 answered")).toBeInTheDocument();
  });
});
