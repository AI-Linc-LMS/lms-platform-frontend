/**
 * The admin live-sessions screens on a phone.
 *
 * Measured at 390px against a signed-in tenant: the Google Meet setup card ran to x=492 (a 320px
 * flex basis plus a nowrap redirect URI), the attendance roster was a 4-column table in 330px -
 * three-letter names, emails cut to "stu…", 52x36 "Mark present" links in 10.4px type - and every
 * dialog landed as a centred card with 36px actions.
 *
 * jsdom has no layout, so these pin structure and emitted CSS: a phone gets roster cards and
 * bottom-sheet dialogs, a desktop gets the original table and centred dialogs, and every phone
 * size lives inside the max-width:599.95px block where no desktop can see it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@/lib/i18n";
import { DESKTOP, PHONE, styleAt } from "@/components/jobs-v2/responsiveSx.testutil";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type { LiveSessionRosterResponse } from "@/lib/services/admin/admin-live-activities.service";

// ---- viewport ---------------------------------------------------------------------------------
let phone = false;
const realMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: phone && /max-width:\s*599\.95px/.test(query),
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
  phone = false;
});

// ---- app seams --------------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  markAttendance: vi.fn(async () => ({})),
  getRoster: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/admin/admin-live-activities.service", () => ({
  adminLiveActivitiesService: {
    getRoster: mocks.getRoster,
    getAttendanceSuggestions: vi.fn(async () => ({ unidentified_count: 0, unmatched: [] })),
    getZoomAttendance: vi.fn(async () => ({ participants: [] })),
    getOccurrenceTimeline: vi.fn(async () => ({ occurrences: [] })),
    markAttendance: mocks.markAttendance,
    syncAttendance: vi.fn(),
    identifyParticipant: vi.fn(),
  },
}));
vi.mock("@/lib/services/google.service", () => ({
  googleService: {
    getGoogleCredentials: vi.fn(async () => ({
      credentials: null,
      redirectUri: "https://be-app.ailinc.com/accounts/clients/34/google/oauth/callback/",
    })),
    startConnect: vi.fn(),
  },
}));

import { AttendanceCenter } from "./AttendanceCenter";
import { GoogleSetupCard } from "./GoogleSetupCard";
import { ZoomSetupCard } from "./ZoomSetupCard";
import { AssignParticipantDialog } from "./AssignParticipantDialog";
import { RecurrenceControls } from "./RecurrenceControls";

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

const roster: LiveSessionRosterResponse = {
  course_tagged: true,
  enrolled_count: 2,
  joined_count: 1,
  missed_count: 1,
  session_started: true,
  session_ended: true,
  synced_at: null,
  sync_available: true,
  reliability_note: "",
  unmatched_participants: [],
  students: [
    { user_profile_id: 1, name: "Aarav Sharma", email: "aarav.sharma@example.com", attended: false, duration_seconds: 0, join_time: null, leave_time: null },
    { user_profile_id: 2, name: "Meera Iyer", email: "meera@example.com", attended: true, duration_seconds: 3000, join_time: "2026-07-26T05:56:00Z", leave_time: "2026-07-26T06:46:00Z" },
  ],
};

describe("attendance roster", () => {
  beforeEach(() => mocks.getRoster.mockResolvedValue(roster));

  it("is one card per student on a phone, with the full name, the full email and a 44px action", async () => {
    phone = true;
    render(<AttendanceCenter liveClassId={162} isRecurring={false} meetingStatus="expired" />);
    const cards = await screen.findAllByTestId("attendance-phone-card");
    expect(cards).toHaveLength(2);
    expect(screen.queryByRole("table")).toBeNull();
    const missed = cards.find((c) => within(c).queryByText("Aarav Sharma"))!;
    expect(within(missed).getByText("aarav.sharma@example.com")).toBeTruthy();
    const mark = within(missed).getByRole("button", { name: "Mark present" });
    expect(getComputedStyle(mark).minHeight).toBe("44px");
    // The card calls the very same handler the table row does.
    fireEvent.click(mark);
    await waitFor(() =>
      expect(mocks.markAttendance).toHaveBeenCalledWith(162, { student_id: 1, present: true }),
    );
  });

  it("is the original table on a desktop", async () => {
    render(<AttendanceCenter liveClassId={162} isRecurring={false} meetingStatus="expired" />);
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Aarav Sharma")).toBeTruthy();
    expect(screen.queryByTestId("attendance-phone-card")).toBeNull();
  });

  it("gives the search and Sync controls phone-only full width and 44px", async () => {
    phone = true;
    render(<AttendanceCenter liveClassId={162} isRecurring={false} meetingStatus="expired" />);
    await screen.findAllByTestId("attendance-phone-card");
    const sync = screen.getByRole("button", { name: "Sync attendance" });
    expectPhoneOnly(sync, /min-height:44px/);
    const search = screen.getByPlaceholderText("Search name or email…").closest(".MuiTextField-root")!;
    expect(styleAt(search, PHONE, "width")).toBe("100%");
    expect(styleAt(search, DESKTOP, "min-width")).toBe("220px");
  });
});

describe("Google Meet setup card", () => {
  it("fits a phone: the copy column takes the whole row and may shrink", async () => {
    render(<GoogleSetupCard />);
    const title = await screen.findByText("Connect Google to host Meet sessions");
    const item = title.parentElement!.parentElement!.parentElement!;
    expect(styleAt(item, PHONE, "flex-basis")).toBe("100%");
    expect(styleAt(item, PHONE, "min-width")).toBe("0");
    expect(styleAt(item, DESKTOP, "flex-basis")).toBeNull();
    expect(styleAt(item, DESKTOP, "flex")).toBe("1 1 320px");
    expectPhoneOnly(item, /flex-basis:100%/);
  });

  it("has a 44px copy button on a phone only", async () => {
    render(<GoogleSetupCard />);
    const copy = await screen.findByRole("button", { name: "Copy redirect URI" });
    expect(styleAt(copy, PHONE, "width")).toBe("44px");
    expectPhoneOnly(copy, /width:44px/);
  });
});

describe("Zoom setup card", () => {
  it("lets its copy column take the whole row on a phone", () => {
    render(
      <ZoomSetupCard
        status={{
          loading: false,
          configured: true,
          active: false,
          webhookConfigured: false,
          webhookUrl: "https://be-app.ailinc.com/live-class/api/zoom/webhook/34/a-very-long-token-value/",
          oauthAvailable: false,
          oauthConnected: false,
          connectedEmail: null,
          needsReconnect: false,
        }}
        onConfigure={vi.fn()}
      />,
    );
    const title = screen.getByText("Finish connecting Zoom");
    const item = title.parentElement!.parentElement!.parentElement!;
    expect(styleAt(item, PHONE, "flex-basis")).toBe("100%");
    expect(styleAt(item, DESKTOP, "flex")).toBe("1 1 320px");
    const copy = screen.getByRole("button", { name: "Copy webhook URL" });
    expectPhoneOnly(copy, /width:44px/);
  });
});

describe("live-session dialogs", () => {
  it("are a full-width bottom sheet with 44px actions on a phone, the centred card elsewhere", () => {
    render(
      <AssignParticipantDialog
        liveClassId={162}
        participant={{ participant_id: 5, name: "Guest 5", email: "", duration_seconds: 600, join_time: null, leave_time: null }}
        students={roster.students}
        onClose={vi.fn()}
        onDone={vi.fn()}
      />,
    );
    const root = document.querySelector(".MuiDialog-root")!;
    const css = cssByMedia(root);
    expect(css.phone).toMatch(/\.MuiDialog-container\{[^}]*align-items:flex-end/);
    expect(css.phone).toMatch(/\.MuiDialog-paper\{[^}]*border-radius:20px 20px 0 0/);
    expect(css.phone).toMatch(/\.MuiDialogActions-root \.MuiButton-root\{min-height:44px/);
    expect(css.unscoped).not.toMatch(/20px 20px 0 0|align-items:flex-end|min-height:44px/);
  });
});

describe("recurring rules", () => {
  it("make the weekday chips, radios and fields 44px on a phone only", () => {
    const { container } = render(<RecurrenceControls startDatetime="2026-10-05T10:00" onChange={vi.fn()} />);
    const root = container.firstElementChild!;
    expectPhoneOnly(root, /\.MuiChip-root\{height:44px/);
    expectPhoneOnly(root, /\.MuiRadio-root\{width:44px/);
    expectPhoneOnly(root, /\.MuiInputBase-root\{min-height:44px/);
  });
});
