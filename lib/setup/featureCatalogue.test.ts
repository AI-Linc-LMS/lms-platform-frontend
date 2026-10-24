import { describe, expect, it } from "vitest";
import {
  adminEntries,
  learnerEntries,
  learnerKeyForAdmin,
  lookupFeatureByKey,
  pairedKeys,
} from "./featureCatalogue";

/**
 * What a tenant launched through the setup wizard can switch on for courses.
 *
 * The wizard used to offer only `course`, the classic catalogue being retired. Every tenant it
 * launched was therefore classic-only by construction: no adaptive courses, no Courses nav once
 * the classic key is removed, and no course builder for its admins.
 */
describe("setup wizard feature catalogue: courses", () => {
  const learnerKeys = () => learnerEntries().map((e) => e.key);
  const adminKeys = () => adminEntries().map((e) => e.key);

  it("offers Courses as the adaptive key, and no longer offers the classic `course` card", () => {
    expect(learnerKeys()).toContain("adaptive_quiz");
    expect(learnerKeys()).not.toContain("course");
    expect(lookupFeatureByKey("adaptive_quiz")?.label).toBe("Courses");
  });

  it("offers the course builder to admins", () => {
    expect(adminKeys()).toContain("admin_adaptive_quizzes");
    expect(learnerKeyForAdmin("admin_adaptive_quizzes")).toBe("adaptive_quiz");
  });

  it("turning Courses on switches on everything a working course needs", () => {
    // Coding and video are content types inside a course; without them those steps vanish.
    expect(pairedKeys("adaptive_quiz")).toEqual(
      expect.arrayContaining([
        "adaptive_quiz",
        "admin_adaptive_quizzes",
        "adaptive_coding",
        "adaptive_video",
        "admin_manage_students",
        "admin_dashboard",
      ]),
    );
    expect(pairedKeys("adaptive_quiz")).not.toContain("course");
  });

  it("the retired `course` key owns no other feature", () => {
    // A hidden parent that still listed children would hijack them: toggling Student management
    // would resolve to the invisible classic card instead of Courses.
    expect(pairedKeys("course")).toEqual(["course"]);
    expect(learnerKeyForAdmin("admin_manage_students")).toBe("adaptive_quiz");
    expect(learnerKeyForAdmin("admin_dashboard")).toBe("adaptive_quiz");
  });
});

/**
 * The standalone mock interview is retired for every tenant. The wizard is the one place that
 * would still have handed a BRAND NEW tenant a switch for it, and it is the only surface where
 * switching the interview admin tools on also switched the dead learner key on.
 */
describe("setup wizard feature catalogue: the retired mock interview", () => {
  const learnerKeys = () => learnerEntries().map((e) => e.key);
  const adminKeys = () => adminEntries().map((e) => e.key);

  it("no longer offers a new tenant the standalone mock interview", () => {
    expect(learnerKeys()).not.toContain("mock_interview");
    // Still resolvable by name, because 14 tenants hold the row and the wizard reads API rows
    // against this catalogue - an unknown key would render as a bare name.
    expect(lookupFeatureByKey("mock_interview")?.visibility).toBe("deprecated");
  });

  it("keeps offering the interview ADMIN tools, where the surviving rounds are built", () => {
    expect(adminKeys()).toContain("admin_mock_interview");
  });

  it("the retired key owns no other feature, so the admin tools toggle alone", () => {
    // A hidden parent that still listed children would hijack them: switching the interview
    // admin tools on would also switch this dead learner key on for a brand new tenant.
    expect(pairedKeys("mock_interview")).toEqual(["mock_interview"]);
    expect(pairedKeys("admin_mock_interview")).toEqual(["admin_mock_interview"]);
    expect(learnerKeyForAdmin("admin_mock_interview")).toBeUndefined();
  });
});
