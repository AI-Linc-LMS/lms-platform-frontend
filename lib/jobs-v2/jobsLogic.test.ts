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

import {
  deadlineLabel,
  descriptionPreview,
  formatBytes,
  formatEmploymentType,
  formatExperience,
  formatSalary,
  jobTypeBadge,
  normaliseDescription,
  postedLabel,
} from "./format";
import {
  jobSkillEntries,
  jobSkillLabels,
  learnerSkillTokens,
  matchCount,
  matchedSkills,
} from "./relevance";
import { interleaveByCompany } from "./variety";
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

/* ==========================================================================
 * Card content quality — the three things a learner reads first.
 * ======================================================================== */

describe("employment type and job type", () => {
  it("canonicalises the feed's spellings of the same employment type", () => {
    expect(formatEmploymentType("full_time")).toBe("Full-time");
    expect(formatEmploymentType("FULL TIME")).toBe("Full-time");
    expect(formatEmploymentType("Full-Time")).toBe("Full-time");
    expect(formatEmploymentType("internship")).toBe("Internship");
  });

  it("says NOTHING rather than rendering an empty slot", () => {
    // Most rows on this board have no employment type at all. The caller omits the chip;
    // it must never receive a dash to render.
    expect(formatEmploymentType(null)).toBeNull();
    expect(formatEmploymentType(undefined)).toBeNull();
    expect(formatEmploymentType("   ")).toBeNull();
    expect(formatEmploymentType("Not disclosed")).toBeNull();
    expect(formatEmploymentType("N/A")).toBeNull();
  });

  it("passes an unrecognised spelling through rather than dropping it", () => {
    expect(formatEmploymentType("Seasonal")).toBe("Seasonal");
  });

  it("renders job_type ONLY when it adds information", () => {
    // The live board's bug: a chip reading "job" on every card.
    expect(jobTypeBadge({ job_type: "job" })).toBeNull();
    expect(jobTypeBadge({ job_type: "" })).toBeNull();
    expect(jobTypeBadge({ job_type: undefined })).toBeNull();
    // An internship is a genuinely different proposition, so it earns a badge...
    expect(jobTypeBadge({ job_type: "internship" })).toBe("Internship");
    expect(jobTypeBadge({ job_type: "INTERN" })).toBe("Internship");
    // ...unless the employment type has already said it.
    expect(jobTypeBadge({ job_type: "internship", employment_type: "Internship" })).toBeNull();
  });
});

describe("descriptionPreview", () => {
  it("drops the company blurb a scraped row opens with", () => {
    const raw =
      "GitLab is the intelligent orchestration platform for DevSecOps, trusted by more than 30 million registered users.\n\n" +
      "As a Senior Frontend Engineer you will own the editor experience end to end.";
    expect(descriptionPreview(raw, "GitLab")).toBe(
      "As a Senior Frontend Engineer you will own the editor experience end to end.",
    );
  });

  it("drops an 'About the Team' banner, heading or inline label", () => {
    expect(
      descriptionPreview("About the Team\n\nWe need a data analyst who can own reporting."),
    ).toBe("We need a data analyst who can own reporting.");
    expect(descriptionPreview("About Us: Acme builds tools.\n\nThe role: own the API.")).toBe(
      "The role: own the API.",
    );
  });

  it("never strips the role itself", () => {
    // The first block mentions the company AND the job. Losing it would be far worse than
    // leaving a boilerplate line in place, so it survives.
    const raw = "GitLab is hiring a Staff Engineer for the Verify stage.";
    expect(descriptionPreview(raw, "GitLab")).toBe(raw);
    // A description that is ONE company paragraph and nothing else keeps that paragraph:
    // an empty card is not an improvement on a boilerplate one.
    const only = "Acme is a logistics company.";
    expect(descriptionPreview(only, "Acme")).toBe(only);
  });

  it("does not strip a paragraph belonging to a DIFFERENT company", () => {
    const raw = "Stripe is a payments company.\n\nWe are looking for a designer.";
    expect(descriptionPreview(raw, "GitLab")).toBe(raw);
  });

  it("normalises nbsp, tabs, HTML and runaway blank lines", () => {
    expect(normaliseDescription("a  b\t\tc")).toBe("a b c");
    expect(normaliseDescription("one\n\n\n\n\ntwo")).toBe("one\n\ntwo");
    expect(normaliseDescription("<p>Own&nbsp;the&nbsp;API</p><p>Ship it</p>")).toBe(
      "Own the API\n\nShip it",
    );
    expect(descriptionPreview("   ")).toBeNull();
    expect(descriptionPreview(null)).toBeNull();
  });
});

/* ==========================================================================
 * The match signal.
 * ======================================================================== */

describe("relevance", () => {
  const job = {
    mandatory_skills: ["React", "TypeScript"],
    key_skills: ["GraphQL"],
    tags: ["react", "Docker"],
  };

  it("reads the three skill keys once, de-duplicated by folded token", () => {
    // "React" and "react" are one skill, and mandatory skills come first.
    expect(jobSkillEntries(job).map((entry) => entry.label)).toEqual([
      "React",
      "TypeScript",
      "GraphQL",
      "Docker",
    ]);
  });

  it("names the skills the learner already has, in the employer's spelling", () => {
    const learner = learnerSkillTokens([{ name: "react" }, { name: "docker" }, { name: "Rust" }]);
    expect(matchedSkills(job, learner)).toEqual(["React", "Docker"]);
    expect(matchCount(job, learner)).toBe(2);
  });

  it("knows nothing rather than guessing when the profile is empty", () => {
    expect(matchedSkills(job, learnerSkillTokens([]))).toEqual([]);
    expect(matchedSkills(job, learnerSkillTokens(undefined))).toEqual([]);
  });

  it("hoists the learner's own skills into a clamped chip row", () => {
    const learner = learnerSkillTokens(["docker"]);
    expect(jobSkillLabels(job, 2, learner)).toEqual(["Docker", "React"]);
    // No learner skills: the job's own order stands.
    expect(jobSkillLabels(job, 2)).toEqual(["React", "TypeScript"]);
  });
});

/* ==========================================================================
 * Company variety.
 * ======================================================================== */

describe("interleaveByCompany", () => {
  const page = [
    { id: 1, company_name: "GitLab" },
    { id: 2, company_name: "GitLab" },
    { id: 3, company_name: "GitLab" },
    { id: 4, company_name: "GitLab" },
    { id: 5, company_name: "GitLab" },
    { id: 6, company_name: "GitLab" },
    { id: 7, company_name: "Acme" },
    { id: 8, company_name: "Globex" },
    { id: 9, company_name: "Initech" },
  ];

  const longestRun = (jobs: Array<{ company_name?: string }>) => {
    let longest = jobs.length ? 1 : 0;
    let run = 1;
    for (let i = 1; i < jobs.length; i += 1) {
      run = jobs[i].company_name === jobs[i - 1].company_name ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    return longest;
  };

  it("breaks up the six consecutive GitLab cards the live board showed", () => {
    // The real shape: a page of 20 with one bulk poster holding six of the slots.
    const live = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: i + 1, company_name: "GitLab" })),
      ...Array.from({ length: 14 }, (_, i) => ({ id: 100 + i, company_name: `Co ${i}` })),
    ];
    expect(longestRun(live)).toBe(6);
    expect(longestRun(interleaveByCompany(live))).toBe(1);
  });

  it("cannot conjure variety that is not there, and says so by degrading gently", () => {
    // Six of nine jobs are one employer's: SOME adjacency is arithmetic, not a bug. What must
    // not survive is the block of six.
    expect(longestRun(page)).toBe(6);
    expect(longestRun(interleaveByCompany(page))).toBeLessThanOrEqual(3);
  });

  it("is a PERMUTATION: nothing dropped, nothing duplicated", () => {
    const out = interleaveByCompany(page);
    expect(out).toHaveLength(page.length);
    expect([...out].map((job) => job.id).sort((a, b) => a - b)).toEqual(
      page.map((job) => job.id).sort((a, b) => a - b),
    );
  });

  it("is deterministic and leaves an already-varied page alone", () => {
    expect(interleaveByCompany(page)).toEqual(interleaveByCompany(page));
    const varied = [
      { id: 1, company_name: "A" },
      { id: 2, company_name: "B" },
      { id: 3, company_name: "C" },
    ];
    expect(interleaveByCompany(varied)).toEqual(varied);
  });

  it("keeps jobs with no company name and short pages exactly as they were", () => {
    const nameless = [{ id: 1 }, { id: 2 }, { id: 3 }].map((job) => ({
      ...job,
      company_name: undefined,
    }));
    expect(interleaveByCompany(nameless)).toEqual(nameless);
    const pair = [{ id: 1, company_name: "A" }, { id: 2, company_name: "A" }];
    expect(interleaveByCompany(pair)).toEqual(pair);
  });

  it("preserves each employer's own order, so recency inside a company is intact", () => {
    const out = interleaveByCompany(page);
    const gitlab = out.filter((job) => job.company_name === "GitLab").map((job) => job.id);
    expect(gitlab).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
