"use client";

import { Box, Pagination, PaginationItem, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { rangeLabel } from "@/lib/jobs-v2/format";
import { CTL_H, J, R, TYPE, focusRing } from "./jobsTokens";
import { JSelect } from "./Field";

export interface JPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sizes?: number[];
  /** Extra context for a client-filtered list: "of 42 matching (137 total)". */
  totalHint?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * Pagination at real touch sizes.
 *
 * The shipped control is `size="small"` (roughly 28px) and renders "1 ... 7 ... 20" on a phone,
 * so the two useful targets are unhittable. Here every target is 44px and `siblingCount={1}`
 * keeps the run short without hiding the neighbours.
 */
export function JPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sizes = [10, 20, 50],
  totalHint,
  disabled,
  sx,
  ...rest
}: JPaginationProps) {
  const { t } = useTranslation("common");

  // Nothing to page AND nothing to resize: render nothing rather than an empty bar.
  if (pageCount <= 1 && total <= sizes[0]) return null;

  return (
    <Box
      {...rest}
      component="nav"
      aria-label={t("jobsV2.pagination.label") as string}
      sx={[
        {
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          mt: 2.5,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography sx={{ ...TYPE.small, fontFeatureSettings: '"tnum" 1' }} aria-live="polite">
        {rangeLabel(page, pageSize, total)}
        {totalHint ? ` · ${totalHint}` : ""}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "space-between", sm: "flex-end" },
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        {pageCount > 1 && (
          <Pagination
            count={pageCount}
            page={Math.min(Math.max(page, 1), pageCount)}
            onChange={(_, next) => onPageChange(next)}
            siblingCount={1}
            boundaryCount={1}
            disabled={disabled}
            shape="rounded"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                // The current page has to be announced as such, not merely tinted.
                aria-current={item.selected ? "page" : undefined}
              />
            )}
            sx={{
              "& .MuiPaginationItem-root": {
                minWidth: CTL_H.touch,
                height: CTL_H.touch,
                borderRadius: R.ctl,
                color: J.ink2,
                fontWeight: 500,
                fontFeatureSettings: '"tnum" 1',
                border: `1px solid transparent`,
                "&:hover": { bgcolor: J.surface2 },
                ...focusRing,
              },
              "& .Mui-selected": {
                bgcolor: `${J.azureSoft} !important`,
                color: J.azureDeep,
                borderColor: J.azureBorder,
                fontWeight: 700,
              },
            }}
          />
        )}

        {onPageSizeChange && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <Typography component="span" sx={{ ...TYPE.small, whiteSpace: "nowrap" }}>
              {t("jobsV2.pagination.perPage")}
            </Typography>
            <JSelect
              value={String(pageSize)}
              onChange={(next) => onPageSizeChange(Number(next))}
              options={sizes.map((size) => ({ value: String(size), label: String(size) }))}
              aria-label={t("jobsV2.pagination.perPage") as string}
              dense
              fullWidth={false}
              disabled={disabled}
              sx={{ width: 92 }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
