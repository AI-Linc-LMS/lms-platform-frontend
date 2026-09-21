"use client";

import type { FocusEvent, MouseEvent, ReactNode } from "react";
import { Box, Chip, Typography, type SxProps, type Theme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResponsiveRows, type RowColumn } from "@/components/common/mobile/ResponsiveRows";
import { TicketStatusChip } from "./TicketStatusChip";
import type { Ticket } from "@/lib/services/ticket.service";

/* ==========================================================================
 * The ticket lists, described once.
 *
 * Measured on an iPhone 14 (390px): /tickets rendered a 794px <table> inside a horizontal
 * scroller, so a learner read their own ticket list two columns at a time by dragging it
 * sideways. The admin queue was worse - nine columns. A table in a scroller is not a mobile
 * layout, it is a desktop layout you can drag.
 *
 * Both lists now go through ResponsiveRows: the same columns render as the table they always
 * were from `sm` up, and as one card per ticket below it. The column definitions live here so
 * the learner list and the admin queue cannot drift apart, and so the cell renderers - which
 * are shared by both layouts by construction - can be tested without mounting a page.
 * ======================================================================== */

export function formatTicketDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * A column heading. It is the table's header cell on a desktop AND the card's field label on a
 * phone, so it carries both sizes: the dense 11.5px the table has always used, stepped up to
 * 12px on a phone where nothing may go below that.
 */
function Label({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        fontSize: { xs: "0.75rem", sm: "0.72rem" },
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: "var(--font-secondary)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function MetaText({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{ color: "var(--font-secondary)", fontSize: { xs: "0.85rem", sm: "0.825rem" } }}
    >
      {children}
    </Box>
  );
}

/**
 * The subject, plus the first line of the description when it adds anything.
 *
 * One cell, two shapes: a table cell can only ever be one clipped line, a card can afford two
 * wrapped ones - which is the difference between "Certificate name is wrong on my..." and
 * knowing what the ticket is about.
 */
function SubjectCell({ ticket }: { ticket: Ticket }) {
  const clamp = (lines: number): SxProps<Theme> => ({
    display: { xs: "-webkit-box", sm: "block" },
    WebkitLineClamp: { xs: lines, sm: "none" },
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: { xs: "normal", sm: "nowrap" },
  });
  return (
    <Box sx={{ minWidth: 0, maxWidth: { sm: 360 } }}>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: { xs: "0.95rem", sm: "0.875rem" },
          lineHeight: { xs: 1.35, sm: 1.43 },
          color: "var(--ticket-text-strong)",
          ...clamp(2),
        }}
      >
        {ticket.subject}
      </Typography>
      {ticket.description && ticket.description !== ticket.subject && (
        <Typography
          sx={{
            mt: { xs: 0.35, sm: 0 },
            fontWeight: 400,
            fontSize: { xs: "0.8rem", sm: "0.75rem" },
            lineHeight: { xs: 1.4, sm: 1.66 },
            color: "var(--font-secondary)",
            ...clamp(2),
          }}
        >
          {ticket.description}
        </Typography>
      )}
    </Box>
  );
}

function CategoryChip({ label }: { label: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: { xs: 26, sm: 22 },
        maxWidth: "100%",
        fontSize: { xs: "0.75rem", sm: "0.7rem" },
        fontWeight: 600,
        backgroundColor: "var(--surface-indigo-light)",
        color: "var(--ticket-brand-strong)",
        border: "1px solid var(--ticket-brand-soft)",
      }}
    />
  );
}

function TicketNumber({ id }: { id: number }) {
  return (
    <Box
      component="span"
      data-ticket-id={id}
      sx={{
        color: "var(--font-secondary)",
        fontWeight: 600,
        fontSize: "0.85rem",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      #{id}
    </Box>
  );
}

/** What last happened to the ticket: a resolution date, a reopen date, or "not yet answered". */
export function UpdatedCell({ ticket }: { ticket: Ticket }) {
  if (ticket.status === "RESOLVED" && ticket.resolved_at) {
    return <MetaText>{formatTicketDate(ticket.resolved_at)}</MetaText>;
  }
  if (ticket.reopened_at) {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: "var(--font-secondary)",
          fontSize: { xs: "0.85rem", sm: "0.825rem" },
        }}
      >
        <IconWrapper icon="mdi:lock-reset" size={14} color="var(--ticket-reopen)" />
        {formatTicketDate(ticket.updated_at || ticket.reopened_at)}
      </Box>
    );
  }
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        color: "var(--font-tertiary)",
        fontSize: { xs: "0.85rem", sm: "0.825rem" },
      }}
      title="Awaiting first response"
    >
      <IconWrapper icon="mdi:clock-outline" size={16} color="var(--font-tertiary)" />
      <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
        Awaiting a reply
      </Box>
    </Box>
  );
}

/**
 * The table chrome the two pages had inline before the move. ResponsiveRows owns the markup, so
 * the per-page look (row dividers, header padding, hover) is applied from the outside - which
 * keeps the desktop table pixel-for-pixel what it was.
 */
const TABLE_CHROME: SxProps<Theme> = {
  "& .MuiTableHead-root .MuiTableCell-root": {
    py: 1.75,
    borderBottom: "1px solid var(--border-default)",
    backgroundColor: "var(--card-bg)",
  },
  // Size "small" in ResponsiveRows pads cells by 6px; the ticket tables were always the
  // default 16px, so the body rows are put back to exactly that height.
  "& .MuiTableBody-root .MuiTableCell-root": {
    py: 2,
    borderBottom: "1px solid var(--ticket-row-divider)",
  },
  "& .MuiTableBody-root .MuiTableRow-root": {
    transition: "background-color 0.12s ease",
    "&:hover": { backgroundColor: "var(--surface)" },
  },
};

const CHEVRON: RowColumn<Ticket> = {
  key: "go",
  header: "",
  // Dropped from the card: a whole card that is one tap target does not need an arrow telling
  // you so, and it would only steal width from the subject.
  hideOnPhone: true,
  align: "right",
  cell: () => <IconWrapper icon="mdi:chevron-right" size={18} color="var(--border-light)" />,
};

interface RowsProps {
  tickets: Ticket[];
  onOpen: (ticket: Ticket) => void;
  /**
   * Called when a pointer rests on a row or a card takes focus - the moment the old table
   * prefetched the ticket's detail route. ResponsiveRows has no per-row hover hook, so it is
   * delegated from the wrapper: the row is found from the event target and the ticket from the
   * id cell inside it.
   */
  onIntent?: (ticket: Ticket) => void;
  "data-tour-id"?: string;
}

function intentHandlers(tickets: Ticket[], onIntent?: (ticket: Ticket) => void) {
  if (!onIntent) return {};
  const fire = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const row = target.closest("tr, [role='button']");
    const id = row?.querySelector("[data-ticket-id]")?.getAttribute("data-ticket-id");
    const ticket = id ? tickets.find((t) => String(t.id) === id) : undefined;
    if (ticket) onIntent(ticket);
  };
  return {
    onMouseOver: (e: MouseEvent) => fire(e.target),
    onFocus: (e: FocusEvent) => fire(e.target),
  };
}

/** The learner's own tickets. */
export function MyTicketRows({ tickets, onOpen, onIntent, ...rest }: RowsProps) {
  const columns: RowColumn<Ticket>[] = [
    { key: "id", header: <Label>ID</Label>, cell: (t) => <TicketNumber id={t.id} /> },
    { key: "subject", header: <Label>Subject</Label>, primary: true, cell: (t) => <SubjectCell ticket={t} /> },
    { key: "category", header: <Label>Category</Label>, cell: (t) => <CategoryChip label={t.category_display} /> },
    { key: "status", header: <Label>Status</Label>, primary: true, cell: (t) => <TicketStatusChip status={t.status} /> },
    { key: "created", header: <Label>Created</Label>, cell: (t) => <MetaText>{formatTicketDate(t.created_at)}</MetaText> },
    { key: "updated", header: <Label>Updated</Label>, cell: (t) => <UpdatedCell ticket={t} /> },
    CHEVRON,
  ];
  return (
    <Box sx={TABLE_CHROME} {...intentHandlers(tickets, onIntent)} {...rest}>
      <ResponsiveRows
        columns={columns}
        rows={tickets}
        rowKey={(t) => t.id}
        onRowClick={onOpen}
        caption="My support tickets"
      />
    </Box>
  );
}

function PersonCell({ name, sub }: { name: string; sub?: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: { xs: "0.85rem", sm: "0.875rem" },
          color: "var(--ticket-text-strong)",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </Typography>
      {sub && (
        <Typography
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.72rem" },
            color: "var(--font-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}

/** The admin / instructor triage queue. */
export function AdminTicketRows({ tickets, onOpen, onIntent, ...rest }: RowsProps) {
  const columns: RowColumn<Ticket>[] = [
    { key: "id", header: <Label>ID</Label>, cell: (t) => <TicketNumber id={t.id} /> },
    { key: "subject", header: <Label>Subject</Label>, primary: true, cell: (t) => <SubjectCell ticket={t} /> },
    {
      key: "from",
      header: <Label>From</Label>,
      cell: (t) => <PersonCell name={t.raised_by?.full_name || "-"} sub={t.raised_by?.email} />,
    },
    // Which batch it came from and who owns it — the two things needed to decide whether a
    // ticket is already someone's problem.
    {
      key: "cohort",
      header: <Label>Cohort</Label>,
      cell: (t) => (
        <Box component="span" sx={{ color: "var(--ticket-text-strong)", fontSize: { xs: "0.85rem", sm: "0.875rem" } }}>
          {t.cohort_name || "—"}
        </Box>
      ),
    },
    {
      key: "assigned",
      header: <Label>Assigned to</Label>,
      cell: (t) =>
        t.assigned_to_user ? (
          <PersonCell
            name={t.assigned_to_user.full_name}
            // No assigner means the system routed it, not a human.
            sub={t.assigned_by_user === null ? "auto-routed" : `by ${t.assigned_by_user.full_name}`}
          />
        ) : (
          <MetaText>Unassigned</MetaText>
        ),
    },
    { key: "category", header: <Label>Category</Label>, cell: (t) => <CategoryChip label={t.category_display} /> },
    {
      key: "status",
      header: <Label>Status</Label>,
      primary: true,
      cell: (t) => (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <TicketStatusChip status={t.status} />
          {t.reopened_at && (
            <Chip
              label="Reopened"
              size="small"
              icon={<IconWrapper icon="mdi:lock-reset" size={12} color="var(--warning-strong)" />}
              sx={{
                height: { xs: 26, sm: 22 },
                fontSize: { xs: "0.75rem", sm: "0.65rem" },
                fontWeight: 700,
                letterSpacing: 0.3,
                backgroundColor: "var(--ticket-reopen-bg)",
                color: "var(--warning-strong)",
                border: "1px solid var(--ticket-reopen-border)",
                "& .MuiChip-icon": { ml: 0.5, mr: -0.25 },
              }}
            />
          )}
        </Box>
      ),
    },
    { key: "created", header: <Label>Created</Label>, cell: (t) => <MetaText>{formatTicketDate(t.created_at)}</MetaText> },
    CHEVRON,
  ];
  return (
    <Box sx={TABLE_CHROME} {...intentHandlers(tickets, onIntent)} {...rest}>
      <ResponsiveRows
        columns={columns}
        rows={tickets}
        rowKey={(t) => t.id}
        onRowClick={onOpen}
        caption="Support ticket queue"
      />
    </Box>
  );
}
