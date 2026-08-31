"use client";

import { useCallback, useMemo, useRef, type ReactNode } from "react";
import NextLink from "next/link";
import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatCount } from "@/lib/jobs-v2/format";
import { J, MOTION, TYPE, focusRing, srOnly } from "./jobsTokens";
import { JPanel } from "./Surfaces";
import { DataTableSkeleton } from "./Skeletons";
import { ErrorState } from "./ErrorState";

export type RowId = string | number;

export type Breakpoint = "sm" | "md" | "lg";

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  align?: "start" | "center" | "end";
  sortable?: boolean;
  /** Hidden below this breakpoint. Drop columns by priority, never by squashing them. */
  hideBelow?: Breakpoint;
  render: (row: T) => ReactNode;
  /** A tooltip on the header, for a column whose meaning is not obvious. */
  headerHelp?: string;
}

export interface JDataTableSelection {
  selectedIds: Set<RowId>;
  onChange: (next: Set<RowId>) => void;
  /** The ids on this page that CAN be selected, in visual order. */
  selectableIds: RowId[];
}

export interface JDataTableSort {
  key: string;
  dir: "asc" | "desc";
  onSort: (key: string, dir: "asc" | "desc") => void;
}

export interface JDataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => RowId;
  /** The canonical URL for the row. Renders the primary cell as a real `<Link>`. */
  getRowHref?: (row: T) => string;
  /** Only for rows with no canonical URL. Gives the row `role="button"` and a key handler. */
  onRowClick?: (row: T) => void;
  /** Names the row in the checkbox's accessible label. */
  getRowLabel?: (row: T) => string;
  selection?: JDataTableSelection;
  sort?: JDataTableSort;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: ReactNode;
  emptyFiltered?: ReactNode;
  isFiltered?: boolean;
  dense?: boolean;
  stickyHeader?: boolean;
  /** A visually-hidden `<caption>` naming the table. Required. */
  caption: string;
  /** Below `md` the table becomes this card list. Never LESS data than the table. */
  mobile: (row: T) => ReactNode;
  /** Dim-and-lock the body during a refetch instead of blanking it. */
  refetching?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

const HIDE_BELOW: Record<Breakpoint, Record<string, string>> = {
  sm: { xs: "none", sm: "table-cell" },
  md: { xs: "none", md: "table-cell" },
  lg: { xs: "none", lg: "table-cell" },
};

const ALIGN: Record<NonNullable<Column<unknown>["align"]>, "left" | "center" | "right"> = {
  start: "left",
  center: "center",
  end: "right",
};

/**
 * The module's one table.
 *
 * The two structural rules that fix the shipped lists:
 *   1. **No nested scroller.** No `maxHeight`, no inner `overflow`. The page scrolls and the
 *      header is `position: sticky` against the page — which deletes the double scrollbar on
 *      all three admin lists and the sticky header that stops working past 880px.
 *   2. **The mobile fork is CSS, not `useMediaQuery`.** Both trees render and one is hidden, so
 *      a phone never flashes the desktop table on hydration.
 */
export function JDataTable<T>({
  columns,
  rows,
  getRowId,
  getRowHref,
  onRowClick,
  getRowLabel,
  selection,
  sort,
  loading,
  error,
  onRetry,
  empty,
  emptyFiltered,
  isFiltered,
  dense,
  stickyHeader = true,
  caption,
  mobile,
  refetching,
  sx,
  ...rest
}: JDataTableProps<T>) {
  const { t } = useTranslation("common");
  const anchorRef = useRef<RowId | null>(null);

  const rowLabel = useCallback(
    (row: T) => getRowLabel?.(row) ?? String(getRowId(row)),
    [getRowId, getRowLabel],
  );

  // Memoised: a fresh `[]` on every render would re-create both selection callbacks.
  const selectableIds = useMemo(() => selection?.selectableIds ?? [], [selection]);
  const selectedOnPage = selectableIds.filter((id) => selection?.selectedIds.has(id)).length;
  const allSelected = selectableIds.length > 0 && selectedOnPage === selectableIds.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  const toggleRow = useCallback(
    (id: RowId, shift: boolean) => {
      if (!selection) return;
      const next = new Set(selection.selectedIds);
      const anchor = anchorRef.current;
      const from = anchor === null ? -1 : selectableIds.indexOf(anchor);
      const to = selectableIds.indexOf(id);
      if (shift && from !== -1 && to !== -1) {
        // Shift-click range selection, implemented once, here.
        const [lo, hi] = from <= to ? [from, to] : [to, from];
        const turningOn = !next.has(id);
        for (let i = lo; i <= hi; i += 1) {
          if (turningOn) next.add(selectableIds[i]);
          else next.delete(selectableIds[i]);
        }
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      anchorRef.current = id;
      selection.onChange(next);
    },
    [selectableIds, selection],
  );

  const toggleAll = useCallback(() => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (allSelected) selectableIds.forEach((id) => next.delete(id));
    else selectableIds.forEach((id) => next.add(id));
    anchorRef.current = null;
    selection.onChange(next);
  }, [allSelected, selectableIds, selection]);

  if (loading) {
    return <DataTableSkeleton columns={columns.length + (selection ? 1 : 0)} dense={dense} />;
  }

  if (error) {
    return (
      <JPanel sx={{ p: 0 }}>
        <ErrorState error={error} onRetry={onRetry} variant="panel" sx={{ border: "none" }} />
      </JPanel>
    );
  }

  if (rows.length === 0) {
    return <>{isFiltered ? (emptyFiltered ?? empty) : empty}</>;
  }

  const rowHeight = dense ? 48 : 56;

  const headCellSx: SxProps<Theme> = {
    ...TYPE.label,
    bgcolor: J.surface2,
    borderBottom: `1px solid ${J.hairlineStrong}`,
    whiteSpace: "nowrap",
    py: 1.5,
    ...(stickyHeader ? { position: "sticky", top: 0, zIndex: 1 } : null),
  };

  return (
    <Box
      {...rest}
      aria-busy={refetching || undefined}
      sx={[
        refetching ? { opacity: 0.55, pointerEvents: "none" } : null,
        { transition: `opacity ${MOTION.ctl}ms ${MOTION.ease}` },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {selection && (
        <Typography sx={{ ...TYPE.small, mb: 1 }} aria-live="polite">
          {t("jobsV2.table.selectedCount", {
            selected: formatCount(selection.selectedIds.size),
            total: formatCount(rows.length),
          })}
        </Typography>
      )}

      {/* ---- desktop table ------------------------------------------------ */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <JPanel>
          <Table size={dense ? "small" : "medium"} sx={{ tableLayout: "auto" }}>
            <Box component="caption" sx={srOnly}>
              {caption}
            </Box>
            <TableHead>
              <TableRow>
                {selection && (
                  <TableCell
                    component="th"
                    scope="col"
                    padding="checkbox"
                    sx={{ ...headCellSx, width: 56 }}
                  >
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      inputProps={{
                        "aria-label": t("jobsV2.table.selectAll", {
                          count: formatCount(selectableIds.length),
                        }) as string,
                      }}
                      sx={{ color: J.hairlineStrong, "&.Mui-checked": { color: J.azure }, ...focusRing }}
                    />
                  </TableCell>
                )}
                {columns.map((column) => {
                  const active = sort?.key === column.key;
                  return (
                    <TableCell
                      key={column.key}
                      component="th"
                      scope="col"
                      align={ALIGN[column.align ?? "start"]}
                      // Real `aria-sort` on the `<th>` — the shipped headers are
                      // `TableCell onClick` with a chevron, so there is no sort semantics and
                      // no keyboard sort at all.
                      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                      sx={{
                        ...headCellSx,
                        width: column.width,
                        display: column.hideBelow ? HIDE_BELOW[column.hideBelow] : undefined,
                      }}
                    >
                      {column.sortable && sort ? (
                        <TableSortLabel
                          active={active}
                          direction={active ? sort.dir : "asc"}
                          onClick={() =>
                            sort.onSort(column.key, active && sort.dir === "asc" ? "desc" : "asc")
                          }
                          sx={{ color: "inherit !important", ...focusRing }}
                        >
                          {column.header}
                          {column.headerHelp && (
                            <Tooltip title={column.headerHelp}>
                              <Box component="span" sx={{ display: "inline-flex", ml: 0.5 }}>
                                <IconWrapper icon="mdi:information-outline" size={13} />
                              </Box>
                            </Tooltip>
                          )}
                        </TableSortLabel>
                      ) : (
                        <>
                          {column.header}
                          {column.headerHelp && (
                            <Tooltip title={column.headerHelp}>
                              <Box component="span" sx={{ display: "inline-flex", ml: 0.5 }}>
                                <IconWrapper icon="mdi:information-outline" size={13} />
                              </Box>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const id = getRowId(row);
                const href = getRowHref?.(row);
                const selected = selection?.selectedIds.has(id) ?? false;
                return (
                  <TableRow
                    key={id}
                    selected={selected}
                    role={!href && onRowClick ? "button" : undefined}
                    tabIndex={!href && onRowClick ? 0 : undefined}
                    onClick={!href && onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      !href && onRowClick
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    sx={{
                      height: rowHeight,
                      cursor: !href && onRowClick ? "pointer" : "default",
                      transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
                      // No lift and no shadow on a table row, ever.
                      "&:hover": { bgcolor: J.surface2 },
                      "&.Mui-selected, &.Mui-selected:hover": { bgcolor: J.azureSoft },
                      "& td": {
                        borderBottom:
                          rowIndex === rows.length - 1 ? "none" : `1px solid ${J.hairlineSoft}`,
                        color: J.ink,
                        fontSize: "0.875rem",
                      },
                      ...focusRing,
                    }}
                  >
                    {selection && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            toggleRow(
                              id,
                              (event.nativeEvent as MouseEvent | undefined)?.shiftKey ?? false,
                            )
                          }
                          inputProps={{
                            "aria-label": t("jobsV2.table.selectRow", {
                              title: rowLabel(row),
                            }) as string,
                          }}
                          sx={{
                            color: J.hairlineStrong,
                            "&.Mui-checked": { color: J.azure },
                            ...focusRing,
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column, columnIndex) => (
                      <TableCell
                        key={column.key}
                        align={ALIGN[column.align ?? "start"]}
                        sx={{
                          display: column.hideBelow ? HIDE_BELOW[column.hideBelow] : undefined,
                        }}
                      >
                        {columnIndex === 0 && href ? (
                          // The primary cell is a real link: keyboard reachable,
                          // middle-clickable, and announced as a link.
                          <Box
                            component={NextLink}
                            href={href}
                            sx={{
                              display: "block",
                              color: "inherit",
                              textDecoration: "none",
                              minWidth: 0,
                              "&:hover": { color: J.azure },
                              ...focusRing,
                            }}
                          >
                            {column.render(row)}
                          </Box>
                        ) : (
                          column.render(row)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </JPanel>
      </Box>

      {/* ---- mobile card list --------------------------------------------- */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {selection && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
              px: 0.5,
            }}
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
              inputProps={{
                "aria-label": t("jobsV2.table.selectAll", {
                  count: formatCount(selectableIds.length),
                }) as string,
              }}
              sx={{
                width: 44,
                height: 44,
                color: J.hairlineStrong,
                "&.Mui-checked": { color: J.azure },
                ...focusRing,
              }}
            />
            <Typography sx={TYPE.small}>
              {t("jobsV2.table.selectAll", { count: formatCount(selectableIds.length) })}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {rows.map((row) => {
            const id = getRowId(row);
            const selected = selection?.selectedIds.has(id) ?? false;
            return (
              <Box key={id} sx={{ position: "relative" }}>
                {selection && (
                  <Checkbox
                    checked={selected}
                    onChange={() => toggleRow(id, false)}
                    inputProps={{
                      "aria-label": t("jobsV2.table.selectRow", {
                        title: rowLabel(row),
                      }) as string,
                    }}
                    sx={{
                      position: "absolute",
                      top: 4,
                      insetInlineEnd: 4,
                      zIndex: 1,
                      width: 44,
                      height: 44,
                      color: J.hairlineStrong,
                      "&.Mui-checked": { color: J.azure },
                      ...focusRing,
                    }}
                  />
                )}
                {mobile(row)}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
