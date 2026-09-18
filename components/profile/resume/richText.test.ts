import { describe, expect, it } from "vitest";

import { computeATSScore } from "./atsScore";
import { computeStandardATSScoreReport } from "./atsStandardReport";
import { hasResumeMarkup, plainTextResume, resumeTextOf, sanitizeResumeHtml } from "./richText";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";
import type { ResumeData } from "./types";

/**
 * Formatting was added to a string that four other systems already read.
 *
 * The feature itself is three tags. The risk is entirely in what else consumes the same field: two
 * ATS scorers and a quick-fix checker that between them measure lengths, match keywords and test
 * whether a bullet opens with an action verb. A resume that scored 78 before the user bolded a
 * word and 61 afterwards would be a worse bug than the missing button.
 */

describe("sanitizeResumeHtml", () => {
  it("keeps the three tags the toolbar produces", () => {
    expect(sanitizeResumeHtml("<b>Led</b> a <i>small</i> <u>team</u>"))
      .toBe("<b>Led</b> a <i>small</i> <u>team</u>");
  });

  it("keeps the tags a paste produces", () => {
    expect(sanitizeResumeHtml("<strong>Led</strong> <em>six</em>"))
      .toBe("<strong>Led</strong> <em>six</em>");
  });

  it("drops a script, contents and all", () => {
    expect(sanitizeResumeHtml("Hi<script>alert(1)</script> there")).toBe("Hi there");
  });

  it("drops an event handler by dropping every attribute", () => {
    const out = sanitizeResumeHtml('<b onclick="steal()" style="font-size:40px">Led</b>');
    expect(out).toBe("<b>Led</b>");
  });

  it("drops a tag that is not on the list but keeps its words", () => {
    expect(sanitizeResumeHtml('<a href="http://evil">Led</a> a team')).toBe("Led a team");
    expect(sanitizeResumeHtml("<h1>Led</h1>")).toBe("Led");
  });

  it("turns the styled span a browser emits back into a tag", () => {
    // execCommand with styleWithCSS on, and everything pasted out of Word or Google Docs.
    expect(sanitizeResumeHtml('<span style="font-weight: 700">Led</span>')).toBe("<b>Led</b>");
    expect(sanitizeResumeHtml('<span style="font-style: italic">Led</span>')).toBe("<i>Led</i>");
    expect(sanitizeResumeHtml('<span style="text-decoration: underline">Led</span>'))
      .toBe("<u>Led</u>");
  });

  it("leaves a plain bullet exactly as it was", () => {
    const plain = "Reduced API p95 latency from 800ms to 120ms";
    expect(sanitizeResumeHtml(plain)).toBe(plain);
    expect(hasResumeMarkup(plain)).toBe(false);
  });

  it("does not let a typed angle bracket become a tag", () => {
    expect(sanitizeResumeHtml("Cut cost <b>40%</b> when p95 < 200ms"))
      .toBe("Cut cost <b>40%</b> when p95 &lt; 200ms");
  });
});

describe("resumeTextOf", () => {
  it("reads a formatted bullet as its words", () => {
    expect(resumeTextOf("<b>Led</b> a team of <i>six</i>")).toBe("Led a team of six");
  });

  it("does not glue two lines together", () => {
    expect(resumeTextOf("Shipped it<br>On time")).toBe("Shipped it On time");
  });

  it("gives back the characters an escaped bracket stands for", () => {
    expect(resumeTextOf("p95 &lt; 200ms &amp; rising")).toBe("p95 < 200ms & rising");
  });
});

describe("the scorers cannot see formatting", () => {
  /**
   * These cases are chosen so that the RAW string and the stripped one land on opposite sides of
   * a real rule. A test that merely bolds a long bullet passes either way, and would have let the
   * boundary be deleted without a word.
   */
  const withBullets = (bullets: string[]): ResumeData => ({
    ...SAMPLE_RESUME_DATA,
    workExperience: [{ ...SAMPLE_RESUME_DATA.workExperience[0], description: bullets }],
  });

  it("does not count a short bullet as substantial just because it is bold", () => {
    // 25 characters of text; 32 with the tags, which clears the 30-character bar on its own.
    const plain = withBullets(["Did some work on the API"]);
    const bolded = withBullets(["<b>Did some work on the API</b>"]);
    expect(computeATSScore(bolded, "").breakdown.format)
      .toBe(computeATSScore(plain, "").breakdown.format);
  });

  it("matches a keyword the user bolded half of", () => {
    // Bolding a prefix is ordinary: "Terraform" with "Terra" picked out. Unstripped, the keyword
    // extractor splits the word on the tag and it disappears from the resume entirely.
    // The term appears nowhere else in the sample, so this can only match through the bullet.
    const jd = "We need someone who has run Terraform in production.";
    const split = withBullets(["<b>Terra</b>form across the whole service estate"]);
    expect(computeATSScore(split, jd).matchedKeywords).toContain("terraform");
  });

  it("still sees an action verb at the start of a bolded bullet", () => {
    const line = "development of a payments service used by 1M+ people every day";
    const plain = withBullets([`Led ${line}`]);
    const bolded = withBullets([`<b>Led</b> ${line}`]);
    expect(computeStandardATSScoreReport(bolded).qualityChecks.bulletQuality.score)
      .toBe(computeStandardATSScoreReport(plain).qualityChecks.bulletQuality.score);
  });

  it("does not credit a summary for the length of its tags", () => {
    // 73 characters of summary, 80 with the tags - and 80 is a scoring threshold.
    const short = "Engineer with five years of experience building web services for fintech.";
    expect(short.length).toBeLessThan(80);
    expect(`<b>${short}</b>`.length).toBeGreaterThanOrEqual(80);
    const plain = { ...SAMPLE_RESUME_DATA, basicInfo: { ...SAMPLE_RESUME_DATA.basicInfo, summary: short } };
    const bolded = { ...plain, basicInfo: { ...plain.basicInfo, summary: `<b>${short}</b>` } };
    expect(computeATSScore(bolded, "").breakdown.contentDepth)
      .toBe(computeATSScore(plain, "").breakdown.contentDepth);
  });

  it("still sees a long bullet as long", () => {
    // The tags are 7 characters. A 30-character rule applied to the raw string would let a
    // 25-character bullet pass just for being bold.
    const short = "<b>Did some work here</b>";
    expect(resumeTextOf(short).length).toBe("Did some work here".length);
  });
});

describe("plainTextResume", () => {
  it("strips every free-text field and leaves the rest alone", () => {
    const data = {
      ...SAMPLE_RESUME_DATA,
      basicInfo: { ...SAMPLE_RESUME_DATA.basicInfo, summary: "<b>Engineer</b>" },
      education: SAMPLE_RESUME_DATA.education.map((e) => ({ ...e, description: "<i>Dean's list</i>" })),
      projects: SAMPLE_RESUME_DATA.projects.map((p) => ({ ...p, description: "<u>Built it</u>" })),
    };
    const plain = plainTextResume(data);
    expect(plain.basicInfo.summary).toBe("Engineer");
    expect(plain.education[0].description).toBe("Dean's list");
    expect(plain.projects[0].description).toBe("Built it");
    // Untouched fields survive: this is the object every scorer then reads.
    expect(plain.basicInfo.email).toBe(data.basicInfo.email);
    expect(plain.skills).toEqual(data.skills);
  });

  it("survives a resume with nothing in it", () => {
    const empty = {
      basicInfo: { summary: "" }, workExperience: [], education: [],
      skills: [], projects: [], certifications: [],
    } as unknown as ResumeData;
    expect(() => plainTextResume(empty)).not.toThrow();
  });
});
