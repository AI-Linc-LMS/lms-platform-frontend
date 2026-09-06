import { describe, expect, it } from "vitest";
import { isChipShaped, partitionSkillEntries } from "./content";

/**
 * "The 'What they're looking for' and 'Skills and stack' sections contain overlapping
 * information."
 *
 * Measured on the published fleet: of 254 jobs that render both sections, a mean 42.5% of the
 * skill chips restate the requirements prose, and on 24 of them it is 100%. Separately, 44 skill
 * entries across 28 jobs are whole sentences that render as paragraph-sized pills.
 *
 * The fixtures below are REAL prod rows, copied verbatim, not invented shapes.
 */

/** jobs_v2_jobdescription id=131, Sigmoid "DevOps Engineer - Jenkins to Harness Migration". */
const SIGMOID_MANDATORY = [
  "4–7 years of relevant work experience; a degree in Computer Science or a related technical discipline is required.",
  "Experience with Shell, Python, or other scripting languages.",
  "Experience managing Linux systems and working with build and release tools like Jenkins.",
  "Effective communication skills, both written and verbal.",
];
const SIGMOID_KEY = ["Python", "C", "R", "AWS", "Azure", "Jenkins", "CI/CD", "Linux"];
const SIGMOID_REQUIREMENTS = [...SIGMOID_MANDATORY];

/** id=15, IBN Technologies "Operations Executive Intern" — no requirements column at all. */
const IBN_SKILLS = [
  "Technical skills",
  "Basic understanding of:  Cloud Computing (Azure / AWS fundamentals)  Cyber Security concepts (SOC, VAPT, SIEM – basic awareness)  Good knowledge of MS Excel, PowerPoint, and documentation tools",
  "Strong communication and coordination skills",
  "Problem-solving mindset",
];

describe("isChipShaped", () => {
  it("accepts the one-to-three word labels that are 97.7% of the fleet", () => {
    for (const skill of ["Python", "CI/CD", "Node.js", "Design systems", "Data Structures"]) {
      expect(isChipShaped(skill), skill).toBe(true);
    }
  });

  it("rejects a sentence that was filed into a skills column", () => {
    expect(isChipShaped(SIGMOID_MANDATORY[0])).toBe(false);
    expect(isChipShaped(IBN_SKILLS[1])).toBe(false);
  });

  it("rejects a short string that still ends like a sentence", () => {
    expect(isChipShaped("Experience with Python.")).toBe(false);
  });

  it("keeps a six word skill, because the tail is thin and a chip is cheap", () => {
    expect(isChipShaped("Basic knowledge of Excel and Powerpoint")).toBe(true);
  });
});

describe("partitionSkillEntries", () => {
  it("does not render a chip that repeats a requirement bullet word for word", () => {
    // The actual complaint: id=131 stores its six requirement SENTENCES in mandatory_skills too,
    // so the card printed each one as a bullet and again as a pill.
    const { chips } = partitionSkillEntries(
      [...SIGMOID_MANDATORY, ...SIGMOID_KEY],
      SIGMOID_REQUIREMENTS,
    );
    expect(chips).toEqual(SIGMOID_KEY);
  });

  it("keeps a short skill even when the prose mentions it inside a sentence", () => {
    // "Python" must survive, though a requirement says "Experience with Shell, Python, ...".
    // The chip is scannable and carries the profile-match highlight; only a WHOLE-bullet
    // duplicate is telling the reader nothing new.
    const { chips } = partitionSkillEntries(["Python"], SIGMOID_REQUIREMENTS);
    expect(chips).toEqual(["Python"]);
  });

  it("promotes a sentence-shaped skill instead of dropping it", () => {
    // id=15 has NO requirements columns, so its only statement of these facts is the skills
    // array. Dropping them would delete the content off the page.
    const { chips, prose } = partitionSkillEntries(IBN_SKILLS, []);
    expect(chips).toEqual([
      "Technical skills",
      "Strong communication and coordination skills",
      "Problem-solving mindset",
    ]);
    expect(prose).toEqual([IBN_SKILLS[1]]);
  });

  it("does not promote a sentence that is already a requirement bullet", () => {
    const { chips, prose } = partitionSkillEntries(SIGMOID_MANDATORY, SIGMOID_REQUIREMENTS);
    expect(chips).toEqual([]);
    expect(prose).toEqual([]);
  });

  it("ignores blanks and whitespace-only entries", () => {
    const { chips, prose } = partitionSkillEntries(["", "   ", "Go"], []);
    expect(chips).toEqual(["Go"]);
    expect(prose).toEqual([]);
  });

  it("is case-insensitive about what counts as a duplicate", () => {
    const { chips } = partitionSkillEntries(["python"], ["Python"]);
    expect(chips).toEqual([]);
  });
});
