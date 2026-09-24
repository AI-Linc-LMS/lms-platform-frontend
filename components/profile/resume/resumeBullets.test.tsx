/**
 * One bullet per point, in every template, and a pasted list stays a list.
 *
 * The resume side of "work experience lands in the resume as one paragraph":
 *   - TwoColumn joined a role's points with ". " into a single justified paragraph, so separate
 *     achievements came out as one run-on block whatever the profile held;
 *   - pasting a bulleted list into one Job Description point put every item into that one point,
 *     the "• Managed… • Engaged… • Created…" run in the report's screenshot.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

import RichTextInput from "./RichTextInput";
import { ResumeForm } from "./ResumeForm";
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

const POINTS = [
  "Managed product timelines across teams",
  "Engaged with clients to find pain points",
  "Created product walkthroughs and videos",
];

const withPoints = (): ResumeData => ({
  ...SAMPLE_RESUME_DATA,
  workExperience: [{ ...SAMPLE_RESUME_DATA.workExperience[0], description: POINTS }],
});

/** The smallest element whose text contains `needle`. */
function holderOf(root: HTMLElement, needle: string): Element {
  let best: Element | null = null;
  root.querySelectorAll("*").forEach((el) => {
    if ((el.textContent ?? "").includes(needle) && (!best || best.contains(el))) best = el;
  });
  if (!best) throw new Error(`not rendered: ${needle}`);
  return best;
}

describe.each([
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
] as const)("%s template", (_name, Template) => {
  it("draws each point as its own bullet, never run together", () => {
    const { container } = render(<Template data={withPoints()} />);
    const holders = POINTS.map((p) => holderOf(container, p));
    for (const [i, holder] of holders.entries()) {
      for (const [j, other] of POINTS.entries()) {
        if (i !== j) expect(holder.textContent).not.toContain(other);
      }
    }
    expect(container.textContent).not.toContain(". Engaged");
  });
});

describe("TwoColumn", () => {
  it("uses a list item per point, like the other eleven", () => {
    const { container } = render(<TwoColumnTemplate data={withPoints()} />);
    const items = Array.from(container.querySelectorAll('[data-resume-section="workExperience"] li')).map(
      (li) => li.textContent,
    );
    expect(items).toEqual(POINTS);
  });
});

/** A paste event carrying `text` as the clipboard's plain text. */
function paste(target: Element, text: string) {
  fireEvent.paste(target, {
    clipboardData: { getData: (type: string) => (type === "text/plain" ? text : "") },
  });
}

describe("pasting a list into one Job Description point", () => {
  it("keeps the first item in the field and hands the rest back as new points", () => {
    const onPasteList = vi.fn();
    render(<RichTextInput value="" onChange={vi.fn()} onPasteList={onPasteList} placeholder="Point" />);
    const box = screen.getByRole("textbox", { name: "Point" });
    paste(box, "• Managed timelines… • Engaged with clients… • Created walkthroughs…");
    expect(onPasteList).toHaveBeenCalledWith("Managed timelines…", ["Engaged with clients…", "Created walkthroughs…"]);
    expect(box.textContent).toBe("Managed timelines…");
  });

  it("leaves an ordinary one-line paste to the browser", () => {
    const onPasteList = vi.fn();
    render(<RichTextInput value="" onChange={vi.fn()} onPasteList={onPasteList} placeholder="Point" />);
    paste(screen.getByRole("textbox", { name: "Point" }), "Led the migration to AWS");
    expect(onPasteList).not.toHaveBeenCalled();
  });

  it("becomes three points in the builder, escaped as resume HTML", () => {
    function Harness() {
      const [data, setData] = useState<ResumeData>({
        ...SAMPLE_RESUME_DATA,
        workExperience: [{ ...SAMPLE_RESUME_DATA.workExperience[0], description: [""] }],
      });
      return (
        <>
          <ResumeForm resumeData={data} setResumeData={setData} />
          <output data-testid="points">{JSON.stringify(data.workExperience[0].description)}</output>
        </>
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByText(/^Work Experience \(1\)/));
    const [point] = screen.getAllByRole("textbox", { name: "Achievement or responsibility" });
    paste(point, "• Managed R&D timelines\n• Engaged with clients\n• Created walkthroughs");
    expect(JSON.parse(screen.getByTestId("points").textContent || "[]")).toEqual([
      "Managed R&amp;D timelines",
      "Engaged with clients",
      "Created walkthroughs",
    ]);
  });
});
