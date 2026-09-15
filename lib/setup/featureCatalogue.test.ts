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
