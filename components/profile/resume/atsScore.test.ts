import { describe, expect, it } from "vitest";
import { computeATSScore, countPlaceholderHits } from "./atsScore";
import { computeStandardATSScoreReport } from "./atsStandardReport";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";
import type { ResumeData } from "./types";

/**
 * These tests exist because the ATS scorer shipped two defects that no test covered:
 *
 *  1. The toolbar score and the dialog score came from different engines, so opening the
 *     ATS dialog moved the number by 61 points on this very sample resume (85 -> 24).
 *  2. Every sub-scorer graded PRESENCE rather than QUALITY, and keyword match returned a
 *     hardcoded 100 whenever no job description was supplied, so placeholder resumes
 *     scored in the 70s-80s with several categories at 100/100.
 *
 * Scoring is silent-regression territory: a wrong number still renders happily. Keep these
 * invariants locked.
 */

const EMPTY: ResumeData = {
  basicInfo: {
    firstName: "", lastName: "", professionalTitle: "", email: "", phone: "",
    location: "", photo: "", summary: "", github: "", linkedin: "", portfolio: "",
    leetcode: "", hackerrank: "", kaggle: "", medium: "",
  },
  workExperience: [], education: [], skills: [], projects: [], certifications: [],
} as unknown as ResumeData;

/** A thin but genuine resume - the shape described in the bug report. */
const THIN = {
  ...EMPTY,
  basicInfo: {
    ...EMPTY.basicInfo,
    firstName: "Rahul", lastName: "Verma", professionalTitle: "Developer",
    email: "rahul.verma@gmail.com", phone: "+91 90000 11122", location: "Pune",
    summary: "Looking for a software role where I can learn and grow with the team.",
  },
  workExperience: [{
    id: "1", position: "Intern", company: "Startup", location: "Pune",
    startDate: "2024-01", endDate: "2024-06", current: false,
    description: ["Worked on the frontend", "Helped the team"],
  }],
  education: [{
    id: "1", degree: "B.Tech Computer Science", institution: "Pune University",
    location: "Pune", startDate: "2020-08", endDate: "2024-05", gpa: "7.8", description: "",
  }],
  skills: [
    { id: "1", name: "HTML", level: 3 },
    { id: "2", name: "CSS", level: 3 },
    { id: "3", name: "JavaScript", level: 3 },
  ],
} as unknown as ResumeData;

/** A strong, real resume: quantified bullets, real identity, depth. */
const STRONG = {
  ...SAMPLE_RESUME_DATA,
  basicInfo: {
    ...SAMPLE_RESUME_DATA.basicInfo,
    firstName: "Priya", lastName: "Ramachandran",
    email: "priya.ramachandran@gmail.com", phone: "+91 98450 22314",
  },
  workExperience: [
    {
      ...SAMPLE_RESUME_DATA.workExperience[0],
      company: "Freshworks",
      description: [
        "Led migration of 14 monolith modules to microservices, cutting p95 latency from 820ms to 310ms",
        "Improved checkout conversion 12% by rebuilding the payment retry pipeline",
        "Mentored 5 engineers; 3 promoted within 18 months",
        "Cut AWS spend 28% ($42k/yr) by right-sizing ECS tasks",
      ],
    },
    {
      ...SAMPLE_RESUME_DATA.workExperience[1],
      company: "Zoho Corporation",
      description: [
        "Built a React dashboard used by 9,000 daily active agents",
        "Implemented 34 REST endpoints in Node.js/Express with 92% test coverage",
        "Reduced bundle size 41% via code splitting and tree shaking",
      ],
    },
  ],
} as unknown as ResumeData;

describe("keyword match is never a free 100", () => {
  it("is null - not 100 - when no job description is supplied", () => {
    // The old code set this to 100 and rendered "Keyword match 100/100" for everyone.
    expect(computeATSScore(STRONG, "").breakdown.keywordMatch).toBeNull();
  });

  it("is a real ratio once a job description is supplied", () => {
    const withJob = computeATSScore(STRONG, "React Node.js AWS microservices payment");
    expect(withJob.breakdown.keywordMatch).not.toBeNull();
    expect(withJob.breakdown.keywordMatch).toBeGreaterThan(0);
    expect(withJob.breakdown.keywordMatch).toBeLessThanOrEqual(100);
  });
});

describe("placeholder content cannot score like a real resume", () => {
  it("detects the sample resume the builder boots with", () => {
    expect(countPlaceholderHits(SAMPLE_RESUME_DATA)).toBeGreaterThan(0);
  });

  it("scores the untouched sample well below a passing resume", () => {
    // Was 85 before the fix.
    expect(computeStandardATSScoreReport(SAMPLE_RESUME_DATA).atsScore).toBeLessThan(45);
  });

  it("reports no category at 100/100 for placeholder content", () => {
    const { breakdown } = computeStandardATSScoreReport(SAMPLE_RESUME_DATA);
    expect(breakdown).toBeDefined();
    let at100 = 0;
    for (const v of Object.values(breakdown ?? {})) {
      if (v === 100) at100 += 1;
    }
    expect(at100).toBe(0);
  });

  it("tells the user to replace the sample details", () => {
    const { detailedReport } = computeStandardATSScoreReport(SAMPLE_RESUME_DATA);
    expect(detailedReport.scopeForImprovement.join(" ")).toMatch(/placeholder|sample/i);
  });
});

describe("scores grade quality, not mere presence", () => {
  it("ranks strong > thin > empty", () => {
    const strong = computeStandardATSScoreReport(STRONG).atsScore;
    const thin = computeStandardATSScoreReport(THIN).atsScore;
    const empty = computeStandardATSScoreReport(EMPTY).atsScore;
    expect(strong).toBeGreaterThan(thin);
    expect(thin).toBeGreaterThan(empty);
  });

  it("keeps a genuinely strong resume in a high band", () => {
    expect(computeStandardATSScoreReport(STRONG).atsScore).toBeGreaterThanOrEqual(70);
  });

  it("puts a thin resume in a realistic low band, not the 70s", () => {
    // The bug report saw 71 for a resume of roughly this quality.
    expect(computeStandardATSScoreReport(THIN).atsScore).toBeLessThan(50);
  });

  it("does not award full marks for empty sections", () => {
    // Old scoreFormat gave 100 for three non-empty arrays regardless of content.
    const hollow = {
      ...EMPTY,
      workExperience: [{ id: "1", position: "", company: "", location: "", startDate: "", endDate: "", current: false, description: [] }],
      education: [{ id: "1", degree: "", institution: "", location: "", startDate: "", endDate: "", gpa: "", description: "" }],
      skills: [{ id: "1", name: "", level: 1 }],
    } as unknown as ResumeData;
    expect(computeATSScore(hollow, "").breakdown.format).toBeLessThan(100);
  });
});

describe("one engine, one number", () => {
  it("is deterministic across repeated calls", () => {
    const a = computeStandardATSScoreReport(STRONG);
    const b = computeStandardATSScoreReport(STRONG);
    expect(a.atsScore).toBe(b.atsScore);
  });

  it("keeps atsScore and overallScore in agreement", () => {
    // The LLM route returned atsScore 24 alongside overallScore 72 for one resume.
    for (const r of [STRONG, THIN, EMPTY, SAMPLE_RESUME_DATA]) {
      const report = computeStandardATSScoreReport(r);
      expect(report.atsScore).toBe(report.overallScore);
    }
  });

  it("never returns a score outside 0-100", () => {
    for (const r of [STRONG, THIN, EMPTY, SAMPLE_RESUME_DATA]) {
      const s = computeStandardATSScoreReport(r).atsScore;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});
