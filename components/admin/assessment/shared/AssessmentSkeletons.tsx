"use client";

/**
 * AssessmentSkeletons - loading placeholders for the assessment-management admin
 * redesign. Each skeleton mirrors the footprint of the real component it stands in
 * for (data table, filter bar, form) so the swap from loading → loaded produces no
 * layout jump. Tokenized (var(--card-bg) / var(--border-default)); wave animation.
 */

import { Box, Skeleton } from "@mui/material";

const CARD_SX = {
  bgcolor: "var(--card-bg)",
  border: "1px solid var(--border-default)",
  borderRadius: 2,
  overflow: "hidden",
} as const;

const SKELETON_BG = "color-mix(in srgb, var(--font-primary) 11%, var(--card-bg) 89%)";

type AssessmentTableSkeletonProps = {
  rows?: number;
  columns?: number;
};

/**
 * Mirrors AssessmentDataTable: a rounded hairline card with a header-ish row
 * followed by `rows` rows of `columns` rectangular cells. The whole grid lives in
 * an overflow-x:auto container so a wide table never scrolls the page body.
 */
export function AssessmentTableSkeleton({
  rows = 8,
  columns = 5,
}: AssessmentTableSkeletonProps) {
  const rowKeys = Array.from({ length: Math.max(0, rows) }, (_, i) => i);
  const colKeys = Array.from({ length: Math.max(1, columns) }, (_, i) => i);

  // First column reads as a "primary" label; the last as a compact actions cell.
  const cellFlex = (col: number) => {
    if (col === 0) return 2.2;
    if (col === colKeys.length - 1) return 0.9;
    return 1.4;
  };

  return (
    <Box sx={CARD_SX} aria-hidden="true">
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: columns * 120 }}>
          {/* Header row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2,
              py: 1.75,
              borderBottom: "1px solid var(--border-default)",
              bgcolor:
                "color-mix(in srgb, var(--font-primary) 4%, var(--card-bg) 96%)",
            }}
          >
            {colKeys.map((col) => (
              <Box key={col} sx={{ flex: cellFlex(col), minWidth: 0 }}>
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  height={12}
                  width={col === 0 ? "55%" : "70%"}
                  sx={{ bgcolor: SKELETON_BG, borderRadius: 999 }}
                />
              </Box>
            ))}
          </Box>

          {/* Body rows */}
          {rowKeys.map((row) => (
            <Box
              key={row}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 1.75,
                borderBottom:
                  row === rowKeys.length - 1
                    ? "none"
                    : "1px solid var(--border-default)",
              }}
            >
              {colKeys.map((col) => (
                <Box key={col} sx={{ flex: cellFlex(col), minWidth: 0 }}>
                  <Skeleton
                    animation="wave"
                    variant="rounded"
                    height={col === colKeys.length - 1 ? 28 : 16}
                    width={col === colKeys.length - 1 ? 64 : `${60 + ((row * 7 + col * 13) % 30)}%`}
                    sx={{ bgcolor: SKELETON_BG, borderRadius: col === colKeys.length - 1 ? 1 : 999 }}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Mirrors the assessment filter bar: a rounded hairline card with one wide search
 * field skeleton and a handful of pill (chip) skeletons.
 */
export function AssessmentFilterBarSkeleton() {
  const pillKeys = [96, 72, 108, 84];

  return (
    <Box
      sx={{
        ...CARD_SX,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.75,
      }}
      aria-hidden="true"
    >
      <Skeleton
        animation="wave"
        variant="rounded"
        height={40}
        sx={{
          bgcolor: SKELETON_BG,
          borderRadius: 2,
          flex: "1 1 240px",
          minWidth: 200,
          maxWidth: 420,
        }}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, flex: "1 1 auto" }}>
        {pillKeys.map((width, i) => (
          <Skeleton
            key={i}
            animation="wave"
            variant="rounded"
            height={32}
            width={width}
            sx={{ bgcolor: SKELETON_BG, borderRadius: 999 }}
          />
        ))}
      </Box>
    </Box>
  );
}

type AssessmentFormSkeletonProps = {
  fields?: number;
};

/**
 * Mirrors an assessment edit/create form: `fields` stacked label + input skeleton
 * pairs inside a rounded hairline card, with a trailing action-button row.
 */
export function AssessmentFormSkeleton({ fields = 4 }: AssessmentFormSkeletonProps) {
  const fieldKeys = Array.from({ length: Math.max(1, fields) }, (_, i) => i);

  return (
    <Box
      sx={{
        ...CARD_SX,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        p: 2.5,
      }}
      aria-hidden="true"
    >
      {fieldKeys.map((field) => {
        // Every third field renders as a taller multi-line input (textarea-ish).
        const isMultiline = field % 3 === 2;
        return (
          <Box
            key={field}
            sx={{ display: "flex", flexDirection: "column", gap: 1 }}
          >
            <Skeleton
              animation="wave"
              variant="rounded"
              height={11}
              width={`${28 + ((field * 11) % 18)}%`}
              sx={{ bgcolor: SKELETON_BG, borderRadius: 999 }}
            />
            <Skeleton
              animation="wave"
              variant="rounded"
              height={isMultiline ? 88 : 44}
              width="100%"
              sx={{ bgcolor: SKELETON_BG, borderRadius: 2 }}
            />
          </Box>
        );
      })}

      {/* Action row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          pt: 1,
        }}
      >
        <Skeleton
          animation="wave"
          variant="rounded"
          height={40}
          width={96}
          sx={{ bgcolor: SKELETON_BG, borderRadius: 2 }}
        />
        <Skeleton
          animation="wave"
          variant="rounded"
          height={40}
          width={128}
          sx={{ bgcolor: SKELETON_BG, borderRadius: 2 }}
        />
      </Box>
    </Box>
  );
}
