import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * The ticket dialogs on a phone.
 *
 * A centred MUI Dialog on a 390px screen lands mid-screen with its own scrollbar, and the moment
 * the keyboard comes up for "what's still not resolved?" the Reopen button is behind it. Both
 * ticket dialogs now come up from the bottom on a phone and stay exactly the centred dialog they
 * were from `sm` up.
 *
 * MUI decides which one to render from `window.matchMedia`, so these tests drive matchMedia at a
 * real viewport width rather than asserting on a prop.
 */

vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock("@/lib/services/ticket.service", () => ({
  ticketService: {
    reopen: vi.fn(),
    // The assignee list loads when the dialog opens; leave it pending so the render is
    // synchronous and nothing settles after the assertions.
    listAssignees: () => new Promise(() => {}),
  },
}));
vi.mock("@/lib/services/file-upload.service", () => ({ uploadFile: vi.fn() }));

import { AssigneesDialog } from "./AssigneesDialog";
import { ReopenTicketDialog } from "./ReopenTicketDialog";

const realMatchMedia = window.matchMedia;

/** Answer MUI's `(max-width: ...)` queries as a screen of this width would. */
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

const PHONE = 390; // iPhone 14
const DESKTOP = 1440;

/** A sheet is a bottom-anchored Drawer; a dialog is a centred Dialog. */
const sheetPaper = () => document.querySelector(".MuiDrawer-paperAnchorBottom");
const dialogPaper = () => document.querySelector(".MuiDialog-paper");

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  window.matchMedia = realMatchMedia;
});

describe("Reopen this ticket", () => {
  const renderIt = () =>
    render(
      <ReopenTicketDialog open ticketId={412} clientId={1} onClose={vi.fn()} onReopened={vi.fn()} />,
    );

  it("comes up from the bottom of a phone", () => {
    viewport(PHONE);
    renderIt();
    expect(sheetPaper()).toBeTruthy();
    expect(dialogPaper()).toBeNull();
  });

  it("is still the centred dialog on a desktop", () => {
    viewport(DESKTOP);
    renderIt();
    expect(dialogPaper()).toBeTruthy();
    expect(sheetPaper()).toBeNull();
  });

  it("is the original dialog on a desktop, with no close button it never had", () => {
    viewport(DESKTOP);
    renderIt();
    expect(document.querySelector(".MuiDialogTitle-root")).toBeTruthy();
    expect(document.querySelector(".MuiDialogActions-root")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("keeps its form and its actions wherever it renders", () => {
    viewport(PHONE);
    renderIt();
    expect(screen.getByRole("heading", { name: /Reopen this ticket/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reopen ticket/ })).toBeTruthy();
    expect(screen.getByLabelText(/What's still not resolved/)).toBeTruthy();
  });

  it("offers a close control a thumb can find", () => {
    viewport(PHONE);
    renderIt();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });
});

describe("Support assignees", () => {
  const renderIt = () => render(<AssigneesDialog open clientId={1} onClose={vi.fn()} />);

  it("comes up from the bottom of a phone", () => {
    viewport(PHONE);
    renderIt();
    expect(sheetPaper()).toBeTruthy();
    expect(dialogPaper()).toBeNull();
  });

  it("is still the centred dialog on a desktop", () => {
    viewport(DESKTOP);
    renderIt();
    expect(dialogPaper()).toBeTruthy();
    expect(sheetPaper()).toBeNull();
  });

  it("is the original dialog on a desktop, with no close button it never had", () => {
    viewport(DESKTOP);
    renderIt();
    expect(document.querySelector(".MuiDialogTitle-root")).toBeTruthy();
    expect(document.querySelector(".MuiDialogActions-root")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("keeps the add form and the Done action", () => {
    viewport(PHONE);
    renderIt();
    expect(screen.getByRole("heading", { name: /Support assignees/ })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
  });
});
