import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { AdminTicketRows, MyTicketRows } from "./TicketRows";
import type { Ticket } from "@/lib/services/ticket.service";

/**
 * The ticket lists on a phone.
 *
 * Measured on an iPhone 14 (390px wide), signed in against the demo tenant: /tickets rendered a
 * 794px <table> inside a MuiTableContainer scroller. A learner opening their own support tickets
 * on a phone could see two columns at a time and had to drag the list sideways to find out
 * whether anyone had answered. The admin queue was the same shape with nine columns.
 *
 * jsdom has no layout engine, so nothing here measures a width. What it pins is the structure
 * that makes the width right: below `sm` each ticket is ONE card that is ONE tap target, and the
 * table that used to be the only option still exists for a desktop.
 */

const ticket = (over: Partial<Ticket> = {}): Ticket =>
  ({
    id: 412,
    category: "technical",
    category_display: "Technical Support",
    subject: "I cannot open my Python course",
    description: "The page spins forever after I click Continue learning.",
    status: "OPEN",
    status_display: "Open",
    user_attachments: [],
    admin_resolution_notes: "",
    admin_attachments: [],
    course_id: null,
    content_id: null,
    page_url: "",
    raised_by: { id: 8, user_id: 8, email: "asha@example.com", full_name: "Asha Rao", role: "student" },
    resolved_by_user: null,
    cohort: 3,
    cohort_name: "Batch 28",
    assigned_to_user: null,
    assigned_by_user: null,
    assigned_at: null,
    resolved_at: null,
    reopened_at: null,
    resolution_history: [],
    reopen_history: [],
    created_at: "2026-09-01T09:00:00Z",
    updated_at: null,
    ...over,
  }) as Ticket;

/** The phone layout: one card per ticket, each a single activatable target. */
const cards = () => screen.queryAllByRole("button");

describe("the learner's ticket list", () => {
  it("gives a phone one card per ticket instead of a sideways table", () => {
    const rows = [ticket(), ticket({ id: 413, subject: "Certificate name is wrong" })];
    const { container } = render(<MyTicketRows tickets={rows} onOpen={vi.fn()} />);

    // Before this change the ONLY thing a phone got was the table below.
    expect(cards()).toHaveLength(2);
    // And the table a desktop has always had is still there, chosen by CSS rather than by JS,
    // so the two can never disagree about what a row says.
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("makes the whole card the tap target, not a 794px row you must find", () => {
    const onOpen = vi.fn();
    const rows = [ticket(), ticket({ id: 413 })];
    render(<MyTicketRows tickets={rows} onOpen={onOpen} />);

    fireEvent.click(cards()[1]);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen.mock.calls[0][0].id).toBe(413);
  });

  it("opens a ticket from the keyboard too", () => {
    const onOpen = vi.fn();
    render(<MyTicketRows tickets={[ticket()]} onOpen={onOpen} />);
    fireEvent.keyDown(cards()[0], { key: "Enter" });
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 412 }));
  });

  it("still says everything the table said - subject, category, status and dates", () => {
    render(<MyTicketRows tickets={[ticket()]} onOpen={vi.fn()} />);
    for (const text of ["I cannot open my Python course", "Technical Support", "Open", "#412"]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it("spells out an unanswered ticket on a phone rather than leaving a bare clock icon", () => {
    // In the table the "Updated" column was an icon with a title attribute. A title tooltip does
    // not exist on a touch device, so on a card the state is written out.
    render(<MyTicketRows tickets={[ticket()]} onOpen={vi.fn()} />);
    expect(screen.getAllByText("Awaiting a reply").length).toBeGreaterThan(0);
  });

  it("still warms a ticket's page when the pointer rests on its row", () => {
    // The old table prefetched /tickets/[id] on hover. ResponsiveRows owns the rows now, so the
    // hook is delegated - this pins that hovering a desktop row, or focusing a card, still says
    // WHICH ticket.
    const onIntent = vi.fn();
    const rows = [ticket(), ticket({ id: 413 })];
    const { container } = render(<MyTicketRows tickets={rows} onOpen={vi.fn()} onIntent={onIntent} />);

    const secondRow = container.querySelectorAll("tbody tr")[1];
    fireEvent.mouseOver(secondRow.querySelector("td") as Element);
    expect(onIntent).toHaveBeenLastCalledWith(expect.objectContaining({ id: 413 }));

    fireEvent.focus(cards()[0]);
    expect(onIntent).toHaveBeenLastCalledWith(expect.objectContaining({ id: 412 }));
  });

  it("renders nothing to tap when there are no tickets", () => {
    render(<MyTicketRows tickets={[]} onOpen={vi.fn()} />);
    expect(cards()).toHaveLength(0);
  });
});

describe("the admin triage queue", () => {
  it("becomes cards on a phone, keeping the columns triage depends on", () => {
    const rows = [
      ticket({
        id: 500,
        assigned_to_user: { id: 2, user_id: 2, email: "sam@x.com", full_name: "Sam Iyer", role: "admin" },
        assigned_by_user: null,
      }),
    ];
    const { container } = render(<AdminTicketRows tickets={rows} onOpen={vi.fn()} />);

    expect(cards()).toHaveLength(1);
    expect(container.querySelector("table")).toBeTruthy();
    // Who raised it, which batch, and who owns it: the three things an admin decides on.
    expect(screen.getAllByText("Asha Rao").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Batch 28").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sam Iyer").length).toBeGreaterThan(0);
    // No assigner means the system routed it, not a human.
    expect(screen.getAllByText("auto-routed").length).toBeGreaterThan(0);
  });

  it("shows an unowned ticket as unassigned", () => {
    render(<AdminTicketRows tickets={[ticket({ id: 501 })]} onOpen={vi.fn()} />);
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
  });

  it("opens the ticket it was tapped on", () => {
    const onOpen = vi.fn();
    render(<AdminTicketRows tickets={[ticket({ id: 77 })]} onOpen={onOpen} />);
    fireEvent.click(cards()[0]);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 77 }));
  });
});

describe("neither page keeps a table in a scroller", () => {
  const read = (p: string): string => readFileSync(join(process.cwd(), p), "utf8");

  it.each([
    ["app/tickets/page.tsx", "MyTicketRows"],
    ["app/admin/tickets/page.tsx", "AdminTicketRows"],
  ])("%s renders %s and no MuiTableContainer of its own", (page, component) => {
    const src = read(page);
    expect(src).toContain(`<${component}`);
    // The measured defect was a <TableContainer> wrapping a <Table>. Re-adding one here would
    // silently restore the 794px sideways list.
    expect(src).not.toContain("<TableContainer");
    expect(src).not.toContain("<Table>");
  });

  it("does not double-gutter the page it is on", () => {
    // MainLayout already pads by 16px on a phone. Both pages added a second one on top, so the
    // content sat inside 32px of margin on a 390px screen.
    expect(read("app/admin/tickets/page.tsx")).toContain('p: { xs: 0, sm: 2, md: 4 }');
    expect(read("app/tickets/[id]/page.tsx")).toContain("p: { xs: 0, md: 4 }");
  });
});
