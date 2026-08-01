"use client";

/**
 * Course loading shimmers - skeletons shaped like the real loaded layouts (course cards, the
 * journey board, the submodule path). Uses the SAME grey gradient-sweep convention as
 * DashboardSkeleton / ResultSkeletons (1.5s sweep, neutral grey) and respects reduced-motion.
 */

import { Box, Stack } from "@mui/material";
import { keyframes } from "@mui/system";

const sweep = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

/** Grey gradient-sweep shimmer box (no purple), with a reduced-motion gate. */
export function Shimmer({ h = 14, w = "100%", r = 1.5, sx }: { h?: number | string; w?: number | string; r?: number; sx?: object }) {
  return (
    <Box
      sx={{
        height: h,
        width: w,
        borderRadius: r,
        background: "linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%)",
        backgroundSize: "200% 100%",
        animation: `${sweep} 1.5s ease-in-out infinite`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        ...sx,
      }}
    />
  );
}

const CARD = {
  border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 65%, transparent)",
  bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
};

/** One card matching AdaptiveCourseCard: 16:9 image, icon badge + pill, title, 2 desc lines, metrics. */
export function AdaptiveCourseCardSkeleton() {
  return (
    <Box sx={{ ...CARD, borderRadius: 3, p: 2.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Shimmer h={0} w="100%" r={2.5} sx={{ pb: "56.25%", height: 0 }} />
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 0.5 }}>
        <Shimmer h={44} w={44} r={3} />
        <Shimmer h={18} w={90} r={999} />
      </Stack>
      <Shimmer h={18} w="70%" sx={{ mt: 0.5 }} />
      <Shimmer h={12} w="95%" />
      <Shimmer h={12} w="80%" />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 0.75 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Stack key={i} direction="row" spacing={0.6} alignItems="center">
            <Shimmer h={14} w={14} r={999} />
            <Shimmer h={10} w={42} />
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

/** Responsive card grid (fills the card region beneath the page's static hero). */
export function AdaptiveCourseListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Box
      role="status"
      aria-busy="true"
      sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2, alignItems: "stretch" }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <AdaptiveCourseCardSkeleton key={i} />
      ))}
    </Box>
  );
}

/** One week card: header strip + progress bar + 3 node rows (timeline circle + bars + points pill). */
export function WeekCardSkeleton() {
  return (
    <Box sx={{ ...CARD, borderRadius: 4, p: { xs: 2, md: 2.5 }, mb: 2.5 }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Shimmer h={34} w={34} r={2.5} />
        <Box sx={{ flex: 1 }}>
          <Shimmer h={16} w="45%" />
          <Shimmer h={10} w="28%" sx={{ mt: 0.6 }} />
        </Box>
        <Shimmer h={22} w={90} r={999} />
      </Stack>
      <Shimmer h={8} r={4} sx={{ mt: 1.5, mb: 2 }} />
      <Stack spacing={1.5}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Stack key={i} direction="row" spacing={1.75} alignItems="center">
            <Shimmer h={28} w={28} r={999} />
            <Box sx={{ flex: 1 }}>
              <Shimmer h={13} w="55%" />
              <Shimmer h={10} w="35%" sx={{ mt: 0.6 }} />
            </Box>
            <Shimmer h={34} w={60} r={2} />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

/** Mirrors JourneyBoard's loaded layout: hero + top cards + (weeks | sidebar) grid. */
export function JourneyBoardSkeleton() {
  return (
    <Box role="status" aria-busy="true">
      <Shimmer h={200} r={5} sx={{ mb: 2.5 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2.5, mb: 2.5 }}>
        <Shimmer h={150} r={4} />
        <Shimmer h={150} r={4} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 390px" }, gap: 2.5 }}>
        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
            <Shimmer h={34} w={34} r={2.5} />
            <Box sx={{ flex: 1 }}>
              <Shimmer h={16} w="35%" />
              <Shimmer h={10} w="55%" sx={{ mt: 0.6 }} />
            </Box>
          </Stack>
          <Shimmer h={48} r={2.5} sx={{ mb: 2 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <WeekCardSkeleton key={i} />
          ))}
        </Box>
        <Stack spacing={2.5}>
          <Shimmer h={320} r={4} />
          <Shimmer h={200} r={4} />
          <Shimmer h={220} r={4} />
        </Stack>
      </Box>
    </Box>
  );
}

/** Mirrors the submodule page: hero + section header + 4 path rows. */
export function AdaptiveSubmoduleSkeleton() {
  return (
    <Box role="status" aria-busy="true">
      <Shimmer h={180} r={5} sx={{ mb: 2.5 }} />
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <Shimmer h={34} w={34} r={2.5} />
        <Box sx={{ flex: 1 }}>
          <Shimmer h={16} w="40%" />
          <Shimmer h={10} w="58%" sx={{ mt: 0.6 }} />
        </Box>
        <Shimmer h={26} w={90} r={999} />
      </Stack>
      <Stack spacing={1.5}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Stack key={i} direction="row" spacing={1.75} alignItems="stretch">
            <Shimmer h={28} w={28} r={999} sx={{ alignSelf: "center" }} />
            <Box sx={{ ...CARD, flex: 1, borderRadius: 3, borderLeft: "4px solid color-mix(in srgb, var(--border-default, #e5e7eb) 65%, transparent)", p: 1.75, display: "flex", alignItems: "center", gap: 1.25 }}>
              <Shimmer h={38} w={38} r={2} />
              <Box sx={{ flex: 1 }}>
                <Shimmer h={13} w="50%" />
                <Shimmer h={10} w="70%" sx={{ mt: 0.6 }} />
              </Box>
              <Shimmer h={34} w={90} r={2.5} />
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

/**
 * Admin adaptive course detail — hero, action pills, tab row, then the content tree.
 *
 * Replaces a centred "Loading course…" string. A line of text in the middle of an empty card
 * tells you nothing about what is coming and makes the page appear to jump when the real layout
 * finally lands; a skeleton shaped like the destination holds the space instead.
 */
export function AdminAdaptiveCourseDetailSkeleton() {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading course">
      {/* Hero */}
      <Box sx={{ ...CARD, borderRadius: 5, p: { xs: 2.5, md: 3.5 }, mb: 2.5 }}>
        <Shimmer h={12} w={150} sx={{ mb: 1.5 }} />
        <Stack direction="row" spacing={2} alignItems="center">
          <Shimmer h={56} w={56} r={3} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Shimmer h={30} w="55%" sx={{ mb: 1 }} />
            <Shimmer h={12} w="80%" />
          </Box>
        </Stack>
      </Box>

      {/* Action pills */}
      <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
        {[120, 140, 96, 104].map((w, i) => (
          <Shimmer key={i} h={36} w={w} r={999} />
        ))}
      </Stack>

      {/* Tabs */}
      <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
        {[92, 108, 132, 108, 96, 96, 92].map((w, i) => (
          <Shimmer key={i} h={38} w={w} r={999} />
        ))}
      </Stack>

      {/* Module tree */}
      <Stack spacing={2}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i} sx={{ ...CARD, borderRadius: 4, p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.75 }}>
              <Shimmer h={30} w={30} r={2} />
              <Shimmer h={16} w="35%" />
              <Box sx={{ flex: 1 }} />
              <Shimmer h={22} w={72} r={999} />
            </Stack>
            {Array.from({ length: 2 }).map((__, j) => (
              <Stack key={j} direction="row" spacing={1.25} alignItems="center" sx={{ py: 1 }}>
                <Shimmer h={12} w={12} r={999} />
                <Shimmer h={12} w={`${50 + j * 12}%`} />
                <Box sx={{ flex: 1 }} />
                <Shimmer h={18} w={56} r={999} />
              </Stack>
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/** A section inside a card: header row + a few lines. For panels that load after their parent. */
export function AdminSectionSkeleton({ rows = 3, showHeader = true }: { rows?: number; showHeader?: boolean }) {
  return (
    <Box role="status" aria-busy="true">
      {showHeader && (
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
          <Shimmer h={30} w={30} r={2} />
          <Shimmer h={14} w={160} />
        </Stack>
      )}
      <Stack spacing={1.25}>
        {Array.from({ length: rows }).map((_, i) => (
          <Shimmer key={i} h={14} w={`${92 - i * 9}%`} />
        ))}
      </Stack>
    </Box>
  );
}

/** Prose placeholder — article bodies, where ragged line lengths read as text rather than bars. */
export function ArticleBodySkeleton({ lines = 7 }: { lines?: number }) {
  const widths = ["96%", "88%", "93%", "72%", "90%", "85%", "60%", "94%", "78%"];
  return (
    <Box role="status" aria-busy="true" sx={{ py: 1 }}>
      <Shimmer h={20} w="45%" sx={{ mb: 2 }} />
      <Stack spacing={1.1}>
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} h={11} w={widths[i % widths.length]} />
        ))}
      </Stack>
    </Box>
  );
}

/** The student adaptive session shell: title, progress bar, question card, answer options. */
export function AdaptiveSessionSkeleton() {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading your session" sx={{ maxWidth: 820, mx: "auto", width: "100%" }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Shimmer h={38} w={38} r={2.5} />
        <Box sx={{ flex: 1 }}>
          <Shimmer h={16} w="45%" sx={{ mb: 0.75 }} />
          <Shimmer h={10} w="25%" />
        </Box>
      </Stack>
      <Shimmer h={8} w="100%" r={999} sx={{ mb: 3 }} />
      <Box sx={{ ...CARD, borderRadius: 4, p: 3 }}>
        <Shimmer h={12} w={90} sx={{ mb: 2 }} />
        <Shimmer h={16} w="92%" sx={{ mb: 1 }} />
        <Shimmer h={16} w="70%" sx={{ mb: 3 }} />
        <Stack spacing={1.25}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} h={50} r={2.5} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
