"use client";

import { Box, Stack } from "@mui/material";
import { keyframes } from "@mui/system";

/** Grey gradient-sweep shimmer (no purple), matching the dashboard skeleton. */
const sweep = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

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
  p: { xs: 2, md: 2.5 },
  borderRadius: 4,
  border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 65%, transparent)",
  bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
};

function SectionHead() {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
      <Shimmer h={32} w={32} r={2} />
      <Box sx={{ flex: 1 }}>
        <Shimmer h={14} w="42%" />
        <Shimmer h={10} w="62%" sx={{ mt: 0.75 }} />
      </Box>
    </Stack>
  );
}

export function SkillMasterySkeleton() {
  return (
    <Box sx={CARD}>
      <SectionHead />
      <Stack spacing={1.5}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Shimmer h={12} w="38%" />
              <Shimmer h={12} w={42} />
            </Stack>
            <Shimmer h={8} r={4} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function RemediationSkeleton() {
  return (
    <Box sx={CARD}>
      <SectionHead />
      <Stack spacing={1.25}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Stack key={i} direction="row" spacing={1.25} alignItems="center">
            <Shimmer h={26} w={26} r={999} />
            <Box sx={{ flex: 1 }}>
              <Shimmer h={12} w="70%" />
              <Shimmer h={9} w="45%" sx={{ mt: 0.6 }} />
            </Box>
          </Stack>
        ))}
      </Stack>
      <Shimmer h={40} r={2.5} sx={{ mt: 2 }} />
    </Box>
  );
}

export function MisconceptionSkeleton() {
  return (
    <Box sx={CARD}>
      <SectionHead />
      <Stack spacing={1.25}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Box key={i} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 50%, transparent)" }}>
            <Shimmer h={12} w="55%" />
            <Shimmer h={10} w="90%" sx={{ mt: 0.75 }} />
            <Shimmer h={10} w="80%" sx={{ mt: 0.4 }} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function PerQuestionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Box sx={CARD}>
      <SectionHead />
      <Stack spacing={1.25}>
        {Array.from({ length: rows }).map((_, i) => (
          <Box key={i} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 50%, transparent)" }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Shimmer h={28} w={28} r={999} />
              <Box sx={{ flex: 1 }}>
                <Shimmer h={12} w="85%" />
                <Shimmer h={10} w="50%" sx={{ mt: 0.6 }} />
              </Box>
              <Shimmer h={22} w={56} r={999} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/** Full-page placeholder shown while the session itself loads (before any data). */
export function QuizResultSkeleton() {
  return (
    <Box>
      {/* hero band */}
      <Box sx={{ ...CARD, mb: 2.5 }}>
        <Shimmer h={12} w={120} />
        <Shimmer h={26} w="55%" sx={{ mt: 1.25 }} />
        <Shimmer h={12} w="80%" sx={{ mt: 1 }} />
      </Box>

      {/* KPI rail */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(5,1fr)" }, gap: 1.5, mb: 2.5 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} sx={{ ...CARD, p: 2, textAlign: "center" }}>
            <Shimmer h={26} w="50%" sx={{ mx: "auto" }} />
            <Shimmer h={10} w="70%" sx={{ mx: "auto", mt: 1 }} />
          </Box>
        ))}
      </Box>

      {/* result strip */}
      <Box sx={{ ...CARD, mb: 2.5 }}>
        <Shimmer h={14} w="40%" />
        <Shimmer h={11} w="92%" sx={{ mt: 1 }} />
        <Shimmer h={11} w="76%" sx={{ mt: 0.5 }} />
      </Box>

      {/* heatmap + remediation grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.4fr) minmax(0,1fr)" }, gap: 2.5, mb: 2.5, alignItems: "flex-start" }}>
        <SkillMasterySkeleton />
        <RemediationSkeleton />
      </Box>

      <Box sx={{ mb: 2.5 }}><PerQuestionSkeleton /></Box>
    </Box>
  );
}
