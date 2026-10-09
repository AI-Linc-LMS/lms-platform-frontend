import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/**
 * Whose code the editor opens with.
 *
 * Two reports, one cause. The local draft that keeps typed code across a refresh was keyed
 * `adaptiveCoding:draft:<problem>:<language>` - no viewer in the key, and unconditionally ahead
 * of the starter template.
 *
 *   * Not per person. On a shared machine the next learner to open the problem was handed
 *     whatever the last one left behind: "the solution of this question is already written
 *     there even before I attempted it". On production, 3 of the 6 stored attempts at that
 *     problem were complete working solutions.
 *   * Permanent. A draft outranked the template for ever, so a starter repaired in the database
 *     never reached anyone who had already opened the problem. They kept the old
 *     `Scanner.nextLine()` driver, which dies on the empty-input test - every six-case copy of
 *     "Check for Palindrome String" has TC5 `"" -> YES` - and read as their own code failing.
 */

const AUTH = { id: 0 };
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: { id: AUTH.id } }) }));

const problem = {
  id: 4242, title: "Check for Palindrome String", difficulty_level: "Easy" as const,
  problem_statement: "<p>palindrome?</p>", input_format: "", output_format: "",
  sample_input: "madam", sample_output: "YES", constraints: "",
  template_code: { python: "NEW_STARTER" },
  tags: "", target_skills: [], topic: "",
};
// An active session with NO server source, so only the local draft and the template are in play.
const session = {
  id: "s1", config: 1, problem, language: "python", status: "active" as const,
  run_count: 0, submit_count: 0, hints_revealed: 0, last_source: "", passed: false,
  allow_clipboard: false,
  points: { base: 150, grace: 300, dec: 5, iv: 60, floor: 30 },
  server_now: "2026-09-22T10:05:00Z", started_at: "2026-09-22T10:00:00Z", completed_at: null,
  latest_submission: null,
};
vi.mock("@/lib/services/adaptive-coding.service", () => ({
  adaptiveCodingService: {
    getProblem: () => Promise.resolve(problem),
    getActiveSession: () => Promise.resolve(session),
    runWithDiagnosis: vi.fn(),
  },
}));
vi.mock("@/components/editor/MonacoEditor", () => ({
  CodeEditor: ({ value }: { value: string }) => <textarea data-testid="editor" value={value} readOnly />,
}));
vi.mock("@/components/coding/CodingTimerPoints", () => ({ CodingTimerPoints: () => <div /> }));
vi.mock("@/components/coding/MentorAnalysisCard", () => ({ MentorAnalysisCard: () => <div /> }));
vi.mock("@/components/coding/CodingMasteryPanel", () => ({ CodingMasteryPanel: () => <div /> }));
vi.mock("@/components/coding/AdaptiveCodingSubmissions", () => ({ AdaptiveCodingSubmissions: () => <div /> }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k.split(".").pop() }) }));

import { AdaptiveCodingSolve } from "./AdaptiveCodingSolve";

const editorValue = async () => {
  const el = (await screen.findByTestId("editor")) as HTMLTextAreaElement;
  return el.value;
};

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("the editor's opening contents", () => {
  it("does not hand one learner the code another left in the browser", async () => {
    // The old key had no viewer in it, so this is literally what an affected browser holds
    // today - a finished solution written by whoever used the machine last. Under the old key
    // shape the next learner read exactly this back.
    localStorage.setItem("adaptiveCoding:draft:4242:python", "THEIR_FINISHED_SOLUTION");

    AUTH.id = 12;
    render(<AdaptiveCodingSolve configId={1} problemId={4242} />);
    await waitFor(async () => expect(await editorValue()).toBe("NEW_STARTER"));
    expect(await editorValue()).not.toContain("THEIR_FINISHED_SOLUTION");
  });

  it("writes its draft under a key that names the viewer", async () => {
    AUTH.id = 11;
    render(<AdaptiveCodingSolve configId={1} problemId={4242} />);
    await waitFor(async () => expect(await editorValue()).toBe("NEW_STARTER"));
    // The guarantee behind the test above: nothing this learner types can be read back by
    // another one, because their id is part of every key we write.
    await waitFor(() =>
      expect(localStorage.getItem("adaptiveCoding:base:11:4242:python")).toBe("NEW_STARTER"));
    expect(localStorage.getItem("adaptiveCoding:base:4242:python")).toBeNull();
  });

  it("gives a repaired starter to a learner who only ever opened the old one", async () => {
    AUTH.id = 11;
    // An untouched draft: byte-identical to the starter it was seeded from.
    localStorage.setItem("adaptiveCoding:draft:11:4242:python", "OLD_BROKEN_STARTER");
    localStorage.setItem("adaptiveCoding:base:11:4242:python", "OLD_BROKEN_STARTER");

    render(<AdaptiveCodingSolve configId={1} problemId={4242} />);
    await waitFor(async () => expect(await editorValue()).toBe("NEW_STARTER"));
  });

  it("never discards work the learner actually typed", async () => {
    // The guard above must not become a licence to throw away code. Same stale base, but the
    // draft has diverged from it, so it is the learner's and it wins.
    AUTH.id = 11;
    localStorage.setItem("adaptiveCoding:draft:11:4242:python", "OLD_BROKEN_STARTER\nmy work");
    localStorage.setItem("adaptiveCoding:base:11:4242:python", "OLD_BROKEN_STARTER");

    render(<AdaptiveCodingSolve configId={1} problemId={4242} />);
    await waitFor(async () => expect(await editorValue()).toBe("OLD_BROKEN_STARTER\nmy work"));
  });

  it("keeps an untouched draft when the starter has not changed", async () => {
    AUTH.id = 11;
    localStorage.setItem("adaptiveCoding:draft:11:4242:python", "NEW_STARTER");
    localStorage.setItem("adaptiveCoding:base:11:4242:python", "NEW_STARTER");

    render(<AdaptiveCodingSolve configId={1} problemId={4242} />);
    await waitFor(async () => expect(await editorValue()).toBe("NEW_STARTER"));
  });

  it("records what it seeded the editor from, so the next repair can be detected", async () => {
    AUTH.id = 11;
    render(<AdaptiveCodingSolve configId={1} problemId={4242} />);
    await waitFor(async () => expect(await editorValue()).toBe("NEW_STARTER"));
    expect(localStorage.getItem("adaptiveCoding:base:11:4242:python")).toBe("NEW_STARTER");
  });

});
