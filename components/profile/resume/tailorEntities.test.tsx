/**
 * The AI tailor dialog shows a resume line as it will read on the resume, and applies a rewrite
 * as a resume line.
 *
 * Its BEFORE/AFTER panels printed the stored line raw, so a bullet whose & the editor had stored
 * as &amp; showed "&amp;" in the very dialog asking whether to replace it. And a rewrite came back
 * as whatever the model echoed - plain text or HTML - and was written into the resume unread.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

import { SectionTailorButton } from "./SectionTailorButton";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData";
import type { ResumeData } from "./types";

const role = SAMPLE_RESUME_DATA.workExperience[0];
/** What the editor stored for "Segmented health & wellness (FMCG) markets". */
const STORED = "Segmented health &amp; wellness (FMCG) markets";
const REWRITE = "Grew R&D spend on <Button> kits by 40%";

const data: ResumeData = { ...SAMPLE_RESUME_DATA, workExperience: [{ ...role, description: [STORED] }] };

afterEach(() => vi.unstubAllGlobals());

describe("tailoring a bullet", () => {
  it("shows both panels as the resume reads, and applies the rewrite as one escaped line", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          section: "experience",
          rationale: "",
          bulletChanges: [{ position: role.position, company: role.company, index: 0, before: STORED, after: REWRITE }],
        }),
      }),
    );
    const onResumeChange = vi.fn();
    render(<SectionTailorButton section="experience" resumeData={data} onResumeChange={onResumeChange} />);

    fireEvent.click(screen.getByRole("button", { name: /rewrite bullets/i }));
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: "Senior product manager, consumer health, go-to-market" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    const apply = await screen.findByRole("button", { name: "Apply" });

    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Segmented health & wellness (FMCG) markets");
    expect(dialog.textContent).toContain(REWRITE);
    expect(dialog.textContent).not.toContain("&amp;");
    expect(within(dialog).queryByRole("button", { name: "Button" })).toBeNull();

    fireEvent.click(apply);
    await waitFor(() => expect(onResumeChange).toHaveBeenCalled());
    expect(onResumeChange.mock.calls[0][0].workExperience[0].description).toEqual([
      "Grew R&amp;D spend on &lt;Button&gt; kits by 40%",
    ]);
  });
});
