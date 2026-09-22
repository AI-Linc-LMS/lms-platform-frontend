/**
 * The admin ticket detail on a phone.
 *
 * #1642 made the queue and the thread phone-shaped; the detail page's own controls were left at
 * desktop density. Measured at 390px: the status actions were 30px pills in a row that could not
 * wrap, the assignee picker was a 20px line of 12px text, the ticket number and category were
 * 11.2px, and removing an attachment meant hitting a 30px x. These pin the phone sizes in the
 * emitted CSS and prove none of them is visible to a desktop.
 */
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type { Ticket } from "@/lib/services/ticket.service";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "444" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/admin/tickets/444",
}));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
const toast = { showToast: vi.fn() };
vi.mock("@/components/common/Toast", () => ({ useToast: () => toast }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useClientInfo: () => ({ clientInfo: { id: 34, name: "Demo" } }) }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("@/components/tickets/TicketThread", () => ({
  TicketThread: ({ trailing }: { trailing?: ReactNode }) => <div>{trailing}</div>,
}));
vi.mock("@/components/tickets/TicketConversation", () => ({ TicketConversation: () => null }));
vi.mock("@/components/tickets/TicketContactActions", () => ({ TicketContactActions: () => null }));
vi.mock("@/lib/services/admin/admin-instructors.service", () => ({
  adminInstructorsService: {
    listInstructors: vi.fn(async () => [{ id: 9, full_name: "Ben Ito", email: "ben@x.com" }]),
  },
}));
const ticket = {
  id: 444,
  category: "technical",
  category_display: "Technical Support",
  subject: "Video will not play",
  description: "It spins",
  status: "OPEN",
  status_display: "Open",
  user_attachments: [],
  admin_attachments: [],
  admin_resolution_notes: "",
  raised_by: { full_name: "Sara", email: "sara@x.com" },
  assigned_to_user: { id: 9, full_name: "Ben Ito" },
  assigned_by_user: { id: 1, full_name: "Admin" },
  created_at: "2026-09-20T10:00:00Z",
  resolved_at: null,
} as unknown as Ticket;
vi.mock("@/lib/services/ticket.service", () => ({
  ticketService: { get: vi.fn(async () => ticket) },
}));

import AdminTicketDetailPage from "@/app/admin/tickets/[id]/page";

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

describe("admin ticket detail on a phone", () => {
  it("wraps the status actions as 44px pills", async () => {
    render(<AdminTicketDetailPage />);
    const remind = await screen.findByRole("button", { name: "Remind assignee" });
    const row = remind.parentElement!;
    expectPhoneOnly(row, /flex-wrap:wrap/);
    expectPhoneOnly(row, /\.MuiButton-root\{min-height:44px/);
  });

  it("makes the assignee picker a 44px control", async () => {
    render(<AdminTicketDetailPage />);
    await screen.findByText("Ben Ito");
    const picker = document.querySelector(".MuiTextField-root")!;
    expectPhoneOnly(picker, /\.MuiInputBase-root\{min-height:44px/);
  });

  it("raises the ticket number and category to 12px on a phone only", async () => {
    render(<AdminTicketDetailPage />);
    const number = await screen.findByText("Ticket #444");
    const chip = screen.getByText("Technical Support").closest(".MuiChip-root")!;
    for (const el of [number, chip]) {
      const css = cssByMedia(el);
      expect(css.phone).toMatch(/font-size:0\.75rem/);
      // The desktop keeps its authored 0.7rem.
      expect(css.unscoped).toMatch(/font-size:0\.7rem/);
    }
  });

  it("gives the back button a 44px phone target", async () => {
    render(<AdminTicketDetailPage />);
    const back = await screen.findByRole("button", { name: /Back to ticket management/ });
    expectPhoneOnly(back, /min-height:44px/);
  });
});
