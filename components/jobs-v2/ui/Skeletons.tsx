"use client";

import type { ReactNode } from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { J, R, srOnly } from "./jobsTokens";
import { JCard, JPanel } from "./Surfaces";

/**
 * The skeleton set.
 *
 * **Rule (section 4.9): never a bare `CircularProgress` or `LinearProgress` as a page or panel
 * loading state.** Spinners survive only *inside* a control already on screen. A skeleton is
 * shaped like the content that replaces it, so the swap is a crossfade rather than a relayout —
 * and the route `loading.tsx` mounts the SAME component the client mounts with.
 *
 * Every wrapper carries `aria-busy`, `aria-live="polite"` and a visually-hidden label, so a
 * screen reader is told the page is loading instead of being handed a silent grey rectangle.
 */

function Bone({
  w,
  h = 12,
  radius = R.ctl,
  sx,
}: {
  w?: number | string;
  h?: number | string;
  radius?: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Skeleton
      variant="rounded"
      animation="wave"
      width={w}
      height={h}
      sx={[{ bgcolor: J.surface2, borderRadius: radius }, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}

/** The announced wrapper every skeleton in this file is wrapped in. */
export function SkeletonShell({
  children,
  label,
  sx,
}: {
  children: ReactNode;
  /** Already-translated, e.g. `t("jobsV2.loading.jobs")`. */
  label?: string;
  sx?: SxProps<Theme>;
}) {
  const { t } = useTranslation("common");
  return (
    <Box
      aria-busy="true"
      aria-live="polite"
      sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Box component="span" sx={srOnly}>
        {label ?? (t("jobsV2.loading.generic") as string)}
      </Box>
      <Box aria-hidden>{children}</Box>
    </Box>
  );
}

/* ---- hero ------------------------------------------------------------- */

export function HeroSkeleton() {
  return (
    <SkeletonShell>
      <Box
        sx={{
          borderRadius: R.hero,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          bgcolor: J.surface2,
          border: `1px solid ${J.hairline}`,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Bone w={54} h={54} radius={R.inner} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Bone w={110} h={10} />
            <Box sx={{ height: 10 }} />
            <Bone w="45%" h={26} />
            <Box sx={{ height: 10 }} />
            <Bone w="70%" h={12} />
          </Box>
        </Stack>
      </Box>
    </SkeletonShell>
  );
}

/* ---- student board ---------------------------------------------------- */

export function JobCardSkeleton() {
  return (
    <JCard padded>
      <Stack direction="row" spacing={2}>
        <Bone w={48} h={48} radius={R.ctl} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Bone w="72%" h={16} />
          <Box sx={{ height: 8 }} />
          <Bone w="42%" h={12} />
          <Box sx={{ height: 14 }} />
          <Stack direction="row" spacing={1}>
            <Bone w={92} h={12} />
            <Bone w={72} h={12} />
            <Bone w={84} h={12} />
          </Stack>
          <Box sx={{ height: 14 }} />
          <Stack direction="row" spacing={1}>
            <Bone w={64} h={22} radius={R.pill} />
            <Bone w={78} h={22} radius={R.pill} />
          </Stack>
        </Box>
      </Stack>
    </JCard>
  );
}

export function JobRowSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: { xs: 2, md: 2.5 },
        py: 2,
        borderBottom: `1px solid ${J.hairlineSoft}`,
      }}
    >
      <Bone w={40} h={40} radius={R.ctl} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Bone w="55%" h={14} />
        <Box sx={{ height: 8 }} />
        <Bone w="35%" h={11} />
      </Box>
      <Bone w={88} h={24} radius={R.pill} sx={{ display: { xs: "none", md: "block" } }} />
    </Box>
  );
}

export function JobListSkeleton({
  count = 6,
  view = "card",
}: {
  count?: number;
  view?: "card" | "list";
}) {
  const { t } = useTranslation("common");
  if (view === "list") {
    return (
      <SkeletonShell label={t("jobsV2.loading.jobs") as string}>
        <JPanel>
          {Array.from({ length: count }).map((_, i) => (
            <JobRowSkeleton key={i} />
          ))}
        </JPanel>
      </SkeletonShell>
    );
  }
  return (
    <SkeletonShell label={t("jobsV2.loading.jobs") as string}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 1.5,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </Box>
    </SkeletonShell>
  );
}

export function JobDetailSkeleton() {
  const { t } = useTranslation("common");
  return (
    <SkeletonShell label={t("jobsV2.loading.job") as string}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" },
          gap: { xs: 2, md: 3 },
        }}
      >
        <Stack spacing={2}>
          <JCard>
            <Bone w="60%" h={22} />
            <Box sx={{ height: 12 }} />
            <Bone w="35%" h={14} />
            <Box sx={{ height: 18 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Bone w={96} h={12} />
              <Bone w={76} h={12} />
              <Bone w={110} h={12} />
            </Stack>
          </JCard>
          <JCard>
            <Bone w={160} h={16} />
            <Box sx={{ height: 16 }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} sx={{ mb: 1 }}>
                <Bone w={i % 3 === 2 ? "62%" : "100%"} h={11} />
              </Box>
            ))}
          </JCard>
        </Stack>
        <Stack spacing={2}>
          <JCard>
            <Bone w="100%" h={44} />
            <Box sx={{ height: 12 }} />
            <Bone w="70%" h={11} />
          </JCard>
          <JCard>
            <Bone w={120} h={14} />
            <Box sx={{ height: 14 }} />
            <Bone w="90%" h={11} />
            <Box sx={{ height: 8 }} />
            <Bone w="75%" h={11} />
          </JCard>
        </Stack>
      </Box>
    </SkeletonShell>
  );
}

export function AppliedListSkeleton({ count = 4 }: { count?: number }) {
  const { t } = useTranslation("common");
  return (
    <SkeletonShell label={t("jobsV2.loading.applications") as string}>
      <HairlineStripSkeleton columns={6} />
      <Box sx={{ height: 20 }} />
      <Stack spacing={1.5}>
        {Array.from({ length: count }).map((_, i) => (
          <JCard key={i}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Bone w={44} h={44} radius={R.ctl} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Bone w="52%" h={14} />
                <Box sx={{ height: 8 }} />
                <Bone w="30%" h={11} />
              </Box>
              <Bone w={96} h={24} radius={R.pill} />
            </Stack>
          </JCard>
        ))}
      </Stack>
    </SkeletonShell>
  );
}

/* ---- strips, tables, forms -------------------------------------------- */

export function HairlineStripSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          md: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
        },
        borderTop: `1px solid ${J.hairline}`,
        borderBottom: `1px solid ${J.hairline}`,
      }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Box
          key={i}
          sx={{
            px: 2,
            py: 2,
            borderInlineStart: i === 0 ? "none" : `1px solid ${J.hairline}`,
          }}
        >
          <Bone w={56} h={28} />
          <Box sx={{ height: 10 }} />
          <Bone w={74} h={9} />
        </Box>
      ))}
    </Box>
  );
}

export function DataTableSkeleton({
  columns = 5,
  rows = 8,
  dense = false,
}: {
  columns?: number;
  rows?: number;
  dense?: boolean;
}) {
  const { t } = useTranslation("common");
  return (
    <SkeletonShell label={t("jobsV2.loading.table") as string}>
      <JPanel>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
            gap: 2,
            px: 2,
            py: 1.5,
            bgcolor: J.surface2,
            borderBottom: `1px solid ${J.hairlineStrong}`,
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Bone key={i} w="60%" h={9} />
          ))}
        </Box>
        {Array.from({ length: rows }).map((_, r) => (
          <Box
            key={r}
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
              gap: 2,
              alignItems: "center",
              px: 2,
              minHeight: dense ? 48 : 56,
              borderBottom: r === rows - 1 ? "none" : `1px solid ${J.hairlineSoft}`,
            }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Bone key={c} w={c === 0 ? "85%" : "55%"} h={12} />
            ))}
          </Box>
        ))}
      </JPanel>
    </SkeletonShell>
  );
}

export function ScrapedTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Box>
      <HairlineStripSkeleton columns={4} />
      <Box sx={{ height: 20 }} />
      <DataTableSkeleton columns={6} rows={rows} />
    </Box>
  );
}

export function FormSkeleton({ sections = 2, fields = 4 }: { sections?: number; fields?: number }) {
  const { t } = useTranslation("common");
  return (
    <SkeletonShell label={t("jobsV2.loading.form") as string}>
      <Stack spacing={2.5}>
        {Array.from({ length: sections }).map((_, s) => (
          <JCard key={s}>
            <Bone w={180} h={16} />
            <Box sx={{ height: 20 }} />
            <Stack spacing={2}>
              {Array.from({ length: fields }).map((_, f) => (
                <Box key={f}>
                  <Bone w={110} h={9} />
                  <Box sx={{ height: 8 }} />
                  <Bone w="100%" h={40} />
                </Box>
              ))}
            </Stack>
          </JCard>
        ))}
      </Stack>
    </SkeletonShell>
  );
}

export function ApplyStepSkeleton() {
  const { t } = useTranslation("common");
  return (
    <SkeletonShell label={t("jobsV2.loading.apply") as string}>
      <Box sx={{ mb: 2.5 }}>
        <Bone w="100%" h={4} radius={R.pill} />
        <Box sx={{ height: 10 }} />
        <Bone w={180} h={11} />
      </Box>
      <JCard sx={{ maxWidth: 820, mx: "auto" }}>
        <Bone w={200} h={16} />
        <Box sx={{ height: 20 }} />
        <Bone w="100%" h={120} radius={R.inner} />
        <Box sx={{ height: 20 }} />
        <Bone w={150} h={9} />
        <Box sx={{ height: 8 }} />
        <Bone w="100%" h={40} />
      </JCard>
    </SkeletonShell>
  );
}

export function PipelineSkeleton({ stages = 6 }: { stages?: number }) {
  const { t } = useTranslation("common");
  return (
    <SkeletonShell label={t("jobsV2.loading.pipeline") as string}>
      <HairlineStripSkeleton columns={stages} />
      <Box sx={{ height: 20 }} />
      <DataTableSkeleton columns={5} rows={8} />
    </SkeletonShell>
  );
}
