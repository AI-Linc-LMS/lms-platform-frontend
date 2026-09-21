/**
 * The resume builder's phone pass must leave desktop exactly as it was.
 *
 * Two ways it did not, both caught in review:
 *
 * - The delete/minus buttons in the form and the move/column buttons in the arrange panel got
 *   `width: { xs: 44, sm: 34 }` and `{ xs: 40, sm: 30 }`. A `size="small"` IconButton is 30px
 *   (20px icon) or 28/27px (18/17px icon) on its own, so the `sm` half of each made every desktop
 *   button bigger. The phone sizes now live only inside the phone media query, and the desktop CSS
 *   for those buttons sets no width or height at all.
 * - The tailor dialog stayed a centred md Dialog on a phone, opened on top of the ATS bottom sheet.
 *   It is a sheet there now, and the ORIGINAL Dialog markup above `sm`.
 *
 * jsdom cannot lay anything out, but it does parse the CSS emotion emits, which is enough to say
 * which rules exist and under which media query.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

import { ResumeForm } from "./ResumeForm";
import { SectionArrangePanel } from "./SectionArrangePanel";
import { SectionTailorButton } from "./SectionTailorButton";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";
import { EMPTY_LAYOUT } from "./paging/sectionLayout";

const PHONE_QUERY = /max-width:\s*599\.95px/;

/** The declarations emotion emitted for this element, split by whether they apply on a phone only. */
function emittedCss(el: Element): { phone: string; everywhereElse: string } {
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-"));
  const hits = (selector: string) => classes.some((c) => selector.includes(`.${c}`));
  let phone = "";
  let everywhereElse = "";
  const walk = (rules: CSSRuleList, media: string | null) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, rule.media.mediaText);
      } else if (rule instanceof CSSStyleRule && hits(rule.selectorText)) {
        if (media && PHONE_QUERY.test(media)) phone += rule.cssText;
        else everywhereElse += rule.cssText;
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules, null);
  return { phone, everywhereElse };
}

function setViewport(phone: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: phone ? /max-width/.test(query) : /min-width/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("ResumeForm delete buttons", () => {
  it("are 44px on a phone and carry no size of their own anywhere else", () => {
    const data = {
      ...SAMPLE_RESUME_DATA,
      // At least one of every repeating section, so every delete/minus button renders.
      workExperience: [{ ...SAMPLE_RESUME_DATA.workExperience[0], description: ["One", "Two"] }],
    };
    const { container } = render(<ResumeForm resumeData={data} setResumeData={() => {}} />);
    const buttons = Array.from(container.querySelectorAll(".MuiIconButton-sizeSmall")).filter((b) =>
      /var\(--error-500\)/.test(emittedCss(b).everywhereElse),
    );
    // Work experience, its bullets, education, skills, projects, certifications.
    expect(buttons.length).toBeGreaterThanOrEqual(6);
    for (const b of buttons) {
      const css = emittedCss(b);
      expect(css.phone).toMatch(/width:\s*44px/);
      expect(css.phone).toMatch(/height:\s*44px/);
      expect(css.everywhereElse).not.toMatch(/(^|[;{\s])width:/);
      expect(css.everywhereElse).not.toMatch(/(^|[;{\s])height:/);
    }
  });
});

describe("SectionArrangePanel controls", () => {
  it("are 40px on a phone and carry no size of their own anywhere else", () => {
    render(
      <SectionArrangePanel
        layout={EMPTY_LAYOUT}
        onChange={() => {}}
        onReset={() => {}}
        sections={{ order: ["summary", "skills"], columns: { summary: "main", skills: "side" }, hasColumns: true }}
        template="modern"
        counts={{ summary: 1, skills: 2 }}
      />,
    );
    const controls = screen.getAllByRole("button", { name: /^Move /, hidden: true });
    // Up, down and column for each of the two sections.
    expect(controls.length).toBe(6);
    for (const b of controls) {
      const css = emittedCss(b);
      expect(css.phone).toMatch(/width:\s*40px/);
      expect(css.phone).toMatch(/height:\s*40px/);
      expect(css.everywhereElse).not.toMatch(/(^|[;{\s])width:/);
      expect(css.everywhereElse).not.toMatch(/(^|[;{\s])height:/);
    }
  });
});

describe("SectionTailorButton dialog", () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  const open = () => {
    render(<SectionTailorButton section="summary" resumeData={SAMPLE_RESUME_DATA} onResumeChange={() => {}} variant="button" />);
    fireEvent.click(screen.getByRole("button", { name: /improve summary/i }));
  };

  describe("on a phone", () => {
    beforeEach(() => setViewport(true));

    it("is a bottom sheet with a real close target, not a centred dialog", () => {
      open();
      expect(screen.getByTestId("section-tailor-sheet")).toBeTruthy();
      expect(document.querySelector(".MuiDrawer-paper")).toBeTruthy();
      expect(document.querySelector(".MuiDialog-paper")).toBeNull();
      // The sheet's own 40px close in the header, and the Close action pinned in its footer.
      expect(screen.getAllByRole("button", { name: /^close$/i })).toHaveLength(2);
      expect(document.querySelector(".MuiDrawer-paper .MuiDialogTitle-root")).toBeNull();
      expect(screen.getByRole("button", { name: /generate/i })).toBeTruthy();
    });
  });

  describe("on a desktop", () => {
    beforeEach(() => setViewport(false));

    it("is the original centred Dialog, title and dividers and all", () => {
      open();
      expect(document.querySelector(".MuiDialog-paper")).toBeTruthy();
      expect(document.querySelector(".MuiDrawer-paper")).toBeNull();
      expect(screen.queryByTestId("section-tailor-sheet")).toBeNull();
      expect(document.querySelector(".MuiDialogTitle-root")?.textContent).toMatch(/improve your summary/i);
      expect(document.querySelector(".MuiDialogContent-dividers")).toBeTruthy();
      expect(document.querySelector(".MuiDialogActions-root")).toBeTruthy();
    });
  });
});
