import { describe, expect, it } from "vitest";
import {
  applySectionLayout,
  EMPTY_LAYOUT,
  moveSection,
  normalizeLayout,
  readDocumentSections,
  resolveOrder,
  setColumn,
  toggleHidden,
  type ResumeLayout,
  type SectionId,
} from "./sectionLayout";

/**
 * "[Resume Builder] No option for reordering the sections."
 *
 * The old code had a sectionOrder state and three drag handlers in the form, and a SectionManager
 * component with a full drag UI. Nothing rendered a handle, nothing imported SectionManager, and
 * nothing read the order: on the live site, dragging a section changed neither the form nor the
 * preview. These tests are against the thing that actually moves the sections - the document.
 */

const SECTIONS = ["summary", "workExperience", "education", "skills", "projects", "certifications"] as const;

/** A two-column template: a sidebar and a main column, each with its own sections. */
function twoColumnDoc(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <div data-resume-column="side">
      <div id="contact">contact</div>
      <div data-resume-section="skills">skills</div>
      <div data-resume-section="certifications">certifications</div>
    </div>
    <div data-resume-column="main">
      <div id="header">name<div data-resume-section="summary">summary</div></div>
      <div data-resume-section="workExperience">work</div>
      <div data-resume-section="education">education</div>
      <div data-resume-section="projects">projects</div>
    </div>`;
  document.body.appendChild(root);
  return root;
}

const idsIn = (root: HTMLElement, column?: string) =>
  Array.from(
    (column ? root.querySelector(`[data-resume-column="${column}"]`)! : root).querySelectorAll("[data-resume-section]"),
  ).map((el) => (el as HTMLElement).dataset.resumeSection);

const layoutWith = (over: Partial<ResumeLayout>): ResumeLayout => ({ ...EMPTY_LAYOUT, ...over });

describe("reading what a template already does", () => {
  it("reports each section's order and column", () => {
    const doc = readDocumentSections(twoColumnDoc());
    expect(doc.order).toEqual(["skills", "certifications", "summary", "workExperience", "education", "projects"]);
    expect(doc.columns).toMatchObject({ skills: "side", summary: "main", projects: "main" });
    expect(doc.hasColumns).toBe(true);
  });
});

describe("the order belongs to the learner, not to the template", () => {
  it("leaves every template exactly as written until something is arranged", () => {
    const root = twoColumnDoc();
    const before = idsIn(root);
    applySectionLayout(root, EMPTY_LAYOUT, "modern");
    expect(idsIn(root)).toEqual(before);
  });

  it("reorders within a column and leaves the pinned blocks alone", () => {
    const root = twoColumnDoc();
    applySectionLayout(root, layoutWith({ order: ["certifications", "skills", "projects", "education", "workExperience", "summary"] }), "modern");
    expect(idsIn(root, "side")).toEqual(["certifications", "skills"]);
    expect(idsIn(root, "main")).toEqual(["projects", "education", "workExperience", "summary"]);
    // The contact block is not a section and must not be shuffled with them.
    expect(root.querySelector('[data-resume-column="side"]')!.firstElementChild!.id).toBe("contact");
  });

  it("keeps the order when the learner switches template, dropping sections that template lacks", () => {
    const order: SectionId[] = ["projects", "skills", "summary", "workExperience", "education", "certifications"];
    // Two Column has no summary at all.
    expect(resolveOrder(layoutWith({ order }), ["workExperience", "education", "skills", "projects", "certifications"]))
      .toEqual(["projects", "skills", "workExperience", "education", "certifications"]);
  });

  it("lifts a section out of a block it was nested in, so it can be ordered at all", () => {
    // Modern, Right Sidebar and Creative all write the summary inside the name header, where it has
    // no siblings to be ordered against: "move down" did nothing.
    const root = twoColumnDoc();
    applySectionLayout(root, layoutWith({ order: ["workExperience", "summary", "education", "projects", "skills", "certifications"] }), "modern");
    expect(idsIn(root, "main")).toEqual(["workExperience", "summary", "education", "projects"]);
    expect(root.querySelector("#header")!.querySelector("[data-resume-section]")).toBeNull();
  });

  it("moves every block of a section that is written in more than one piece", () => {
    // Western and Two Column both split skills into a list and a levels block.
    const root = document.createElement("div");
    root.innerHTML = `
      <div data-resume-column="main">
        <div data-resume-section="workExperience">work</div>
        <div data-resume-section="skills">skills</div>
        <div data-resume-section="education">education</div>
        <div data-resume-section="skills">skill levels</div>
      </div>`;
    document.body.appendChild(root);
    applySectionLayout(root, layoutWith({ order: ["skills", "workExperience", "education", "summary", "projects", "certifications"] }), "western");
    expect(idsIn(root, "main")).toEqual(["skills", "skills", "workExperience", "education"]);
  });
});

describe("hiding a section", () => {
  it("takes it off the page without touching the learner's data", () => {
    const root = twoColumnDoc();
    applySectionLayout(root, layoutWith({ hidden: ["projects", "skills"] }), "modern");
    expect(idsIn(root)).toEqual(["certifications", "summary", "workExperience", "education"]);
  });
});

describe("moving a section to the other column", () => {
  it("puts it in the column that was asked for", () => {
    const root = twoColumnDoc();
    applySectionLayout(root, layoutWith({ columns: { modern: { workExperience: "side" } } }), "modern");
    expect(idsIn(root, "side")).toContain("workExperience");
    expect(idsIn(root, "main")).not.toContain("workExperience");
  });

  it("is remembered per template, because columns belong to the template", () => {
    const layout = setColumn(EMPTY_LAYOUT, "modern", "skills", "main");
    const root = twoColumnDoc();
    applySectionLayout(root, layout, "classic");
    expect(idsIn(root, "side")).toContain("skills");
  });
});

describe("the arrangement survives being stored and read back", () => {
  it("drops ids it does not recognise and keeps the rest in order", () => {
    const layout = normalizeLayout({ v: 1, order: ["projects", "nonsense", "skills"], hidden: ["bogus", "skills"], columns: { modern: { skills: "nowhere", projects: "side" } } });
    expect(layout.order!.slice(0, 2)).toEqual(["projects", "skills"]);
    expect(layout.order).toHaveLength(SECTIONS.length);
    expect(layout.hidden).toEqual(["skills"]);
    expect(layout.columns).toEqual({ modern: { projects: "side" } });
  });

  it("never throws on rubbish", () => {
    for (const input of [null, undefined, 7, "x", [], { order: "no" }, { columns: 5 }]) {
      expect(() => normalizeLayout(input)).not.toThrow();
    }
    expect(normalizeLayout(null).order).toBeNull();
  });

  it("appends anything a stored order never mentioned, rather than losing it", () => {
    const layout = normalizeLayout({ order: ["projects"] });
    expect(layout.order).toHaveLength(SECTIONS.length);
    expect(layout.order![0]).toBe("projects");
  });
});

describe("the moves the panel makes", () => {
  const order: SectionId[] = [...SECTIONS];

  it("moves a section one place", () => {
    expect(moveSection(EMPTY_LAYOUT, order, "education", -1).order).toEqual([
      "summary", "education", "workExperience", "skills", "projects", "certifications",
    ]);
  });

  it("does nothing at either end", () => {
    expect(moveSection(EMPTY_LAYOUT, order, "summary", -1)).toEqual(EMPTY_LAYOUT);
    expect(moveSection(EMPTY_LAYOUT, order, "certifications", 1)).toEqual(EMPTY_LAYOUT);
  });

  it("toggles hidden both ways", () => {
    const hiddenOnce = toggleHidden(EMPTY_LAYOUT, "skills");
    expect(hiddenOnce.hidden).toEqual(["skills"]);
    expect(toggleHidden(hiddenOnce, "skills").hidden).toEqual([]);
  });
});
