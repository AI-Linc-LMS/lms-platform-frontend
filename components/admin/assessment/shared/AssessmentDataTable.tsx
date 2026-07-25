"use client";

/**
 * AssessmentDataTable - a generic, fully tokenized table primitive for the
 * assessment-management admin redesign.
 *
 * Renders an MUI Table inside a rounded hairline card. The header uses the
 * surface token with uppercase, letter-spaced labels; body rows carry hairline
 * bottom borders and become clickable when `onRowClick` is provided. Columns
 * support alignment, sizing and responsive hiding via `hideBelow`. All colors
 * come from CSS custom properties so the table is theme-aware out of the box.
 *
 * @example
 * <AssessmentDataTable<Assessment>
 *   columns={[
 *     { key: "title", header: "Title", minWidth: 200 },
 *     { key: "status", header: "Status", render: (r) => <StatusChip s={r.status} /> },
 *     { key: "createdAt", header: "Created", align: "right", hideBelow: "sm" },
 *   ]}
 *   rows={assessments}
 *   rowKey={(r) => r.id}
 *   onRowClick={(r) => openAssessment(r)}
 *   emptyState={<EmptyAssessments />}
 * />
 */

import * as React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

export interface AssessmentColumn<T> {
  /** Stable identity for the column; also the fallback value accessor when `render` is omitted. */
  key: string;
  /** Header content (text or node). */
  header: React.ReactNode;
  /** Cell renderer. When omitted, the raw `(row as any)[key]` value is shown. */
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: number | string;
  minWidth?: number;
  /** Hide this column at/below the given breakpoint (e.g. "sm" hides below sm). */
  hideBelow?: "sm" | "md" | "lg";
}

export interface AssessmentDataTableProps<T> {
  columns: AssessmentColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  dense?: boolean;
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
}

/** Maps a `hideBelow` breakpoint to a responsive `display` sx that hides the cell below it. */
function hideSx(
  hideBelow?: AssessmentColumn<unknown>["hideBelow"]
): Record<string, string> | undefined {
  if (!hideBelow) return undefined;
  // Hidden from xs up to (but not including) the named breakpoint, then shown.
  return { xs: "none", [hideBelow]: "table-cell" };
}

export function AssessmentDataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  dense,
  emptyState,
  stickyHeader = true,
}: AssessmentDataTableProps<T>): React.ReactElement {
  const clickable = Boolean(onRowClick);
  const size = dense ? "small" : "medium";

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        background: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
        <Table stickyHeader={stickyHeader} size={size} aria-rowcount={rows.length}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align ?? "left"}
                  sx={{
                    background: "var(--surface)",
                    color: "var(--font-tertiary)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    lineHeight: 1.4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid var(--border-default)",
                    width: col.width,
                    minWidth: col.minWidth,
                    ...(hideSx(col.hideBelow)
                      ? { display: hideSx(col.hideBelow) }
                      : null),
                  }}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0
              ? emptyState != null && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      sx={{
                        borderBottom: "none",
                        p: 0,
                        color: "var(--font-secondary)",
                      }}
                    >
                      {emptyState}
                    </TableCell>
                  </TableRow>
                )
              : rows.map((row) => (
                  <TableRow
                    key={rowKey(row)}
                    hover
                    onClick={clickable ? () => onRowClick?.(row) : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick?.(row);
                            }
                          }
                        : undefined
                    }
                    sx={{
                      cursor: clickable ? "pointer" : "default",
                      transition: "background 120ms ease",
                      "&:last-of-type td": { borderBottom: "none" },
                      "&:hover": clickable
                        ? { background: "var(--surface)" }
                        : undefined,
                      "&.MuiTableRow-hover:hover": {
                        backgroundColor: "var(--surface)",
                      },
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        align={col.align ?? "left"}
                        sx={{
                          color: "var(--font-primary)",
                          fontSize: dense ? "0.82rem" : "0.875rem",
                          borderBottom: "1px solid var(--border-default)",
                          width: col.width,
                          minWidth: col.minWidth,
                          ...(hideSx(col.hideBelow)
                            ? { display: hideSx(col.hideBelow) }
                            : null),
                        }}
                      >
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[
                              col.key
                            ] as React.ReactNode)}
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

export default AssessmentDataTable;
