"use client";

import { Chip, ChipProps } from "@mui/material";
import { TicketStatus } from "@/lib/services/ticket.service";

const STATUS_STYLES: Record<
  TicketStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  OPEN: {
    label: "Open",
    bg: "var(--ticket-status-open-bg)",
    color: "var(--proctoring-subheading)",
    border: "var(--ticket-status-open-border)",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "var(--ticket-status-in-progress-bg)",
    color: "var(--ticket-status-in-progress-text)",
    border: "var(--ticket-status-in-progress-border)",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "var(--ticket-success-soft)",
    color: "var(--ticket-success-strong)",
    border: "var(--ticket-success-border)",
  },
};

interface Props extends Omit<ChipProps, "label"> {
  status: TicketStatus;
}

export function TicketStatusChip({ status, sx, ...rest }: Props) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.OPEN;
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontWeight: 600,
        fontSize: "0.75rem",
        height: 24,
        ...sx,
      }}
      {...rest}
    />
  );
}
