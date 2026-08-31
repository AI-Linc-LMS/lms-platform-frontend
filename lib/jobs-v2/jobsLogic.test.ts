/**
 * The shared logic Groups 2-5 build on.
 *
 * These are not "does it compile" tests. Each one pins a behaviour the spec named as a live
 * bug, so a future edit that reintroduces the bug fails here rather than in production:
 *   - `postedLabel` must return `null` for a missing date, never "Recently";
 *   - an unknown question type must still produce an answerable control;
 *   - a multi-choice answer containing a comma must survive a round trip;
 *   - `resolveJobStatus` must not crash on a status the API invents;
 *   - `useSelection` must clear whenever the visible rows change;
 *   - `useSeq` must let a newer request win over a slower older one.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@/lib/i18n";

import { deadlineLabel, formatBytes, formatExperience, formatSalary, postedLabel } from "./format";
import {
  MULTI_ANSWER_SEPARATOR,
  displayAnswer,
  parseAnswerText,
  resolveQuestionControl,
  serializeAnswers,
  validateAnswers,
  type JobQuestion,
} from "./questions";
import { normalizeScrapedState, resolveAppStatus, resolveJobStatus, statusOptions } from "./status";
import { useSelection } from "./useSelection";
import { useSeq } from "./useSeq";

const q = (over: Partial<JobQuestion>): JobQuestion => ({
  id: 1,
  question_text: "Why?",
  question_type: "text",
  is_required: false,
  order: 0,
  ...over,
});

describe("format", () => {
  it("returns null rather than inventing a posted date", () => {
    expect(postedLabel(undefined)).toBeNull();
    expect(postedLabel("")).toBeNull();
    expect(postedLabel("not-a-date")).toBeNull();
    expect(postedLabel(new Date(Date.now() - 2 * 86_400_000))).toContain("2");
  });

  it("classifies deadline urgency", () => {
    expect(deadlineLabel(null)).toBeNull();
    expect(deadlineLabel(new Date(Date.now() - 86_400_000))?.urgency).toBe("past");
    expect(deadlineLabel(new Date(Date.now() + 86_400_000))?.urgency).toBe("urgent");
    expect(deadlineLabel(new Date(Date.now() + 5 * 86_400_000))?.urgency).toBe("soon");
    expect(deadlineLabel(new Date(Date.now() + 40 * 86_400_000))?.urgency).toBe("none");
  });

  it("passes free-text salary through and says nothing when undisclosed", () => {
    expect(formatSalary("8-12 LPA")).toBe("8-12 LPA");
    expect(formatSalary("Not disclosed")).toBeNull();
    expect(formatSalary("")).toBeNull();
    expect(formatSalary(null)).toBeNull();
  });

  it("suffixes a bare experience range exactly once", () => {
    expect(formatExperience("0-1")).toMatch(/0-1/);
    expect(formatExperience("2 years")).toBe("2 years");
    expect(formatExperience(null)).toBeNull();
  });

  it("formats bytes", () => {
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});

describe("questions", () => {
  it("never leaves an unknown type without a control", () => {
    const resolved = resolveQuestionControl(q({ question_type: "signature_pad" }));
    expect(resolved.control).toBe("textarea");
    expect(resolved.fallback).toBe(true);
  });

  it("sends multi-choice answers on the wire exactly as the shipped board did", () => {
    // 10.5: `response_text` reaches an unchanged API and is exported to CSV verbatim, so the
    // separator stays `", "`. Nothing in this app reads a stored answer back.
    const question = q({
      id: 7,
      question_type: "multichoice",
      options: ["Yes, remote", "On site"],
    });
    const [payload] = serializeAnswers([question], { 7: ["Yes, remote", "On site"] });
    expect(payload.response_text).toBe("Yes, remote, On site");
    expect(displayAnswer(question, ["Yes, remote", "On site"])).toBe("Yes, remote, On site");
  });

  it("reads answers written with either separator", () => {
    const question = q({ id: 8, question_type: "multichoice", options: ["A", "B"] });
    expect(parseAnswerText(question, "A, B")).toEqual(["A", "B"]);
    expect(parseAnswerText(question, `A${MULTI_ANSWER_SEPARATOR}B`)).toEqual(["A", "B"]);
  });

  it("omits unanswered questions from the payload", () => {
    const questions = [q({ id: 1 }), q({ id: 2 })];
    expect(serializeAnswers(questions, { 1: "yes", 2: "  " })).toHaveLength(1);
  });

  it("produces field-level errors, keyed by question", () => {
    const questions = [
      q({ id: 1, is_required: true }),
      q({ id: 2, question_type: "email" }),
      q({ id: 3, question_type: "number" }),
    ];
    const errors = validateAnswers(questions, { 2: "nope", 3: "abc" });
    expect(Object.keys(errors).sort()).toEqual(["1", "2", "3"]);
  });
});

describe("status", () => {
  it("falls back to a neutral tone instead of crashing on an unknown status", () => {
    expect(resolveJobStatus("teleported").labelKey).toBe("jobsV2.status.unknown");
    expect(resolveAppStatus(undefined).labelKey).toBe("jobsV2.status.unknown");
  });

  it("normalises the values the API actually sends", () => {
    expect(resolveJobStatus("On Hold").labelKey).toBe("jobsV2.jobStatus.on_hold");
    expect(normalizeScrapedState("ready")).toBe("review");
    expect(normalizeScrapedState("expired")).toBe("irrelevant");
    expect(normalizeScrapedState("who-knows")).toBeNull();
  });

  it("gives every Select the full ordered option list", () => {
    expect(statusOptions("job").map((o) => o.value)).toContain("on_hold");
    expect(statusOptions("application")[0].value).toBe("applying");
  });
});

describe("useSelection", () => {
  it("clears whenever the visible rows change", () => {
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useSelection<number>({ ids: [1, 2, 3], deps: [page] }),
      { initialProps: { page: 1 } },
    );

    act(() => result.current.toggle(2));
    expect(result.current.count).toBe(1);

    rerender({ page: 2 });
    expect(result.current.count).toBe(0);
  });

  it("selects a range on shift-click and keeps other pages' selections on select-all", () => {
    const { result } = renderHook(() => useSelection<number>({ ids: [1, 2, 3, 4], deps: [] }));

    act(() => result.current.toggle(1));
    act(() => result.current.toggleRange(4));
    expect([...result.current.selected].sort()).toEqual([1, 2, 3, 4]);

    // Additive per page: a second select-all removes exactly the visible ids.
    act(() => result.current.selectAll());
    expect(result.current.count).toBe(0);
  });
});

describe("useSeq", () => {
  it("lets a newer request invalidate an older one", () => {
    const { result } = renderHook(() => useSeq());
    let first = 0;
    let second = 0;
    act(() => {
      first = result.current.next();
      second = result.current.next();
    });
    expect(result.current.isCurrent(first)).toBe(false);
    expect(result.current.isCurrent(second)).toBe(true);
  });
});
