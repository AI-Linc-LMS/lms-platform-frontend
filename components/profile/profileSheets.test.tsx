import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

/**
 * The profile editors on a phone.
 *
 * #1646 left the profile's editors as centred MUI dialogs. They keep their markup and handlers.
 * A phone-only root style pins the paper to the bottom edge as a sheet, and the desktop CSS
 * gains nothing. An editor with a request running cannot be swiped away on a phone.
 */

import { cssByMedia } from "@/components/community/cssByMedia.testutil";

const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key }),
}));

import { ImageUrlDialog } from "./ImageUrlDialog";

function dialogRoot() {
  const root = document.querySelector(".MuiDialog-root");
  if (!root) throw new Error("no dialog");
  return root;
}

describe("profile editor as a bottom sheet", () => {
  it("anchors the paper to the bottom edge, full width, rounded on top, inside the phone block only", () => {
    viewport(390);
    render(<ImageUrlDialog open onClose={vi.fn()} onSave={vi.fn()} title="Cover photo" />);
    const css = cssByMedia(dialogRoot());
    expect(css.phone).toContain("align-items:flex-end");
    expect(css.phone).toContain("border-radius:20px 20px 0 0");
    expect(css.phone).toContain("max-height:92dvh");
    expect(css.unscoped).not.toContain("20px 20px 0 0");
    expect(css.unscoped).not.toContain("flex-end");
    expect(css.unscoped).not.toContain("92dvh");
  });

  it("cannot be dismissed on a phone while its save is running", async () => {
    viewport(390);
    const onClose = vi.fn();
    let finish: () => void = () => {};
    const onSave = vi.fn(() => new Promise<void>((r) => (finish = r)));
    render(<ImageUrlDialog open onClose={onClose} onSave={onSave} title="Cover photo" currentImageUrl="https://example.com/a.png" />);
    fireEvent.click(screen.getByRole("button", { name: "profile.save" }));
    expect(onSave).toHaveBeenCalled();
    fireEvent.keyDown(dialogRoot(), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => finish());
    // The save's own success path closes it.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("still closes on Escape on a desktop, as it did before", () => {
    viewport(1440);
    const onClose = vi.fn();
    render(<ImageUrlDialog open onClose={onClose} onSave={vi.fn()} title="Cover photo" />);
    fireEvent.keyDown(dialogRoot(), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Every editor #1646 left as a centred dialog carries the sheet style. Rendering each one
  // needs its whole section and profile, so this one pins the wiring from the source.
  it.each([
    "ExperienceSection",
    "EducationSection",
    "ProjectsSection",
    "CertificationsSection",
    "AchievementsSection",
    "AddSectionModal",
    "ImageUploadDialog",
    "ImageUrlDialog",
    "ResumeUploadDialog",
    "ProfileHeader",
    "PublicPreviewCard",
    "SavedResumesSection",
  ])("%s opens as a sheet on a phone", (name) => {
    const src = fs.readFileSync(path.resolve(`components/profile/${name}.tsx`), "utf8");
    const dialogs = src.match(/<Dialog\b/g) ?? [];
    const sheets = src.match(/<Dialog\s+sx=\{phoneSheetDialogSx\}/g) ?? [];
    expect(dialogs.length).toBeGreaterThan(0);
    expect(sheets.length).toBe(dialogs.length);
  });
});
