/**
 * A complete resume has to be able to score well.
 *
 * Reported: "Standard sections present 30/100 - All standard sections are present and correctly
 * labeled", and the same shape for contact info, length and dates. Two separate faults sat
 * behind that one screenshot.
 *
 * First, the numbers on screen were the AI's, not the computed ones, so a model could write an
 * affirming sentence and emit 30 beside it. That is fixed in ATSScoreCard.
 *
 * Second - and these tests are about this half - the computed scorers could not award full
 * marks to a resume that deserved them. Sections needed SIX of them including certifications;
 * contact needed THREE profile links; an appropriate length was hard-capped at 90; and a resume
 * with no dates at all scored 50, a softer landing than the one failure here that genuinely
 * breaks a parser.
 */

import { describe, expect, it } from "vitest";
import { computeStandardATSScoreReport } from "./atsStandardReport";
import type { ResumeData, WorkExperience, Education } from "./types";

/** A resume that a recruiter would call complete. Nothing exotic, nothing missing. */
function completeResume(): ResumeData {
  return {
    basicInfo: {
      fullName: "Asha Rao",
      email: "asha@example.com",
      phone: "+91 90000 00000",
      location: "Bengaluru, India",
      linkedin: "https://linkedin.com/in/asharao",
      summary:
        "Product analyst with four years turning messy operational data into decisions, " +
        "working across pricing, retention and supply planning for consumer marketplaces. " +
        "Comfortable owning a question end to end: pulling the data, designing the experiment, " +
        "and presenting the trade-off to the people who have to live with it. Most at home " +
        "where the metric nobody trusts turns out to be measuring the wrong thing.",
    },
    workExperience: [
      {
        id: "1", position: "Senior Data Analyst", company: "Flipkart", location: "Bengaluru",
        startDate: "2023-04", endDate: "", current: true,
        description: [
          "Led a pricing experiment across 1.2M listings that lifted contribution margin by 3.4%.",
          "Built the retention cohort model the growth team now plans every quarter against.",
          "Automated a weekly supply report that had taken two analysts a day each to assemble.",
          "Reduced dashboard load time from 40 seconds to under 4 by rewriting the base query.",
          "Established the metric review that now gates every pricing change before it ships, " +
            "after two launches moved a number nobody had agreed was the right one.",
          "Partnered with supply planning to replace a spreadsheet forecast used across 40 " +
            "cities, cutting stockouts on the top 200 SKUs by a fifth over two quarters.",
        ],
      },
      {
        id: "2", position: "Data Analyst", company: "Swiggy", location: "Bengaluru",
        startDate: "2021-06", endDate: "2023-03", current: false,
        description: [
          "Analyzed 18 months of delivery data to find the three drivers of late orders.",
          "Designed the experiment framework used for menu pricing across 40 cities.",
          "Built the city-level demand forecast that replaced a manual weekly planning call.",
          "Trained six operations managers to read and act on the retention dashboard.",
        ],
      },
      {
        id: "3", position: "Analytics Intern", company: "Razorpay", location: "Bengaluru",
        startDate: "2020-12", endDate: "2021-05", current: false,
        description: [
          "Investigated settlement delays across 9,000 merchants and found two systemic causes.",
          "Delivered the merchant churn analysis that became the team's quarterly baseline.",
          "Automated reconciliation checks that had been run by hand every morning, freeing a " +
            "full day a week for the finance operations team.",
          "Rebuilt the merchant onboarding funnel report so drop-off could be read per step " +
            "rather than per week, which is how the first real bottleneck was found.",
          "Documented the settlement data model, which had lived only in one engineer's head.",
        ],
      },
    ],
    education: [
      { id: "1", degree: "B.Tech, Computer Science", institution: "VIT Vellore",
        location: "Vellore", startDate: "2017-07", endDate: "2021-05", gpa: "8.6",
        description: "Minor in statistics." },
    ],
    skills: [
      { id: "1", name: "SQL" }, { id: "2", name: "Python" }, { id: "3", name: "Pandas" },
      { id: "4", name: "Experiment design" }, { id: "5", name: "Tableau" },
      { id: "6", name: "dbt" },
    ],
    projects: [
      {
        id: "1", name: "Churn early-warning model",
        description:
          "Logistic model over 2.4M marketplace sessions that flags accounts likely to lapse " +
          "within 30 days, now wired into the retention team's weekly outreach list. Cut " +
          "false positives by a third against the rules-based system it replaced.",
        technologies: "Python, scikit-learn, dbt, Airflow", link: "",
      },
      {
        id: "2", name: "Pricing experiment platform",
        description:
          "Self-serve tool letting category managers launch and read price tests without an " +
          "analyst in the loop. Thirty-one experiments ran through it in its first quarter.",
        technologies: "Python, Streamlit, BigQuery", link: "",
      },
    ],
    certifications: [
      { id: "1", name: "Google Advanced Data Analytics", issuer: "Google", date: "2023-02",
        credentialId: "", link: "" },
      { id: "2", name: "AWS Certified Data Engineer, Associate", issuer: "Amazon Web Services",
        date: "2024-08", credentialId: "", link: "" },
    ],
  } as unknown as ResumeData;
}

const checks = (r: ResumeData) => computeStandardATSScoreReport(r).qualityChecks;

describe("a complete resume can reach full marks", () => {
  it("scores standard sections 100 without projects or certifications", () => {
    // Those two are good to have and are not standard sections. Requiring them capped an
    // otherwise complete resume at 67.
    const q = checks(completeResume());
    expect(q.sectionPresence.score).toBe(100);
    expect(q.sectionPresence.note).toContain("present");
  });

  it("scores contact 100 with email, phone, location and ONE link", () => {
    // Reaching 100 used to need LinkedIn and GitHub and a portfolio.
    expect(checks(completeResume()).contactCompleteness.score).toBe(100);
  });

  it("awards a full page 100, where the old band topped out at 90", () => {
    // Deliberately sized rather than realistic: `scoreLength` approximates a page as ~3000
    // characters of content, so this makes the band boundary explicit instead of hoping a
    // hand-written fixture lands the right side of it.
    const r = completeResume();
    const filler =
      "Rebuilt the weekly margin report so category leads could see contribution by SKU " +
      "rather than by department, which is how the loss-making bundle was finally spotted.";
    r.workExperience[0].description = Array.from({ length: 20 }, () => filler);
    const q = checks(r);
    expect(q.length.score).toBe(100);
    expect(q.length.note).toContain("appropriate");
  });

  it("calls a two-thirds-page resume a little short rather than failing it", () => {
    // The realistic fixture above is about 0.65 of a page. That is honestly "a bit short",
    // and the old scorer could not say so: everything from half a page to 2.2 pages was 90.
    const q = checks(completeResume());
    expect(q.length.score).toBe(80);
    expect(q.length.note).toContain("short");
  });

  it("scores consistent, current dates 100", () => {
    expect(checks(completeResume()).dateConsistency.score).toBe(100);
  });

  it("counts a role marked 'I currently work here' as current", () => {
    // The resume above has no end date on the current role - the normal way to write it, and
    // it used to contribute nothing toward recency.
    const r = completeResume();
    expect(r.workExperience[0].current).toBe(true);
    expect(r.workExperience[0].endDate).toBe("");
    expect(checks(r).dateConsistency.score).toBe(100);
  });
});

describe("and an incomplete one still cannot", () => {
  it("drops sections when a standard one is genuinely missing", () => {
    const r = completeResume();
    r.skills = [];
    const q = checks(r);
    expect(q.sectionPresence.score).toBe(75);
    expect(q.sectionPresence.note).toContain("skills");
  });

  it("drops contact when there is no link at all", () => {
    const r = completeResume();
    r.basicInfo.linkedin = "";
    const q = checks(r);
    expect(q.contactCompleteness.score).toBeLessThan(100);
    expect(q.contactCompleteness.note).toContain("LinkedIn");
  });

  it("scores a resume with NO dates badly, not middlingly", () => {
    // This is the failure that actually stops an ATS placing you in time, and it used to be
    // worth 50 - better than a resume whose dates were merely inconsistent.
    const r = completeResume();
    r.workExperience.forEach((w: WorkExperience) => { w.startDate = ""; w.endDate = ""; w.current = false; });
    r.education.forEach((e: Education) => { e.startDate = ""; e.endDate = ""; });
    const q = checks(r);
    expect(q.dateConsistency.score).toBe(20);
    expect(q.dateConsistency.score).toBeLessThan(55);
  });

  it("marks mixed date formats down but not out", () => {
    const r = completeResume();
    r.workExperience[1].startDate = "June 2021";
    const q = checks(r);
    expect(q.dateConsistency.score).toBeGreaterThan(20);
    expect(q.dateConsistency.score).toBeLessThan(100);
  });
});

describe("the overall score still discriminates", () => {
  it("does not pin thin resumes to one number", () => {
    // Six of the twelve resumes saved in production came out at exactly 30, because a thin
    // resume was clamped rather than scaled. A score that cannot tell two resumes apart is
    // not measuring either of them.
    const thin = completeResume();
    thin.workExperience = [];
    thin.education = [];
    thin.skills = [{ id: "1", name: "SQL" }] as ResumeData["skills"];

    const thinner = completeResume();
    thinner.workExperience = [];
    thinner.education = [];
    thinner.skills = [];
    thinner.basicInfo.summary = "";

    const a = computeStandardATSScoreReport(thin).overallScore;
    const b = computeStandardATSScoreReport(thinner).overallScore;
    expect(a).toBeGreaterThan(b);
  });

  it("still rates a complete resume far above a thin one", () => {
    const full = computeStandardATSScoreReport(completeResume()).overallScore;
    const thin = completeResume();
    thin.workExperience = [];
    expect(full).toBeGreaterThan(computeStandardATSScoreReport(thin).overallScore + 15);
  });
});
