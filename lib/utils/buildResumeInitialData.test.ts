import { describe, expect, it } from "vitest";

import type { UserProfile } from "@/lib/services/profile.service";
import { buildResumeInitialData } from "./buildResumeInitialData";

/**
 * "Use my profile": what a profile becomes in the resume builder.
 *
 * Reported: "Work experience entered as a paragraph in the profile is carried over as a single
 * paragraph when the profile is used to populate a resume, instead of being formatted as separate
 * bullet points." The mapping was `description.split("\n")`.
 */

const base = {
  first_name: "Ada",
  last_name: "L",
  email: "a@x.com",
  username: "ada",
  profile_picture: "",
  phone_number: "",
  bio: null,
  social_links: {},
  date_of_birth: null,
} as unknown as UserProfile;

const entry = (over: Record<string, unknown>) => ({
  id: "e1",
  company: "Acme",
  position: "Product Manager",
  start_date: "2024-01-01",
  current: true,
  ...over,
});

const bulletsOf = (profile: Partial<UserProfile>) =>
  buildResumeInitialData({ ...base, ...profile } as UserProfile).workExperience?.map((w) => w.description);

describe("work experience becomes one bullet per point", () => {
  it("uses the stored points, one bullet each", () => {
    expect(bulletsOf({ experience: [entry({ highlights: ["Managed timelines", "Engaged with clients"] })] })).toEqual([
      ["Managed timelines", "Engaged with clients"],
    ]);
  });

  it("splits a legacy paragraph of inline bullets instead of keeping it as one", () => {
    expect(
      bulletsOf({
        experience: [
          entry({ description: "• Managed product timelines… • Engaged with clients… • Created walkthroughs…" }),
        ],
      }),
    ).toEqual([["Managed product timelines…", "Engaged with clients…", "Created walkthroughs…"]]);
  });

  it("drops the typed markers a legacy list carried, so no bullet is drawn twice", () => {
    expect(
      bulletsOf({ experience: [entry({ description: "• Managed timelines \n• Engaged with clients" })] }),
    ).toEqual([["Managed timelines", "Engaged with clients"]]);
  });

  it("keeps a legacy prose paragraph as one bullet rather than chopping its sentences", () => {
    const paragraph = "Led the payments team. Shipped three launches. Cut churn by 5%.";
    expect(bulletsOf({ experience: [entry({ description: paragraph })] })).toEqual([[paragraph]]);
  });
});

describe("profile text is escaped once as it becomes resume HTML", () => {
  it("escapes & and < in every rich field", () => {
    const out = buildResumeInitialData({
      ...base,
      bio: "R&D lead.\nBuilt <Button> kits.",
      experience: [entry({ highlights: ["Segmented health & wellness (FMCG)"] })],
      education: [{ id: "d1", institution: "IIT", degree: "B.Tech", description: "Top 5% & medal" }],
      projects: [{ id: "p1", name: "Kit", description: "A <Modal> & a <Toast>", technologies: [] }],
    } as unknown as UserProfile);

    expect(out.basicInfo?.summary).toBe("R&amp;D lead.<br>Built &lt;Button&gt; kits.");
    expect(out.workExperience?.[0].description).toEqual(["Segmented health &amp; wellness (FMCG)"]);
    expect(out.education?.[0].description).toBe("Top 5% &amp; medal");
    expect(out.projects?.[0].description).toBe("A &lt;Modal&gt; &amp; a &lt;Toast&gt;");
  });

  it("leaves the plain fields plain: names, titles and companies are not HTML", () => {
    const out = buildResumeInitialData({
      ...base,
      headline: "R&D Engineer",
      experience: [entry({ company: "P&G", highlights: ["x"] })],
    } as unknown as UserProfile);
    expect(out.basicInfo?.professionalTitle).toBe("R&D Engineer");
    expect(out.workExperience?.[0].company).toBe("P&G");
  });
});

describe("one way only", () => {
  it("does not touch the profile it reads from", () => {
    const profile = Object.freeze({
      ...base,
      bio: "R&D",
      experience: Object.freeze([Object.freeze(entry({ description: "• A\n• B" }))]),
    }) as unknown as UserProfile;
    const before = JSON.stringify(profile);
    buildResumeInitialData(profile);
    expect(JSON.stringify(profile)).toBe(before);
  });
});
