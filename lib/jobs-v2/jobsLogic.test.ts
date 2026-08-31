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
  applyDomain,
  deadlineLabel,
  descriptionPreview,
  formatBytes,
  formatEmploymentType,
  formatExperience,
  formatSalary,
  formatWorkMode,
  jobTypeBadge,
  normaliseDescription,
  postedLabel,
} from "./format";
import {
  isContentEmpty,
  jobHighlights,
  parseFlatDescription,
  resolveJobContent,
} from "./content";
import {
  buildEligibility,
  enforcedOnly,
  enforcedVerdict,
  statedOnly,
  visibilityReasonLabel,
} from "./eligibility";
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

/* =========================================================================
 * content.ts — the bridge that keeps 486 published rows from going blank
 *
 * `resolveJobContent` is the single decision point for D4 + D7, and the whole rollout depends
 * on it rendering BOTH shapes: the structured columns the backend is growing, and today's flat
 * `job_description` string that every published row and every staging row still carries.
 *
 * `parseFlatDescription` is that bridge, and its most important behaviour is the one that says
 * NO: a hand-written description with no markers must fall through to `<Prose>` untouched,
 * because a parse that guesses is a generation, and a generation is an invention.
 * ======================================================================= */

describe("parseFlatDescription", () => {
  // A real flat description in the shape our own composer writes and the shape Greenhouse,
  // Lever and Ashby postings arrive in: a summary paragraph, then two labelled bullet blocks.
  const FLAT = [
    "We are looking for a Senior Backend Engineer to own the billing platform at Razorpay.",
    "You will work with a team of six on services that move money for 300,000 businesses.",
    "",
    "Responsibilities:",
    "- Design and ship services in Python and Django",
    "- Own the billing data model end to end",
    "- Review code and mentor two junior engineers",
    "",
    "Requirements:",
    "- 4+ years building backend services in production",
    "- Strong SQL and PostgreSQL experience",
    "- Experience with distributed systems",
    "",
    "Preferred qualifications:",
    "- Experience with Kafka",
    "- Exposure to the payments domain",
  ].join("\n");

  it("splits a summary paragraph and two labelled bullet blocks into the section shapes", () => {
    const parsed = parseFlatDescription(FLAT);
    expect(parsed).not.toBeNull();
    expect(parsed!.roleSummary).toContain("Senior Backend Engineer");
    expect(parsed!.roleSummary).toContain("300,000 businesses");
    // The summary stops at the first marker: no bullet leaks into the lead paragraph.
    expect(parsed!.roleSummary).not.toMatch(/Responsibilities|Design and ship/);
    expect(parsed!.responsibilities).toEqual([
      "Design and ship services in Python and Django",
      "Own the billing data model end to end",
      "Review code and mentor two junior engineers",
    ]);
    expect(parsed!.requirementsMust).toEqual([
      "4+ years building backend services in production",
      "Strong SQL and PostgreSQL experience",
      "Experience with distributed systems",
    ]);
    expect(parsed!.requirementsGood).toEqual([
      "Experience with Kafka",
      "Exposure to the payments domain",
    ]);
  });

  it("handles the HTML the scraper stores and a heading run into its own block", () => {
    const html =
      "<p>Own the data platform.</p><p><strong>Responsibilities:</strong> Build the warehouse. " +
      "</p><ul><li>Ship the ingestion jobs</li><li>Own the schema</li></ul>" +
      "<p>Requirements:</p><ul><li>3 years of Python</li><li>dbt or Airflow</li></ul>";
    const parsed = parseFlatDescription(html);
    expect(parsed).not.toBeNull();
    expect(parsed!.roleSummary).toBe("Own the data platform.");
    // The text the employer ran into the heading line is the block's first item, not lost.
    expect(parsed!.responsibilities).toEqual([
      "Build the warehouse.",
      "Ship the ingestion jobs",
      "Own the schema",
    ]);
    expect(parsed!.requirementsMust).toEqual(["3 years of Python", "dbt or Airflow"]);
  });

  it("keeps the two requirement lists DISJOINT, so the UI never shows one item twice", () => {
    const parsed = parseFlatDescription(
      [
        "Lead the platform team.",
        "Requirements:",
        "- Kubernetes",
        "- Go",
        "Nice to have:",
        "- kubernetes",
        "- Terraform",
      ].join("\n"),
    );
    expect(parsed!.requirementsMust).toEqual(["Kubernetes", "Go"]);
    // `good - must`, case-folded: the same structural fix `dedupe_skills` already applies.
    expect(parsed!.requirementsGood).toEqual(["Terraform"]);
  });

  it("returns null for a hand-written description with no markers — a parse is not a guess", () => {
    const handWritten =
      "Come join our small team. We take our responsibilities to our customers seriously and " +
      "we are looking for someone who cares about the craft. Write to us and tell us what you " +
      "have built.";
    // "responsibilities" occurs mid-sentence and must never open a section.
    expect(parseFlatDescription(handWritten)).toBeNull();
  });

  it("returns null when the markers are there but the blocks are trivial", () => {
    expect(
      parseFlatDescription("A role.\nRequirements:\n- A degree"),
    ).toBeNull();
  });

  it("returns null for empty, whitespace and missing input", () => {
    expect(parseFlatDescription(null)).toBeNull();
    expect(parseFlatDescription(undefined)).toBeNull();
    expect(parseFlatDescription("")).toBeNull();
    expect(parseFlatDescription("   \n  \n ")).toBeNull();
  });
});

describe("resolveJobContent", () => {
  const base = { id: 1, job_title: "Backend Engineer", company_name: "Razorpay" };

  it("prefers the structured columns and reports origin 'structured'", () => {
    const content = resolveJobContent({
      ...base,
      role_summary: "Own the billing platform.",
      responsibilities: ["- Ship services", "Own the data model", "Own the data model"],
      requirements_must: ["4 years of Python"],
      requirements_good: ["Kafka", "4 YEARS OF PYTHON"],
      tech_stack: ["PostgreSQL", "Django"],
      perks: ["Relocation assistance"],
      // The derived flat projection is present too, and must NOT be rendered a second time.
      job_description: "Own the billing platform.\nResponsibilities:\n- Ship services",
    });
    expect(content.origin).toBe("structured");
    expect(content.flat).toBeUndefined();
    expect(content.roleSummary).toBe("Own the billing platform.");
    // De-bulleted and de-duplicated.
    expect(content.responsibilities).toEqual(["Ship services", "Own the data model"]);
    // Disjoint by construction, even when the backend has not applied the rule yet.
    expect(content.requirementsGood).toEqual(["Kafka"]);
    expect(content.techStack).toEqual(["PostgreSQL", "Django"]);
  });

  it("parses a legacy flat row into the SAME shapes, so it looks structured on day one", () => {
    const content = resolveJobContent({
      ...base,
      job_description: [
        "Own the data platform at Acme.",
        "What you'll do:",
        "- Build the warehouse",
        "- Own the schema",
        "Requirements:",
        "- 3 years of Python",
      ].join("\n"),
    });
    expect(content.origin).toBe("parsed");
    expect(content.roleSummary).toBe("Own the data platform at Acme.");
    expect(content.responsibilities).toEqual(["Build the warehouse", "Own the schema"]);
    expect(content.requirementsMust).toEqual(["3 years of Python"]);
    // Nothing to render twice: the blob is not handed back for a <Prose> pass as well.
    expect(content.flat).toBeUndefined();
  });

  it("falls back to the raw string for a manual job, which is a PERMANENT shape", () => {
    const content = resolveJobContent({
      ...base,
      job_description: "Drop us a line if you like building things. No bullet points here.",
    });
    expect(content.origin).toBe("flat");
    expect(content.flat).toBe("Drop us a line if you like building things. No bullet points here.");
    expect(content.responsibilities).toEqual([]);
  });

  it("reports 'empty' for a row with nothing at all, and never throws on it", () => {
    const content = resolveJobContent(base);
    expect(content.origin).toBe("empty");
    expect(isContentEmpty(content)).toBe(true);
    expect(content.roleSummary).toBe("");
    expect(content.responsibilities).toEqual([]);
  });

  it("keeps a structured tech_stack and perks even when the prose has to be parsed", () => {
    const content = resolveJobContent({
      ...base,
      tech_stack: ["Airflow"],
      perks: ["Annual learning budget"],
      job_description: [
        "Own the pipeline.",
        "Responsibilities:",
        "- Ship the DAGs",
        "- Own the SLAs",
      ].join("\n"),
    });
    expect(content.origin).toBe("parsed");
    expect(content.techStack).toEqual(["Airflow"]);
    expect(content.perks).toEqual(["Annual learning budget"]);
  });
});

describe("jobHighlights — computed, never model output", () => {
  it("renders a chip only for a fact we hold, in the fixed order", () => {
    const items = jobHighlights({
      id: 1,
      job_title: "Backend Engineer",
      company_name: "Razorpay",
      work_mode: "Hybrid",
      years_of_experience: "2-4",
      salary: "18-24 LPA",
      number_of_openings: 3,
      tech_stack: ["Django", "PostgreSQL"],
      employment_type: "full_time",
    });
    expect(items.map((h) => h.key)).toEqual([
      "workMode",
      "experience",
      "salary",
      "openings",
      "techStack",
      "employment",
    ]);
    // Salary is passed through VERBATIM. We never invent a currency or a range.
    expect(items.find((h) => h.key === "salary")!.label).toBe("18-24 LPA");
  });

  it("renders NOTHING for a row that states none of them — no dash, no empty slot", () => {
    expect(
      jobHighlights({ id: 1, job_title: "Analyst", company_name: "Acme" }),
    ).toEqual([]);
  });

  it("omits a work mode we cannot validate, and never infers one from a location", () => {
    const items = jobHighlights({
      id: 1,
      job_title: "Analyst",
      company_name: "Acme",
      location: "Bengaluru",
      work_mode: "Bengaluru office maybe",
    });
    expect(items).toEqual([]);
  });

  it("does not render an openings chip for zero or a nonsense value", () => {
    for (const openings of [0, -2, null, undefined]) {
      const items = jobHighlights({
        id: 1,
        job_title: "Analyst",
        company_name: "Acme",
        number_of_openings: openings as number | null,
      });
      expect(items.some((h) => h.key === "openings")).toBe(false);
    }
  });
});

/* =========================================================================
 * format.ts — work mode and the apply destination
 * ======================================================================= */

describe("formatWorkMode", () => {
  it("canonicalises the spellings a feed actually sends", () => {
    expect(formatWorkMode("remote")).toBe("Remote");
    expect(formatWorkMode("Work From Home")).toBe("Remote");
    expect(formatWorkMode("on_site")).toBe("On-site");
    expect(formatWorkMode("On Site")).toBe("On-site");
    expect(formatWorkMode("HYBRID")).toBe("Hybrid");
  });

  it("returns null rather than guessing — an unstated location is not evidence of on-site", () => {
    expect(formatWorkMode("Bengaluru")).toBeNull();
    expect(formatWorkMode("")).toBeNull();
    expect(formatWorkMode(null)).toBeNull();
    expect(formatWorkMode(undefined)).toBeNull();
    expect(formatWorkMode("Not disclosed")).toBeNull();
  });
});

describe("applyDomain", () => {
  it("names the destination the button hands the student to", () => {
    expect(applyDomain("https://boards.greenhouse.io/acme/jobs/123")).toBe("boards.greenhouse.io");
    expect(applyDomain("https://www.linkedin.com/jobs/view/1")).toBe("linkedin.com");
  });

  it("returns null for anything a click cannot follow", () => {
    expect(applyDomain("/jobs-v2/1/apply")).toBeNull();
    expect(applyDomain("javascript:alert(1)")).toBeNull();
    expect(applyDomain("")).toBeNull();
    expect(applyDomain(null)).toBeNull();
  });
});

/* =========================================================================
 * relevance.ts — tech_stack joins the ONE skill vocabulary
 * ======================================================================= */

describe("jobSkillEntries with tech_stack", () => {
  it("folds tech_stack into the same vocabulary, after key skills and before free tags", () => {
    const entries = jobSkillEntries({
      mandatory_skills: ["Python"],
      key_skills: ["Django"],
      tech_stack: ["PostgreSQL", "django"],
      tags: ["Backend", "python"],
    });
    // Deduped case-insensitively across ALL four sources — a job can no longer match a filter
    // chip it does not display.
    expect(entries.map((e) => e.label)).toEqual(["Python", "Django", "PostgreSQL", "Backend"]);
  });

  it("matches a learner's skill that only appears in tech_stack", () => {
    const learner = learnerSkillTokens(["postgresql"]);
    expect(matchedSkills({ tech_stack: ["PostgreSQL"] }, learner)).toEqual(["PostgreSQL"]);
  });
});

/* =========================================================================
 * eligibility.ts — the checklist must never lie about enforcement
 * ======================================================================= */

describe("buildEligibility", () => {
  const job = (over: Record<string, unknown> = {}) =>
    ({ id: 1, job_title: "Backend Engineer", company_name: "Razorpay", ...over }) as never;

  it("returns eligible: null when we do not know, so the card renders nothing", () => {
    const summary = buildEligibility(job());
    expect(summary.eligible).toBeNull();
    expect(summary.checks).toEqual([]);
  });

  it("marks the stated gates NOT enforced, whatever their status", () => {
    const summary = buildEligibility(
      job({
        eligible_to_apply: true,
        applicable_passout_year: "2025-2026",
        min_graduation_percentage: 60,
        min_12th_percentage: 70,
      }),
      { passoutYear: 2026, graduationPercentage: 68 },
    );
    const stated = statedOnly(summary.checks);
    expect(stated.every((c) => c.enforced === false)).toBe(true);
    expect(stated.find((c) => c.key === "passout_year")).toMatchObject({
      requirement: "2025-2026",
      yours: "2026",
      status: "pass",
    });
    expect(stated.find((c) => c.key === "graduation_percentage")).toMatchObject({
      requirement: "60%",
      yours: "68%",
      status: "pass",
    });
    // Not on the profile is "unknown", never "fail". We do not judge data we do not have.
    expect(stated.find((c) => c.key === "percentage_12")).toMatchObject({
      yours: null,
      status: "unknown",
    });
  });

  it("never lets a failed stated gate flip the verdict the Apply button reads", () => {
    const summary = buildEligibility(
      job({ eligible_to_apply: true, min_graduation_percentage: 90 }),
      { graduationPercentage: 55 },
    );
    // The gate fails, and the student can still apply — because apply does not enforce it.
    expect(summary.checks.find((c) => c.key === "graduation_percentage")!.status).toBe("fail");
    expect(summary.eligible).toBe(true);
    expect(enforcedVerdict(summary)).toBe(true);
  });

  it("attributes an enforced failure only when it can be attributed with certainty", () => {
    const oneDimension = buildEligibility(
      job({ eligible_to_apply: false, courses: [{ id: 1, title: "Python Full-Stack" }] }),
    );
    expect(enforcedOnly(oneDimension.checks)).toHaveLength(1);
    expect(oneDimension.checks[0]).toMatchObject({ key: "course", status: "fail", enforced: true });
    expect(oneDimension.reason).toBeTruthy();

    const twoDimensions = buildEligibility(
      job({
        eligible_to_apply: false,
        courses: [{ id: 1, title: "Python Full-Stack" }],
        college_mappings: [{ college_name: "VIT" }],
      }),
    );
    // We know the verdict but not which of the two caused it, so neither row claims to be it.
    expect(enforcedOnly(twoDimensions.checks).map((c) => c.status)).toEqual([
      "unknown",
      "unknown",
    ]);
  });

  it("passes every enforced dimension when the server says eligible", () => {
    const summary = buildEligibility(
      job({
        eligible_to_apply: true,
        courses: [{ id: 1, title: "Python Full-Stack" }],
        college_mappings: [{ college_name: "VIT" }],
      }),
    );
    expect(enforcedOnly(summary.checks).map((c) => c.status)).toEqual(["pass", "pass"]);
    expect(summary.reason).toBeUndefined();
  });

  it("prefers the backend payload, and treats a missing `enforced` as NOT enforced", () => {
    const summary = buildEligibility(
      job({
        eligible_to_apply: true,
        eligibility: {
          eligible: false,
          reason: "You are not enrolled in Python Full-Stack",
          checks: [
            { key: "course", label: "Enrolled course", requirement: "Python Full-Stack", yours: null, status: "fail", enforced: true },
            { key: "passout_year", label: "Passout year", requirement: "2026", yours: "2025", status: "fail" },
            { key: "weird", label: "Weird", requirement: "?", yours: null, status: "banana" },
          ],
        },
      }),
    );
    // The server owns the verdict; we do not recompute one it already answered.
    expect(summary.eligible).toBe(false);
    expect(summary.reason).toBe("You are not enrolled in Python Full-Stack");
    expect(enforcedOnly(summary.checks).map((c) => c.key)).toEqual(["course"]);
    // An unrecognised status degrades to "unknown" rather than crashing or claiming a failure.
    expect(summary.checks.find((c) => c.key === "weird")!.status).toBe("unknown");
  });

  it("maps a visibility reason to a sentence, and says nothing for an open role", () => {
    expect(visibilityReasonLabel("cohort")).toBeTruthy();
    expect(visibilityReasonLabel("assigned")).toBeTruthy();
    expect(visibilityReasonLabel("open")).toBeNull();
    expect(visibilityReasonLabel("something_new")).toBeNull();
    expect(visibilityReasonLabel(undefined)).toBeNull();
  });
});
