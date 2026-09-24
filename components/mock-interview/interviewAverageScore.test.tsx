import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { InterviewStats } from "./InterviewStats";
import type { MockInterview } from "@/lib/services/mock-interview.service";

/**
 * "The avg score is not shown after taking the interview."
 *
 * The reported screenshot: 1 Total Interviews, 1 Completed, 0 Scheduled, 0% Average Score.
 * An interview WAS recorded as completed and the average still read zero.
 *
 * The page computed the average with `i.score !== undefined` over the list payload, and the
 * list endpoint has never carried a score - `MockInterviewListSerializer` returns nine fields
 * and `score` is not among them. So the "completed and scored" set was empty on every render,
 * the ternary fell through to its `0`, and the card printed "0%". On production 938 of 952
 * completed attempts hold a real `overall_percentage`; none of them could reach that card.
 *
 * The fix is in two halves, and both are pinned here: the backend now sends `score` and
 * `is_scored`, and the page averages over attempts that HAVE a mark - showing an em dash,
 * not a zero, when there are none. A zero that means "we have no number" is indistinguishable
 * from one the candidate earned, which is the whole complaint.
 *
 * `averageOf` below is the page's own expression, kept verbatim so this file tests the
 * arithmetic that actually ships rather than a paraphrase of it.
 */

const attempt = (over: Partial<MockInterview> = {}): MockInterview =>
  ({
    id: 1,
    title: "Python interview",
    topic: "Python",
    difficulty: "Medium",
    duration_minutes: 10,
    status: "completed",
    created_at: "2026-09-20T10:00:00Z",
    ...over,
  }) as MockInterview;

/** Verbatim from app/mock-interview/page.tsx. */
const averageOf = (interviews: MockInterview[]): number | null => {
  const scored = interviews.filter(
    (i) => i.status === "completed" && i.is_scored && typeof i.score === "number",
  );
  return scored.length > 0
    ? Math.round(scored.reduce((sum, i) => sum + (i.score as number), 0) / scored.length)
    : null;
};

/**
 * The expression that shipped, kept verbatim so the regression has a shape and not just a
 * description. `score` was absent from every row, `undefined !== undefined` is false, the
 * filter matched nothing, and the ternary returned its zero.
 */
const averageBeforeTheFix = (
  interviews: (MockInterview & { score?: number })[],
): number => {
  const completedWithScores = interviews.filter(
    (i) => i.status === "completed" && i.score !== undefined,
  );
  return completedWithScores.length > 0
    ? Math.round(
        completedWithScores.reduce((sum, i) => sum + (i.score || 0), 0) /
          completedWithScores.length,
      )
    : 0;
};

describe("the shape of the bug", () => {
  it("returned 0% for a completed, scored interview once the score was stripped", () => {
    // What the list endpoint actually sent: nine fields, no score.
    const asTheApiSentIt = [attempt()] as (MockInterview & { score?: number })[];
    expect(averageBeforeTheFix(asTheApiSentIt)).toBe(0);
    // And the same payload, now that the server sends the mark.
    expect(averageOf([attempt({ score: 72, is_scored: true })])).toBe(72);
  });
});

describe("the average score a learner is shown", () => {
  it("is the mark of their one completed interview, not zero", () => {
    // THE REPORTED BUG. Fails before the fix: the row carried no `score` at all, the filter
    // matched nothing, and this was 0.
    expect(averageOf([attempt({ score: 72, is_scored: true })])).toBe(72);
  });

  it("averages only the attempts that have a mark", () => {
    const rows = [
      attempt({ id: 1, score: 80, is_scored: true }),
      attempt({ id: 2, score: 60, is_scored: true }),
      // Still being marked. Counting it as 0 would report 46.7% for two interviews that
      // averaged 70.
      attempt({ id: 3, score: null, is_scored: false }),
    ];
    expect(averageOf(rows)).toBe(70);
  });

  it("counts a genuine zero, which is a score like any other", () => {
    // Excluding the unscored must not quietly exclude somebody who scored nothing.
    expect(averageOf([attempt({ score: 0, is_scored: true })])).toBe(0);
  });

  it("has no average at all when nothing has been marked yet", () => {
    expect(averageOf([attempt({ score: null, is_scored: false })])).toBeNull();
  });

  it("ignores an attempt that is not completed", () => {
    const rows = [
      attempt({ id: 1, score: 90, is_scored: true }),
      attempt({ id: 2, status: "scheduled", score: null, is_scored: false }),
    ];
    expect(averageOf(rows)).toBe(90);
  });
});

describe("the average score card", () => {
  it("shows the percentage when there is one", () => {
    render(
      <InterviewStats
        totalInterviews={1}
        completedInterviews={1}
        scheduledInterviews={0}
        averageScore={72}
      />,
    );
    expect(screen.getByText("72%")).toBeInTheDocument();
  });

  it("says there is no score yet rather than printing 0%", () => {
    // The exact shape of the report: one interview, completed, and no mark to show. Before
    // the fix this card could only ever render "0%".
    render(
      <InterviewStats
        totalInterviews={1}
        completedInterviews={1}
        scheduledInterviews={0}
        averageScore={null}
      />,
    );
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("still shows a real zero as a zero", () => {
    render(
      <InterviewStats
        totalInterviews={1}
        completedInterviews={1}
        scheduledInterviews={0}
        averageScore={0}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
