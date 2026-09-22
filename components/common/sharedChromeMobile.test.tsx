import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * The shared chrome's global surfaces on a phone: the confirm dialog, the support dialog, the
 * notifications panel, the module page header and its guide, the spotlight tour, and the
 * tenant-logo fallback.
 *
 * jsdom has no layout, so nothing here measures a pixel. What is pinned is (a) which markup a
 * phone gets versus a screen of 600px or more - MUI picks it from `window.matchMedia` - and (b)
 * that every phone-only size lives inside the `max-width:599.95px` block and nowhere a desktop
 * browser can see it.
 */

// ---- viewport ---------------------------------------------------------------------------------
const realMatchMedia = window.matchMedia;
const realInnerWidth = window.innerWidth;
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
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}
const PHONE = 390;
const DESKTOP = 1440;

// ---- app seams --------------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/admin/manage-students",
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => (typeof fallback === "string" ? fallback : key) }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: { name: "Demo" } }) }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: { role: "student" }, isAuthenticated: true }) }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/ticket.service", () => ({
  ticketService: { createTicket: vi.fn() },
  TICKET_CATEGORY_OPTIONS: [{ value: "technical", label: "Technical" }],
}));
vi.mock("@/lib/services/file-upload.service", () => ({ uploadFile: vi.fn() }));
vi.mock("@/lib/services/community.service", () => ({ communityService: {} }));

import { ConfirmDialog } from "./ConfirmDialog";
import { ReportIssueDialog } from "./ReportIssueDialog";
import { ModulePageHeader, HeaderActionButton } from "./ModulePageHeader";
import { TenantLogo } from "./TenantLogo";
import { NotificationPopover, NotificationBell } from "@/components/notifications/NotificationPopover";
import { TourProvider, useTour } from "@/components/community/TourProvider";

beforeEach(() => viewport(PHONE));
afterEach(() => {
  window.matchMedia = realMatchMedia;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: realInnerWidth });
});

/** A phone-only value must be in the phone block and absent everywhere a desktop can see. */
function phoneOnly(el: Element, decl: string) {
  const css = cssByMedia(el);
  expect(css.phone).toContain(decl);
  expect(css.unscoped).not.toContain(decl);
}

// ---- ConfirmDialog ----------------------------------------------------------------------------
describe("ConfirmDialog", () => {
  const base = { open: true, title: "Remove student?", message: "They lose access.", onConfirm: vi.fn(), onCancel: vi.fn() };

  it("is a bottom sheet on a phone", () => {
    render(<ConfirmDialog {...base} />);
    expect(screen.getByTestId("confirm-dialog-sheet")).toBeInTheDocument();
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).not.toBeNull();
  });

  it("keeps the centred dialog from 600px up", () => {
    viewport(DESKTOP);
    render(<ConfirmDialog {...base} />);
    expect(screen.queryByTestId("confirm-dialog-sheet")).toBeNull();
    expect(document.querySelector(".MuiDialog-paper")).not.toBeNull();
    expect(document.querySelector(".MuiDialogActions-root")).not.toBeNull();
  });

  it("cannot be dismissed or re-fired on a phone while busy", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...base} onCancel={onCancel} onConfirm={onConfirm} busy confirmText="Remove" />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.keyDown(document.querySelector(".MuiDrawer-root")!, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });
});

// ---- ReportIssueDialog ------------------------------------------------------------------------
describe("ReportIssueDialog", () => {
  it("is a bottom sheet on a phone, with the form and both actions", () => {
    render(<ReportIssueDialog open onClose={vi.fn()} />);
    const sheet = screen.getByTestId("report-issue-sheet");
    expect(within(sheet).getByText("Support and Help")).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: /Submit ticket/ })).toBeInTheDocument();
    phoneOnly(within(sheet).getByRole("button", { name: "Cancel" }), "min-height:48px");
  });

  it("keeps the original dialog from 600px up", () => {
    viewport(DESKTOP);
    render(<ReportIssueDialog open onClose={vi.fn()} />);
    expect(screen.queryByTestId("report-issue-sheet")).toBeNull();
    expect(document.querySelector(".MuiDialogTitle-root")).toHaveTextContent("Support and Help");
    expect(document.querySelector(".MuiDialogActions-root")).not.toBeNull();
  });
});

// ---- NotificationPopover ----------------------------------------------------------------------
describe("NotificationPopover", () => {
  const anchor = () => {
    const el = document.createElement("button");
    document.body.appendChild(el);
    return el;
  };
  const note = {
    id: 1,
    title: "Assessment available",
    message: "A new assessment is ready.",
    notification_type: "assessment_available",
    is_read: false,
    created_at: new Date().toISOString(),
  } as never;

  it("is screen-wide on a phone and 380px+ only from 600px up", () => {
    render(
      <NotificationPopover anchorEl={anchor()} onClose={vi.fn()} notifications={[note]} unreadCount={1} loading={false} onNotificationClick={vi.fn()} onMarkAllRead={vi.fn()} />,
    );
    const paper = document.querySelector(".MuiPopover-paper")!;
    const css = cssByMedia(paper);
    expect(css.phone).toContain("width:calc(100vw - 16px)");
    expect(css.phone).toContain("min-width:0");
    expect(css.unscoped).not.toContain("calc(100vw - 16px)");
    // The desktop panel is untouched.
    expect(css.unscoped).toContain("min-width:380px");
  });

  it("gives Mark all read a 44px target on a phone only", () => {
    render(
      <NotificationPopover anchorEl={anchor()} onClose={vi.fn()} notifications={[note]} unreadCount={1} loading={false} onNotificationClick={vi.fn()} onMarkAllRead={vi.fn()} />,
    );
    phoneOnly(screen.getByRole("button", { name: /Mark all read/ }), "min-height:44px");
  });

  it("raises the unread badge to 12px on a phone only", () => {
    render(<NotificationBell unreadCount={3} onClick={vi.fn()} />);
    const badge = document.querySelector(".MuiBadge-root")!;
    const css = cssByMedia(badge);
    expect(css.phone).toContain("font-size:0.75rem");
    expect(css.unscoped).not.toContain("font-size:0.75rem");
  });
});

// ---- ModulePageHeader + PageGuide -------------------------------------------------------------
describe("ModulePageHeader", () => {
  it("raises the eyebrow to 12px and the guide button to 44px on a phone only", () => {
    render(<ModulePageHeader eyebrow="People" title="Manage students" />);
    phoneOnly(screen.getByText("People"), "font-size:0.75rem");
    phoneOnly(screen.getByRole("button", { name: "Guide to this page" }), "width:44px");
  });

  it("wraps the header actions on a phone, and a header action is 44px there", () => {
    render(<ModulePageHeader eyebrow="People" title="Manage students" action={<HeaderActionButton>Add student</HeaderActionButton>} />);
    phoneOnly(screen.getByTestId("module-header-actions"), "flex-wrap:wrap");
    phoneOnly(screen.getByRole("button", { name: "Add student" }), "min-height:44px");
  });
});

// ---- TourProvider -----------------------------------------------------------------------------
describe("TourProvider", () => {
  function Starter() {
    const { startTour } = useTour();
    return (
      <>
        <div data-tour-id="bell" />
        <button onClick={() => startTour([{ targetId: "bell", title: "Your notifications", narration: "New things land here." }])}>go</button>
      </>
    );
  }

  it("keeps the tour card inside a 360px screen", async () => {
    viewport(360);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute("data-tour-id") === "bell") return { left: 300, top: 10, right: 340, bottom: 50, width: 40, height: 40, x: 300, y: 10, toJSON: () => ({}) } as DOMRect;
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
    });
    render(
      <TourProvider>
        <Starter />
      </TourProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("go"));
      await new Promise((r) => setTimeout(r, 50));
    });
    const card = screen.getByText("Your notifications").parentElement!.parentElement!.parentElement!;
    const left = /left:(-?[\d.]+)px/.exec(cssByMedia(card).unscoped);
    expect(left).not.toBeNull();
    // A fixed 360px card width put it at left:-16px on a 360px phone.
    expect(Number(left![1])).toBeGreaterThanOrEqual(16);
    vi.restoreAllMocks();
  });
});

// ---- TenantLogo ---------------------------------------------------------------------------------
describe("TenantLogo", () => {
  it("replaces a logo that fails to load with the tenant name, never a broken image", () => {
    render(<TenantLogo src="https://be.example/branding/asset/3/" name="CodePaathshala" />);
    const img = screen.getByRole("img", { name: "CodePaathshala" });
    fireEvent.error(img);
    expect(screen.getByTestId("tenant-wordmark")).toHaveTextContent("CodePaathshala");
    expect(document.querySelector("img")).toBeNull();
  });

  it("tries again when the url changes", () => {
    const { rerender } = render(<TenantLogo src="https://a/logo.png" name="Acme" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByTestId("tenant-wordmark")).toBeInTheDocument();
    rerender(<TenantLogo src="https://b/logo.png" name="Acme" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://b/logo.png");
  });

  it("shows the wordmark when there is no url at all", () => {
    render(<TenantLogo src="" name="Acme" />);
    expect(screen.getByTestId("tenant-wordmark")).toHaveTextContent("Acme");
  });
});
