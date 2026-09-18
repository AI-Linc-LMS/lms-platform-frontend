/**
 * The formatting has to survive the whole way to the page.
 *
 * A sanitiser that returns "<b>Led</b>" proves nothing on its own: the templates spent their whole
 * life rendering `{desc}`, which React escapes, so a bolded bullet would have appeared on the
 * resume as the literal text `<b>Led</b>` - visibly worse than no feature at all. This renders the
 * real templates and asks the DOM whether the element exists.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ResumeRichText from "./ResumeRichText";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { TwoColumnTemplate } from "./templates/TwoColumnTemplate";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";
import type { ResumeData } from "./types";

const BOLD_BULLET = "<b>Led</b> the migration off the legacy billing service";

const withBoldBullet = (): ResumeData => ({
  ...SAMPLE_RESUME_DATA,
  workExperience: [{ ...SAMPLE_RESUME_DATA.workExperience[0], description: [BOLD_BULLET] }],
});

describe("ResumeRichText", () => {
  it("renders a formatted line as real elements", () => {
    const { container } = render(<ResumeRichText value="<b>Led</b> a team of <i>six</i>" />);
    expect(container.querySelector("b")?.textContent).toBe("Led");
    expect(container.querySelector("i")?.textContent).toBe("six");
  });

  it("renders a plain line as plain text, with no wrapper at all", () => {
    const { container } = render(<ResumeRichText value="Led a team of six" />);
    expect(container.innerHTML).toBe("Led a team of six");
  });

  it("does not render a tag the user typed as markup", () => {
    const { container } = render(<ResumeRichText value="Cut p95 <script>alert(1)</script>" />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("survives an empty value", () => {
    const { container } = render(<ResumeRichText value={undefined} />);
    expect(container.innerHTML).toBe("");
  });
});

describe.each([
  ["Classic", ClassicTemplate],
  ["Modern", ModernTemplate],
  ["TwoColumn", TwoColumnTemplate],
])("%s template", (_name, Template) => {
  it("draws a bolded bullet in bold, not as visible tags", () => {
    const { container } = render(<Template data={withBoldBullet()} />);
    const bolds = Array.from(container.querySelectorAll("b, strong"))
      .map((el) => el.textContent);
    expect(bolds).toContain("Led");
    expect(container.textContent).not.toContain("<b>");
  });
});
