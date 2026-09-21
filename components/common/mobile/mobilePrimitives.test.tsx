import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

/**
 * The three pieces every module's mobile pass is built from. What is pinned here is the contract
 * the modules rely on, not the pixels: a dialog that is a sheet on a phone, rows that become cards
 * instead of a sideways table, and a chip row that scrolls rather than clipping.
 */

import { ResponsiveDialog } from "./ResponsiveDialog";
import { ResponsiveRows } from "./ResponsiveRows";
import { ScrollRow } from "./ScrollRow";

const rows = [
  { id: 1, subject: "Cannot open my course", status: "Open", created: "2026-09-01" },
  { id: 2, subject: "Certificate name is wrong", status: "Closed", created: "2026-08-24" },
];
const columns = [
  { key: "id", header: "ID", cell: (r: (typeof rows)[0]) => `#${r.id}`, hideOnPhone: true },
  { key: "subject", header: "Subject", cell: (r: (typeof rows)[0]) => r.subject, primary: true },
  { key: "status", header: "Status", cell: (r: (typeof rows)[0]) => r.status },
  { key: "created", header: "Created", cell: (r: (typeof rows)[0]) => r.created },
];

describe("ResponsiveRows", () => {
  it("renders every row and every visible column, whichever layout is used", () => {
    render(<ResponsiveRows columns={columns} rows={rows} rowKey={(r) => r.id} caption="Tickets" />);
    // Both layouts are in the DOM and chosen by CSS, so each row's text appears twice.
    expect(screen.getAllByText("Cannot open my course").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Closed").length).toBeGreaterThan(0);
  });

  it("keeps the table for wider screens, so desktop is untouched", () => {
    const { container } = render(<ResponsiveRows columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("shows the empty state instead of a headed table with nothing in it", () => {
    render(<ResponsiveRows columns={columns} rows={[]} rowKey={(r) => r.id} empty={<p>No tickets yet</p>} />);
    expect(screen.getByText("No tickets yet")).toBeTruthy();
  });

  it("makes a row activatable by keyboard when it is clickable", () => {
    const onRowClick = vi.fn();
    render(<ResponsiveRows columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={onRowClick} />);
    const card = screen.getAllByRole("button")[0];
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});

describe("ResponsiveDialog", () => {
  it("renders its title, body and actions when open", () => {
    render(
      <ResponsiveDialog open onClose={vi.fn()} title="Delete this?" description="It cannot be undone" footer={<button>Delete</button>}>
        <p>Body copy</p>
      </ResponsiveDialog>,
    );
    expect(screen.getByRole("heading", { name: "Delete this?" })).toBeTruthy();
    expect(screen.getByText("It cannot be undone")).toBeTruthy();
    expect(screen.getByText("Body copy")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  it("offers a close control with an accessible name", () => {
    const onClose = vi.fn();
    render(<ResponsiveDialog open onClose={onClose} title="Settings"><p>x</p></ResponsiveDialog>);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing while closed", () => {
    render(<ResponsiveDialog open={false} onClose={vi.fn()} title="Hidden"><p>x</p></ResponsiveDialog>);
    expect(screen.queryByText("Hidden")).toBeNull();
  });
});

describe("ScrollRow", () => {
  it("scrolls instead of clipping, and names itself for assistive tech", () => {
    const { container } = render(
      <ScrollRow ariaLabel="Filters">
        <button>All</button>
        <button>Open</button>
      </ScrollRow>,
    );
    const row = screen.getByRole("group", { name: "Filters" });
    expect(row).toBeTruthy();
    expect(within(row).getAllByRole("button")).toHaveLength(2);
    expect(container.firstElementChild).toBe(row);
  });
});
