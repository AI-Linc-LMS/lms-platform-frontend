"use client";

/**
 * AssessmentSharedPagination — the single footer pagination row for the
 * assessment-management admin redesign. Replaces three inconsistent
 * pagination implementations with one token-driven, theme-aware primitive.
 *
 * Left:  "Showing X–Y of Z" range (clamped) + optional PerPageSelect.
 * Right: MUI <Pagination> (compact, single sibling/boundary).
 * Stacks on xs; the whole row sits above a hairline border-top.
 */

import { Box, Pagination, Typography } from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";

export interface AssessmentSharedPaginationProps {
  /** Current 1-based page. */
  page: number;
  /** Rows per page. */
  pageSize: number;
  /** Total number of rows across all pages. */
  total: number;
  /** Called with the next 1-based page. */
  onPageChange: (page: number) => void;
  /** When provided, renders a PerPageSelect wired to this handler. */
  onPageSizeChange?: (size: number) => void;
  /** Optional per-page choices forwarded to PerPageSelect. */
  perPageOptions?: number[];
}

export function AssessmentSharedPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  perPageOptions,
}: AssessmentSharedPaginationProps): React.JSX.Element {
  const safeTotal = Math.max(0, Math.floor(total));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), pageCount);

  // Range is clamped so an out-of-bounds page or empty result never lies.
  const start = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const end = safeTotal === 0 ? 0 : Math.min(safePage * safePageSize, safeTotal);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderTop: "1px solid var(--border-default)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            color: "var(--font-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          {`Showing ${start}–${end} of ${safeTotal}`}
        </Typography>

        {onPageSizeChange ? (
          <PerPageSelect
            value={safePageSize}
            onChange={onPageSizeChange}
            options={perPageOptions}
          />
        ) : null}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "center", sm: "flex-end" },
          overflowX: "auto",
        }}
      >
        <Pagination
          count={pageCount}
          page={safePage}
          onChange={(_event, value) => onPageChange(value)}
          color="primary"
          size="small"
          siblingCount={0}
          boundaryCount={1}
        />
      </Box>
    </Box>
  );
}

export default AssessmentSharedPagination;
