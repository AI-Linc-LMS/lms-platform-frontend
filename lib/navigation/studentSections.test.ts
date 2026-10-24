import { describe, expect, it } from "vitest";
import {
  STUDENT_SECTIONS,
  STUDENT_STANDALONE_TOP,
  STUDENT_STANDALONE_BOTTOM,
  STUDENT_NAV_ITEMS,
} from "./navModel";

/**
 * Where a learner's nav puts things, now that the course carries the lot.
 *
 * The course page holds the AI Tutor, an assessment per module, the mock interview, the
 * certificate and the jobs it leads to. A sidebar listing those as five more destinations under
 * "Learn" described an older product and sent learners hunting in a menu for what was already
 * in front of them.
 *
 * The invariant that matters most here is the last one: moving a feature between sections is
 * one edit away from deleting it from the nav entirely, and nothing would say so.
 */

const sectionFor = (feature: string) =>
  STUDENT_SECTIONS.find((s) => s.itemFeatures.includes(feature))?.id;

describe("the learner's sidebar", () => {
  it("puts only the course under Learn", () => {
    const learn = STUDENT_SECTIONS.find((s) => s.id === "learn");
    expect(learn?.itemFeatures).toEqual(["course", "adaptive_quiz"]);
  });

  it("moves the tutor, standalone papers and roadmaps to Practice", () => {
    expect(sectionFor("ai_voice_tutor")).toBe("practice");
    expect(sectionFor("assessment")).toBe("practice");
    expect(sectionFor("roadmaps")).toBe("practice");
  });

  it("files certificates under Career, where the jobs and the resume are", () => {
    // A credential is not something you learn, it is something you show. The course page says
    // as much: "verifiable, shareable, and shown to recruiters in Jobs".
    expect(sectionFor("certificates")).toBe("career");
  });

  it("leaves Engage alone", () => {
    const engage = STUDENT_SECTIONS.find((s) => s.id === "engage");
    expect(engage?.itemFeatures).toEqual(["live_sessions", "community_forum"]);
  });

  it("gives every section a distinct id and a translation key", () => {
    const ids = STUDENT_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of STUDENT_SECTIONS) {
      expect(s.labelKey).toBe(`navSection.${s.id}`);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.icon).toMatch(/^mdi:/);
    }
  });

  it("lists no feature in two sections at once", () => {
    const all = STUDENT_SECTIONS.flatMap((s) => s.itemFeatures);
    expect(new Set(all).size).toBe(all.length);
  });

  it("leaves no nav item homeless", () => {
    // THE one that matters. Moving a feature out of a section and forgetting to land it
    // somewhere removes that item from the sidebar with nothing to say so. Every student nav
    // item must be in a section or deliberately standalone.
    const housed = new Set([
      ...STUDENT_SECTIONS.flatMap((s) => s.itemFeatures),
      ...STUDENT_STANDALONE_TOP,
      ...STUDENT_STANDALONE_BOTTOM,
    ]);
    const homeless = STUDENT_NAV_ITEMS
      .map((i) => i.featureName)
      .filter((f) => !housed.has(f));
    expect(homeless).toEqual([]);
  });

  it("houses the v2 mock interview, which had no section at all", () => {
    // Found by the homeless check below. `interview_realtime` was in no section, so the 832
    // students on tenants that have the v2 flag and not the legacy one (Impacteers 434,
    // Agileology 396, Capabl Labs 2) held the feature with no way to reach it from the nav.
    expect(sectionFor("interview_realtime")).toBe("career");
  });

  it("lists no section feature that no nav item carries, beyond the one known orphan", () => {
    // The mirror of the homeless check above, and the half it cannot see. `mock_interview` sat
    // in Career after the standalone mock interview was retired and its nav entry deleted: a
    // section row for a product with no door, which reads as a live module to the next person
    // editing this file.
    //
    // `course` is named rather than fixed: it is the retiring classic catalogue, whose learner
    // nav entry went before this change, and taking it out of Learn is that retirement's call to
    // make, not this one's. Naming it keeps the check live - a NEW orphan still fails here.
    const owned = new Set(STUDENT_NAV_ITEMS.flatMap((i) => [i.featureName, ...(i.featureNamesAny ?? [])]));
    const orphaned = STUDENT_SECTIONS.flatMap((s) => s.itemFeatures).filter((f) => !owned.has(f));
    expect(orphaned.sort()).toEqual(["course"]);
  });

  it("keeps the retired standalone mock interview out of the learner's nav entirely", () => {
    expect(sectionFor("mock_interview")).toBeUndefined();
    expect(STUDENT_NAV_ITEMS.map((i) => i.featureName)).not.toContain("mock_interview");
    expect(STUDENT_NAV_ITEMS.map((i) => i.path)).not.toContain("/mock-interview");
  });

  it("still houses everything it housed before the move", () => {
    // The four that left Learn are reachable, just not from there.
    for (const f of ["assessment", "certificates", "roadmaps", "ai_voice_tutor"]) {
      expect(sectionFor(f), `${f} lost its section`).toBeTruthy();
    }
  });
});
