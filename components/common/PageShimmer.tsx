"use client";

import { Box, Skeleton, Stack } from "@mui/material";

interface PageShimmerProps {
  /** Number of card rows to render. Defaults to 4. */
  rows?: number;
  /** Show a grid of cards instead of horizontal rows. */
  variant?: "rows" | "grid" | "list" | "detail";
  /** Hide the page header (title + subtitle). */
  hideHeader?: boolean;
}

/**
 * Generic shimmer placeholder for full-page route transitions. Rendered by
 * each segment's `loading.tsx` so the new page appears instantly while its
 * data loads, keeping perceived navigation latency near zero.
 */
export function PageShimmer({
  rows = 4,
  variant = "rows",
  hideHeader = false,
}: PageShimmerProps) {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-live="polite"
      sx={{ width: "100%" }}
    >
      {!hideHeader && (
        <Stack spacing={1.25} sx={{ mb: 3 }}>
          <Skeleton
            variant="rounded"
            width={260}
            height={32}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rounded"
            width={420}
            height={18}
            sx={{ borderRadius: 1, maxWidth: "70%" }}
          />
        </Stack>
      )}

      {variant === "grid" && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {Array.from({ length: Math.max(rows * 2, 6) }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={180}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      )}

      {variant === "rows" && (
        <Stack spacing={1.5}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={84}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Stack>
      )}

      {variant === "list" && (
        <Stack spacing={1}>
          {Array.from({ length: rows + 4 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.25,
                px: 1.5,
                borderRadius: 1.5,
              }}
            >
              <Skeleton variant="circular" width={40} height={40} />
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Skeleton
                  variant="rounded"
                  width="40%"
                  height={16}
                  sx={{ borderRadius: 1 }}
                />
                <Skeleton
                  variant="rounded"
                  width="70%"
                  height={12}
                  sx={{ borderRadius: 1 }}
                />
              </Stack>
              <Skeleton
                variant="rounded"
                width={80}
                height={28}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          ))}
        </Stack>
      )}

      {variant === "detail" && (
        <Stack spacing={2.5}>
          <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
            }}
          >
            <Stack spacing={1.25}>
              {Array.from({ length: rows }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={i === 0 ? 28 : 16}
                  width={i === 0 ? "60%" : `${100 - i * 6}%`}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Stack>
            <Skeleton variant="rounded" height={260} sx={{ borderRadius: 2 }} />
          </Box>
        </Stack>
      )}
    </Box>
  );
}

export default PageShimmer;
