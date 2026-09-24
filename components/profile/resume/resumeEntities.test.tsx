/**
 * "Entering & in the content is being incorrectly rendered as &amp;, exposing the HTML entity."
 *
 * The editor stores what the browser serialises, which is HTML, so a typed "&" is stored as
 * "&amp;" - correctly. The renderer then printed any line without a b/i/u tag as plain text, so
 * the entity reached the page. These tests drive the REAL editor to get the stored value (no
 * hand-written "&amp;" standing in for it), then render every template with it.
 *
 * The other half of the contract is pinned too: a typed "<script>" must stay text. Decoding
 * entities before rendering would have fixed the ampersand by turning that into markup.
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RichTextInput from "./RichTextInput";
import ResumeRichText from "./ResumeRichText";
import { normalizeResumeLine, resumeTextOf, textToResumeHtml } from "./richText";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";
import type { ResumeData } from "./types";
import { AccentBarTemplate } from "./templates/AccentBarTemplate";
import { BubbleTemplate } from "./templates/BubbleTemplate";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { CreativeTemplate } from "./templates/CreativeTemplate";
import { ExecutiveTemplate } from "./templates/ExecutiveTemplate";
import { LuxSleekTemplate } from "./templates/LuxSleekTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { RightSidebarTemplate } from "./templates/RightSidebarTemplate";
import { TechnicalTemplate } from "./templates/TechnicalTemplate";
import { TwoColumnTemplate } from "./templates/TwoColumnTemplate";
import { WesternTemplate } from "./templates/WesternTemplate";

const TEMPLATES = [
  ["AccentBar", AccentBarTemplate],
  ["Bubble", BubbleTemplate],
  ["Classic", ClassicTemplate],
  ["Creative", CreativeTemplate],
  ["Executive", ExecutiveTemplate],
  ["LuxSleek", LuxSleekTemplate],
  ["Minimal", MinimalTemplate],
  ["Modern", ModernTemplate],
  ["RightSidebar", RightSidebarTemplate],
  ["Technical", TechnicalTemplate],
  ["TwoColumn", TwoColumnTemplate],
  ["Western", WesternTemplate],
] as const;

/** What the editor stores when the learner types `text`: the browser's own serialisation. */
function typeIntoEditor(text: string): string {
  const onChange = vi.fn();
  const { getByRole, unmount } = render(<RichTextInput value="" onChange={onChange} />);
  const box = getByRole("textbox");
  box.textContent = text;
  fireEvent.input(box);
  unmount();
  return onChange.mock.calls.at(-1)?.[0] as string;
}

const AMP = "Segmented health & wellness (FMCG) markets";
const BRACKETS = `Kept p95 < 200ms and error rate > 0.1% "quoted" 'single'`;
const SCRIPT = "Built a <script>alert(1)</script> sandbox";

function resumeWith(line: string): ResumeData {
  return {
    ...SAMPLE_RESUME_DATA,
    basicInfo: { ...SAMPLE_RESUME_DATA.basicInfo, summary: line },
    workExperience: [{ ...SAMPLE_RESUME_DATA.workExperience[0], description: [line] }],
    education: [{ ...SAMPLE_RESUME_DATA.education[0], description: line }],
    projects: [{ ...SAMPLE_RESUME_DATA.projects[0], description: line }],
  };
}

describe("what the editor stores", () => {
  it("escapes a typed & exactly once", () => {
    expect(typeIntoEditor(AMP)).toBe("Segmented health &amp; wellness (FMCG) markets");
  });

  it("escapes typed angle brackets and leaves quotes alone", () => {
    expect(typeIntoEditor(BRACKETS)).toBe(
      `Kept p95 &lt; 200ms and error rate &gt; 0.1% "quoted" 'single'`,
    );
  });
});

describe.each(TEMPLATES)("%s template", (_name, Template) => {
  it("shows a typed & as &, never as &amp;", () => {
    const { container } = render(<Template data={resumeWith(typeIntoEditor(AMP))} />);
    expect(container.textContent).toContain("health & wellness");
    expect(container.textContent).not.toContain("&amp;");
  });

  it("shows typed < > and quotes as themselves", () => {
    const { container } = render(<Template data={resumeWith(typeIntoEditor(BRACKETS))} />);
    expect(container.textContent).toContain(BRACKETS);
    expect(container.textContent).not.toMatch(/&(lt|gt|quot|#39);/);
  });

  it("keeps a typed <script> as text: nothing becomes markup", () => {
    const { container } = render(<Template data={resumeWith(typeIntoEditor(SCRIPT))} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });
});

describe("the Western summary", () => {
  it("draws formatting instead of printing its tags", () => {
    const data = resumeWith("x");
    data.basicInfo.summary = "<b>Led</b> R&amp;D for 3 years";
    const { container } = render(<WesternTemplate data={data} />);
    expect(container.querySelector("blockquote b")?.textContent).toBe("Led");
    expect(container.textContent).toContain("Led R&D for 3 years");
    expect(container.textContent).not.toContain("<b>");
  });
});

describe("ResumeRichText", () => {
  it("reads an entity-only line as HTML", () => {
    // A JS string on purpose: in a JSX attribute literal the compiler itself decodes "&amp;".
    const { container } = render(<ResumeRichText value={"health &amp; wellness"} />);
    expect(container.textContent).toBe("health & wellness");
  });

  it("still returns a plain line as bare text", () => {
    const { container } = render(<ResumeRichText value="Led a team of six" />);
    expect(container.innerHTML).toBe("Led a team of six");
  });
});

describe("text becomes HTML in one place", () => {
  it("escapes & < > once, and keeps a line break", () => {
    expect(textToResumeHtml("R&D <Button> > 5\nnext")).toBe("R&amp;D &lt;Button&gt; &gt; 5<br>next");
    expect(textToResumeHtml("a\r\nb")).toBe("a<br>b");
    expect(textToResumeHtml(undefined)).toBe("");
  });

  it("round-trips through the renderer to the text that went in", () => {
    const text = `R&D <Button> "q" 'a' 5 > 3`;
    const { container } = render(<ResumeRichText value={textToResumeHtml(text)} />);
    expect(container.textContent).toBe(text);
    expect(resumeTextOf(textToResumeHtml(text))).toBe(text);
  });
});

describe("a stored line of unknown format (saved resumes, AI rewrites)", () => {
  it("keeps what the editor wrote, including a literal &amp; already saved", () => {
    expect(normalizeResumeLine("health &amp; wellness")).toBe("health &amp; wellness");
    expect(normalizeResumeLine("<b>Led</b> R&amp;D")).toBe("<b>Led</b> R&amp;D");
    expect(normalizeResumeLine("p95 &lt; 200ms")).toBe("p95 &lt; 200ms");
  });

  it("escapes a line the old profile import copied in as plain text", () => {
    // The editor never writes a bare & or a raw < that is not its own tag.
    expect(normalizeResumeLine("R&D and P&L")).toBe("R&amp;D and P&amp;L");
    expect(normalizeResumeLine("Built reusable <Button> components")).toBe(
      "Built reusable &lt;Button&gt; components",
    );
  });

  it("is safe to apply twice", () => {
    for (const line of ["R&D <Button>", "health &amp; wellness", "<b>Led</b> & grew", "plain"]) {
      const once = normalizeResumeLine(line);
      expect(normalizeResumeLine(once)).toBe(once);
    }
  });

  it("sanitises a line with formatting, escaping its stray &", () => {
    expect(normalizeResumeLine("<b>Led</b> R&D")).toBe("<b>Led</b> R&amp;D");
  });
});
