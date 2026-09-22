import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Box, DialogActions, DialogContent, DialogTitle, IconButton, Button } from "@mui/material";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import { SheetDialog } from "@/components/admin/SheetDialog";
import { PHONE_FLOOR } from "@/components/admin/phoneFloor";
import { Eyebrow, MetaPill, SectionHeading } from "@/components/admin/certificates/shared";
import { AssessmentDataTable } from "@/components/admin/assessment/shared/AssessmentDataTable";
import { MockInterviewTable } from "@/components/admin/mock-interview/MockInterviewTable";
import { AssessmentTable } from "@/components/admin/assessment/AssessmentTable";
import type { Assessment } from "@/lib/services/admin/admin-assessment.service";
import type { AdminInterviewListItem } from "@/lib/services/admin/admin-mock-interview.service";

/**
 * The admin assessment, certificate and interview screens on a phone.
 *
 * jsdom has no layout, so what is pinned is structure and emitted CSS: dialogs become bottom
 * sheets only on a phone, tables become labelled cards only on a phone, and every phone-only
 * size (44px targets, 12px text) lives inside the max-width:599.95px block where no desktop
 * browser can see it.
 */

// ---- viewport ---------------------------------------------------------------------------------
// `phone` matches down("sm"); `tablet` also matches down("md"), which AssessmentTable uses for its
// card layout.
let viewport: "desktop" | "tablet" | "phone" = "desktop";
const realMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches:
      (viewport === "phone" && /max-width:\s*(599\.95|899\.95)px/.test(query)) ||
      (viewport === "tablet" && /max-width:\s*899\.95px/.test(query)),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  viewport = "desktop";
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/admin/assessment",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: null }) }));
vi.mock("@/components/admin/assessment/RetakeGrantsDialog", () => ({ RetakeGrantsDialog: () => null }));

/** The declaration reaches a phone and nothing wider. */
function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

// ---- SheetDialog ------------------------------------------------------------------------------
function Confirm() {
  return (
    <SheetDialog open onClose={() => undefined} maxWidth="sm" fullWidth>
      <DialogTitle>Delete assessment?</DialogTitle>
      <DialogContent>It cannot be undone.</DialogContent>
      <DialogActions>
        <Button>Cancel</Button>
        <Button>Delete</Button>
      </DialogActions>
    </SheetDialog>
  );
}

describe("SheetDialog", () => {
  it("is a bottom sheet with full-width 48px actions on a phone", () => {
    viewport = "phone";
    render(<Confirm />);
    const root = document.querySelector(".MuiDialog-root") as HTMLElement;
    expect(root.hasAttribute("data-phone-sheet")).toBe(true);
    const css = cssByMedia(root).unscoped;
    expect(css).toMatch(/align-items:flex-end/);
    expect(css).toMatch(/border-radius:20px 20px 0 0/);
    expect(css).toMatch(/min-height:48px/);
    // Every desktop action is still there, as the same element.
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("is the plain centred Dialog on a desktop, with no sheet rule", () => {
    render(<Confirm />);
    const root = document.querySelector(".MuiDialog-root") as HTMLElement;
    expect(root.hasAttribute("data-phone-sheet")).toBe(false);
    const css = cssByMedia(root).unscoped;
    expect(css).not.toMatch(/border-radius:20px 20px 0 0/);
    expect(css).not.toMatch(/align-items:flex-end/);
    expect(screen.getByRole("dialog").querySelector(".MuiDialogTitle-root")?.textContent).toBe(
      "Delete assessment?",
    );
  });
});

// ---- The page floor ---------------------------------------------------------------------------
describe("PHONE_FLOOR", () => {
  it("raises icon buttons to 44px and captions to 12px, on a phone only", () => {
    render(
      <Box data-testid="floor" sx={PHONE_FLOOR}>
        <IconButton size="small" aria-label="More">x</IconButton>
      </Box>,
    );
    const floor = screen.getByTestId("floor");
    expectPhoneOnly(floor, /\.MuiIconButton-root\{min-width:44px;min-height:44px;\}/);
    expectPhoneOnly(floor, /\.MuiTypography-caption[^{]*\{font-size:0\.75rem;\}/);
  });
});

// ---- Certificates atoms -----------------------------------------------------------------------
describe("certificate hub text on a phone", () => {
  it("lifts the 9.6px eyebrow, the 11.5px pill and the heading subtitle to 12px on a phone only", () => {
    render(
      <>
        <Eyebrow>The points ladder</Eyebrow>
        <MetaPill label="Learning Foundations · 1500" />
        <SectionHeading icon="mdi:star" title="Start from a preset" subtitle="Ten finished looks." />
      </>,
    );
    const eyebrow = screen.getByText("The points ladder");
    expect(cssByMedia(eyebrow).unscoped).toMatch(/font-size:0\.6rem/);
    expectPhoneOnly(eyebrow, /font-size:0\.75rem/);

    const pill = screen.getByText("Learning Foundations · 1500").parentElement as HTMLElement;
    expect(cssByMedia(pill).unscoped).toMatch(/font-size:0\.72rem/);
    expectPhoneOnly(pill, /font-size:0\.75rem/);

    const subtitle = screen.getByText("Ten finished looks.");
    expectPhoneOnly(subtitle, /font-size:0\.75rem/);
  });
});

// ---- Tables as cards --------------------------------------------------------------------------
type Row = { id: number; name: string; status: string };
describe("AssessmentDataTable phoneCards (the issued-certificates register)", () => {
  const columns = [
    { key: "name", header: "Recipient" },
    { key: "status", header: "Status" },
    { key: "actions", header: "Actions", render: () => <button>Revoke</button> },
  ];

  it("labels each value and turns rows into cards on a phone only", () => {
    render(<AssessmentDataTable<Row> phoneCards columns={columns} rows={[{ id: 1, name: "Asha", status: "Issued" }]} rowKey={(r) => r.id} />);
    const cell = screen.getByText("Issued").closest("td") as HTMLElement;
    expect(cell.getAttribute("data-label")).toBe("Status");
    // Title (first) and action bar (last) carry no caption.
    expect(screen.getByText("Asha").closest("td")?.getAttribute("data-label")).toBeNull();
    expect(screen.getByRole("button", { name: "Revoke" }).closest("td")?.getAttribute("data-label")).toBeNull();

    const container = document.querySelector(".MuiTableContainer-root") as HTMLElement;
    expectPhoneOnly(container, /thead\{display:none;\}/);
    expectPhoneOnly(container, /content:attr\(data-label\)/);
  });

  it("changes nothing for a caller that did not opt in (the projects list)", () => {
    render(<AssessmentDataTable<Row> columns={columns} rows={[{ id: 1, name: "Asha", status: "Issued" }]} rowKey={(r) => r.id} />);
    expect(screen.getByText("Issued").closest("td")?.getAttribute("data-label")).toBeNull();
    const container = document.querySelector(".MuiTableContainer-root") as HTMLElement;
    expect(cssByMedia(container).phone).not.toMatch(/thead/);
  });
});

describe("MockInterviewTable on a phone", () => {
  const row: AdminInterviewListItem = {
    id: 7,
    title: "Frontend round",
    topic: "React",
    difficulty: "Medium",
    status: "completed",
    duration_minutes: 30,
    created_at: "2026-09-01T10:00:00Z",
    student_name: "Ravi Kumar",
    student_email: "ravi@example.com",
    student_id: 3,
    overall_percentage: 72,
  };

  it("is a stack of labelled cards on a phone, with the header row hidden only there", () => {
    render(
      <MockInterviewTable
        interviews={[row]}
        loading={false}
        pagination={{ current_page: 1, total_pages: 1, total_interviews: 1, limit: 10 }}
        onPageChange={() => undefined}
        onLimitChange={() => undefined}
      />,
    );
    const topic = screen.getByText("React").closest("td") as HTMLElement;
    expect(topic.getAttribute("data-label")).toBeTruthy();
    const container = document.querySelector(".MuiTableContainer-root") as HTMLElement;
    expectPhoneOnly(container, /thead\{display:none;\}/);
    expectPhoneOnly(container, /content:attr\(data-label\)/);
  });
});

// ---- Assessment list cards --------------------------------------------------------------------
describe("AssessmentTable card layout", () => {
  const assessment: Assessment = {
    id: 347,
    title: "Assessment Javascript",
    slug: "js",
    instructions: "",
    duration_minutes: 60,
    is_paid: false,
    price: null,
    is_active: true,
    created_at: "2026-07-01T00:00:00Z",
    total_questions: 20,
    quiz_sections_count: 2,
  };
  const noop = async () => undefined;

  it("gives a phone 44px row actions, and a tablet the card layout untouched", () => {
    viewport = "phone";
    const { unmount } = render(
      <AssessmentTable assessments={[assessment]} onExportSubmissions={noop} onExportQuestions={noop} />,
    );
    const title = screen.getByText("Assessment Javascript");
    const list = title.closest(".MuiPaper-root")?.parentElement as HTMLElement;
    expectPhoneOnly(list, /\.MuiIconButton-root\{min-width:44px;min-height:44px;\}/);
    // The row actions are all still reachable from the card.
    expect(screen.getByRole("button", { name: "Copy assessment share link" })).toBeTruthy();
    unmount();

    viewport = "tablet";
    render(<AssessmentTable assessments={[assessment]} onExportSubmissions={noop} onExportQuestions={noop} />);
    const tabletList = screen.getByText("Assessment Javascript").closest(".MuiPaper-root")?.parentElement as HTMLElement;
    expect(cssByMedia(tabletList).unscoped).not.toMatch(/min-height:44px/);
  });
});
