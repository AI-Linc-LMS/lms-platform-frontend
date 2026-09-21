/**
 * The resume builder on a phone is editor-first.
 *
 * Before this pass a 390px screen got the arrangement panel, then the form, then an A4 sheet
 * shrunk to 41% sharing the page with both; twelve template chips wrapped into four rows; and the
 * ATS report was a centred dialog. What is pinned here is the structure that replaced it, which
 * jsdom can see even though it cannot lay anything out:
 *
 * - the preview is a pane behind a Preview action that becomes a full-screen modal sheet, and it
 *   stays MOUNTED while closed, because the PDF is built from what it lays out;
 * - the template chips live in a ScrollRow;
 * - the ATS report opens as a bottom sheet (a Drawer), not a centred Dialog.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/profile",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({ percentage: 100, completion: 100, missingFields: [] }),
}));
vi.mock("./ATSScoreCard", () => ({ ATSScoreCard: () => <div data-testid="ats-card" /> }));
vi.mock("./ATSQuickFixes", () => ({ ATSQuickFixes: () => null }));
vi.mock("html-to-image", () => ({ toPng: vi.fn() }));

import { ResumeBuilder } from "./ResumeBuilder";

/** Every media query matches or none does: a phone, or a desktop. */
function setViewport(phone: boolean) {
  window.matchMedia = ((query: string) => ({
    // MUI's down("sm") and the builder's own query are both max-width queries.
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

const pane = () => document.querySelector("[data-resume-preview-pane]") as HTMLElement;

describe("ResumeBuilder on a phone", () => {
  const original = window.matchMedia;
  beforeEach(() => setViewport(true));
  afterEach(() => {
    window.matchMedia = original;
    document.body.style.overflow = "";
  });

  it("keeps the preview mounted but closed until the learner asks for it", () => {
    render(<ResumeBuilder />);
    expect(pane()).toBeTruthy();
    expect(pane().getAttribute("data-open")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();
    // The sheets are still rendered, so Download works without opening the preview first.
    expect(pane().querySelector("[data-resume-sheet]")).toBeTruthy();
  });

  it("opens the preview as a full-screen modal sheet and closes it again", () => {
    render(<ResumeBuilder />);
    fireEvent.click(screen.getByRole("button", { name: /^preview resume$/i }));

    const sheet = screen.getByRole("dialog", { name: /preview/i });
    expect(sheet).toBe(pane());
    expect(sheet.getAttribute("aria-modal")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(within(sheet).getByRole("button", { name: /back to editor/i })).toBeTruthy();

    fireEvent.click(within(sheet).getByRole("button", { name: /close preview/i }));
    expect(pane().getAttribute("data-open")).toBe("false");
    expect(document.body.style.overflow).toBe("");
  });

  it("closes the preview on Escape", () => {
    render(<ResumeBuilder />);
    fireEvent.click(screen.getByRole("button", { name: /^preview resume$/i }));
    expect(pane().getAttribute("data-open")).toBe("true");
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(pane().getAttribute("data-open")).toBe("false");
  });

  it("moves focus into the preview, keeps it there, and returns it to the Preview button", () => {
    render(<ResumeBuilder />);
    const trigger = screen.getByRole("button", { name: /^preview resume$/i });
    trigger.focus();
    fireEvent.click(trigger);

    const sheet = screen.getByRole("dialog", { name: /preview/i });
    const close = within(sheet).getByRole("button", { name: /close preview/i });
    expect(document.activeElement).toBe(close);

    // Focus that lands on the page behind the sheet is pulled back in.
    act(() => {
      screen.getByRole("button", { name: /save/i }).focus();
    });
    expect(sheet.contains(document.activeElement)).toBe(true);

    // Shift+Tab from the first control wraps to the last one inside the sheet, not the page.
    act(() => {
      close.focus();
    });
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(sheet.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(close);
    // And Tab from the last wraps back to the first.
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    fireEvent.click(close);
    expect(pane().getAttribute("data-open")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("returns focus to the Preview button when the preview is closed with Escape", () => {
    render(<ResumeBuilder />);
    const trigger = screen.getByRole("button", { name: /^preview resume$/i });
    trigger.focus();
    fireEvent.click(trigger);
    expect(pane().contains(document.activeElement)).toBe(true);
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(document.activeElement).toBe(trigger);
  });

  it("puts the template chips in a scrolling row instead of wrapping them", () => {
    render(<ResumeBuilder />);
    const row = screen.getByRole("group", { name: /template/i });
    expect(within(row).getAllByRole("button").length).toBeGreaterThan(3);
  });

  it("opens the ATS report as a bottom sheet, not a centred dialog", () => {
    render(<ResumeBuilder />);
    fireEvent.click(screen.getByText(/^ATS \d+/));
    expect(screen.getByTestId("ats-card")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-paper")).toBeTruthy();
    expect(document.querySelector(".MuiDialog-paper")).toBeNull();
  });
});

describe("ResumeBuilder on a desktop", () => {
  const original = window.matchMedia;
  beforeEach(() => setViewport(false));
  afterEach(() => {
    window.matchMedia = original;
  });

  it("still opens the ATS report as the original centred dialog", () => {
    render(<ResumeBuilder />);
    fireEvent.click(screen.getByText(/^ATS \d+/));
    expect(document.querySelector(".MuiDialog-paper")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-paper")).toBeNull();
    // The original markup, not the shared primitive's desktop branch: a DialogTitle with its small
    // close, and DialogContent with dividers.
    expect(screen.queryByTestId("ats-report-sheet")).toBeNull();
    expect(document.querySelector(".MuiDialogTitle-root")).toBeTruthy();
    expect(document.querySelector(".MuiDialogContent-dividers")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^close$/ })).toBeTruthy();
    expect(screen.getByTestId("ats-card")).toBeTruthy();
  });

  it("drops an open phone preview when the screen grows past the phone breakpoint", () => {
    render(<ResumeBuilder />);
    // The Preview action is CSS-hidden above `sm` but still in the DOM; pressing it here stands in
    // for a phone rotated or resized while the sheet was open.
    fireEvent.click(screen.getByRole("button", { name: /^preview resume$/i, hidden: true }));
    expect(pane().getAttribute("data-open")).toBe("false");
    expect(document.body.style.overflow).toBe("");
  });
});
