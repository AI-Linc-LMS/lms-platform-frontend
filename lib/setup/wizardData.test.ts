import { describe, expect, it } from "vitest";
import { withoutClassicCourseImport, type WizardData } from "./wizardData";

describe("withoutClassicCourseImport", () => {
  it("turns a saved import into skip and drops the picked classic course ids", () => {
    const draft: WizardData = {
      welcome: { confirmed_org_name: "Acme" },
      features: { selected_feature_ids: [4, 9] },
      course_library: {
        choice: "import",
        selected_course_ids: [11, 12, 13, 14, 15],
        selected_course_titles: ["a", "b", "c", "d", "e"],
      },
    };

    expect(withoutClassicCourseImport(draft)).toEqual({
      welcome: { confirmed_org_name: "Acme" },
      features: { selected_feature_ids: [4, 9] },
      course_library: { choice: "skip" },
    });
  });

  it("gives a draft that never reached the step the only choice there is", () => {
    expect(withoutClassicCourseImport({}).course_library).toEqual({ choice: "skip" });
  });

  it("leaves a draft that already skipped untouched", () => {
    const draft: WizardData = { course_library: { choice: "skip" } };
    expect(withoutClassicCourseImport(draft)).toBe(draft);
  });
});
