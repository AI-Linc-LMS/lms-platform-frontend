"use client";

import type { ReactNode } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

/* ==========================================================================
 * A table on a desktop, a stack of cards on a phone.
 *
 * Measured on an iPhone: /tickets renders a 794px table inside a horizontal scroller on a 390px
 * screen, so a learner reads their ticket list two columns at a time, sideways. Putting a table in
 * a scroller is not a mobile layout, it is a desktop layout you can drag.
 *
 * The caller describes its columns once. Above `sm` that is the same table as before; below it,
 * each row becomes a card with the columns as label/value pairs, and the columns marked `primary`
 * become the card's title line.
 * ======================================================================== */

export interface RowColumn<T> {
  key: string;
  header: ReactNode;
  /** The cell. Same render on both layouts, so the two can never disagree. */
  cell: (row: T) => ReactNode;
  /** Part of the card's title line on a phone, instead of a labelled pair. */
  primary?: boolean;
  /** Dropped from the card on a phone (an id column, a duplicate of the title). */
  hideOnPhone?: boolean;
  align?: "left" | "right" | "center";
  width?: number | string;
}

export interface ResponsiveRowsProps<T> {
  columns: RowColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** Shown instead of an empty table/stack. */
  empty?: ReactNode;
  caption?: string;
  "data-testid"?: string;
}

export function ResponsiveRows<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  caption,
  ...rest
}: ResponsiveRowsProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  const primary = columns.filter((c) => c.primary);
  const detail = columns.filter((c) => !c.primary && !c.hideOnPhone);

  return (
    <Box {...rest}>
      {/* Phone: one card per row. */}
      <Box sx={{ display: { xs: "flex", sm: "none" }, flexDirection: "column", gap: 1.25 }}>
        {rows.map((row) => (
          <Box
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }
                : undefined
            }
            sx={{
              p: 1.75,
              borderRadius: 3,
              border: "1px solid var(--border-default, #eef2f7)",
              backgroundColor: "var(--card-bg, #fff)",
              minWidth: 0,
              cursor: onRowClick ? "pointer" : "default",
            }}
          >
            {primary.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: detail.length ? 1.25 : 0, minWidth: 0 }}>
                {primary.map((c) => (
                  <Box key={c.key} sx={{ minWidth: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--font-primary)" }}>
                    {c.cell(row)}
                  </Box>
                ))}
              </Box>
            )}
            {detail.length > 0 && (
              <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 0.75, columnGap: 1.5, "& > *": { minWidth: 0 } }}>
                {detail.map((c) => (
                  <Box key={c.key} sx={{ display: "contents" }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--font-tertiary)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                      {c.header}
                    </Typography>
                    <Box sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", minWidth: 0 }}>{c.cell(row)}</Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Tablet and up: the table it always was. */}
      <TableContainer sx={{ display: { xs: "none", sm: "block" } }}>
        <Table size="small" aria-label={caption}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align} sx={{ width: c.width, fontWeight: 800 }}>
                  {c.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover={Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align}>
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
