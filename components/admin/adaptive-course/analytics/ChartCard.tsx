"use client";

import { ReactNode, useState } from "react";
import { Box, Typography, IconButton, Tooltip, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Card wrapper for every chart on the performance page.
 *
 * It exists to enforce two accessibility rules rather than leave them to each chart:
 *  - a TABLE VIEW twin is always one click away (the relief rule — our light-mode aqua
 *    and magenta series sit below 3:1 on the surface, and a tooltip must never be the
 *    only way to read a value);
 *  - the value is always reachable without color (the table is the WCAG-clean equivalent).
 */
export function ChartCard({
  title,
  subtitle,
  icon,
  children,
  table,
  height = 260,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  /** Table-view twin: headers + rows of the same data. */
  table?: { head: string[]; rows: (string | number)[][] };
  height?: number;
  action?: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 3,
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: subtitle ? 0.25 : 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {icon && <IconWrapper icon={icon} size={18} color="var(--font-tertiary, #8b8b98)" />}
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--font-primary)" }}>{title}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {action}
          {table && (
            <Tooltip title={showTable ? "Show chart" : "Show data table"} arrow>
              <IconButton size="small" onClick={() => setShowTable((v) => !v)} aria-label={showTable ? "Show chart" : "Show data table"}>
                <IconWrapper icon={showTable ? "mdi:chart-box-outline" : "mdi:table"} size={17} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      {subtitle && (
        <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary, #8b8b98)", mb: 1.25, lineHeight: 1.45 }}>
          {subtitle}
        </Typography>
      )}

      {/* Size the container to include the axis band — never a fixed height that clips it. */}
      <Box sx={{ flex: 1, minHeight: height, minWidth: 0 }}>
        {/* The card NEVER decides emptiness for the chart. It used to blank the whole body
            whenever `table.rows` was empty, which erased real content — CodingInsights'
            Solved/Acceptance tiles disappeared merely because there were no misconceptions to
            diagnose. Each chart owns its own empty state; the card only owns the table twin. */}
        {showTable && table ? (
          table.rows.length === 0 ? (
            <EmptyState message="Nothing to tabulate yet." />
          ) : (
            <Box sx={{ maxHeight: height, overflow: "auto" }}>
              <Table size="small" sx={{ "& td, & th": { fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" } }}>
                <TableHead>
                  <TableRow>
                    {table.head.map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {table.rows.map((r, i) => (
                    <TableRow key={i}>
                      {r.map((c, j) => (
                        <TableCell key={j}>{c}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}

/** A zero-activity student is the common case right after enrolment — say so plainly. */
export function EmptyState({ message = "No activity recorded yet." }: { message?: string }) {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.75,
        color: "var(--font-tertiary, #8b8b98)",
      }}
    >
      <IconWrapper icon="mdi:chart-line-variant" size={26} color="var(--font-tertiary, #8b8b98)" />
      <Typography sx={{ fontSize: "0.8rem" }}>{message}</Typography>
    </Box>
  );
}

/** Recharts tooltip styled to the app surface. Tooltips enhance; the table view is the fallback. */
export const tooltipStyles = {
  contentStyle: {
    background: "var(--card-bg, #fff)",
    border: "1px solid var(--border-default, #ececf1)",
    borderRadius: 10,
    fontSize: "0.75rem",
    boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
  },
  labelStyle: { color: "var(--font-secondary, #52514e)", fontWeight: 600, marginBottom: 2 },
} as const;
