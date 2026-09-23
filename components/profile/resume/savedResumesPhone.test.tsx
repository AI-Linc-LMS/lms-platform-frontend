/**
 * The saved-resumes list on a phone.
 *
 * These were measured in a real 390px and 360px render before being written down here: the Open
 * button 44px tall, the three icon actions 44x44 (34x34 everywhere else), Show all 44px, and no
 * type under 12px. jsdom cannot lay anything out, but it can read the CSS Emotion emitted, which
 * is enough to catch the thing that actually goes wrong - a phone size written as a bare `xs`,
 * which MUI applies at EVERY width and which would quietly resize the desktop too.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@/lib/i18n";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import { SavedResumesPanel } from "./SavedResumesPanel";
import type { ResumeDocumentSummary } from "@/lib/services/resumeDocuments.service";

const DOCS: ResumeDocumentSummary[] = [1, 2, 3, 4].map((id) => ({
  id,
  name: `Resume ${id}`,
  template: "modern",
  ats_score: 70 + id,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-20T10:00:00Z",
}));

function renderPanel(documents = DOCS) {
  return render(
    <SavedResumesPanel
      documents={documents}
      loading={false}
      openId={null}
      busyId={null}
      onOpen={() => {}}
      onRename={async () => {}}
      onDuplicate={() => {}}
      onDelete={async () => {}}
      templateLabel={(x) => x}
    />,
  );
}

/** A size that must reach a phone and nothing wider. */
function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

describe("saved resumes on a phone", () => {
  it("gives Open a 44px target on a phone only", () => {
    renderPanel();
    const open = within(screen.getAllByTestId("saved-resume-row")[0]).getByRole("button", { name: /^open$/i });
    expectPhoneOnly(open, /min-height:44px/);
  });

  it("grows the three row actions to 44x44 on a phone, and leaves them 34x34 elsewhere", () => {
    renderPanel();
    const row = screen.getAllByTestId("saved-resume-row")[0];
    for (const name of [/^rename$/i, /^duplicate$/i, /^delete$/i]) {
      const button = within(row).getByRole("button", { name });
      const css = cssByMedia(button);
      expect(css.phone).toMatch(/width:44px/);
      expect(css.phone).toMatch(/height:44px/);
      // The desktop keeps the denser 34px square this toolbar uses everywhere.
      expect(css.unscoped).toMatch(/width:34px/);
      expect(css.unscoped).not.toMatch(/width:44px/);
    }
  });

  it("gives Show all a 44px target on a phone only", () => {
    renderPanel();
    // Four resumes, three rows shown: the expander exists.
    const showAll = screen.getByRole("button", { name: /show all/i });
    expectPhoneOnly(showAll, /min-height:44px/);
  });

  it("never puts type under 12px on a phone", () => {
    renderPanel();
    const row = screen.getAllByTestId("saved-resume-row")[0];
    // 0.72rem is 11.5px: a desktop density that has to step up on a phone.
    const meta = within(row).getByText(/at save/i);
    const css = cssByMedia(meta);
    expect(css.phone).toMatch(/font-size:0\.75rem/);
    expect(css.unscoped).toMatch(/font-size:0\.72rem/);
  });

  it("shows only three rows until asked, so the builder is not pushed off the screen", () => {
    renderPanel();
    expect(screen.getAllByTestId("saved-resume-row")).toHaveLength(3);
    expect(screen.getByRole("button", { name: /show all 4/i })).toBeInTheDocument();
  });

  it("says a failed load is a failed load, not an empty list", () => {
    render(
      <SavedResumesPanel
        documents={[]}
        loading={false}
        loadError
        onRetry={() => {}}
        openId={null}
        busyId={null}
        onOpen={() => {}}
        onRename={async () => {}}
        onDuplicate={() => {}}
        onDelete={async () => {}}
        templateLabel={(x) => x}
      />,
    );
    expect(screen.getByTestId("saved-resumes-error")).toBeInTheDocument();
    expect(screen.getByText(/still there/i)).toBeInTheDocument();
    expect(screen.queryByText(/nothing saved yet/i)).toBeNull();
    expectPhoneOnly(screen.getByRole("button", { name: /try again/i }), /min-height:44px/);
  });
});
