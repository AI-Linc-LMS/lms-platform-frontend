"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { CrossCourseUpNext } from "@/lib/types/dashboard";
import { PanelCard, SectionHeader } from "./parts";

const KIND: Record<string, { icon: string; color: string; bg: string }> = {
  topic: { icon: "mdi:book-open-page-variant", color: "#6366f1", bg: "#eef2ff" },
  quiz: { icon: "mdi:help-circle", color: "#6366f1", bg: "#eef2ff" },
  checkpoint: { icon: "mdi:shield-check", color: "#a855f7", bg: "#f5f3ff" },
  week_final: { icon: "mdi:flag-checkered", color: "#f59e0b", bg: "#fff7ed" },
  interview: { icon: "mdi:account-voice", color: "#ec4899", bg: "#fdf2f8" },
};

export function UpNextPanel({ items }: { items: CrossCourseUpNext[] }) {
  const router = useRouter();
  if (!items.length) return null;

  const go = (it: CrossCourseUpNext) => {
    if (it.resumeSubmoduleId) router.push(`/adaptive-courses/${it.courseId}/submodule/${it.resumeSubmoduleId}`);
    else router.push(`/adaptive-courses/${it.courseId}`);
  };

  return (
    <PanelCard>
      <SectionHeader
        icon="mdi:arrow-right-bold-box"
        title="Up Next"
        subtitle="Across your courses"
      />
      <Stack spacing={1}>
        {items.map((it) => {
          const k = KIND[it.type] || KIND.topic;
          return (
            <ButtonBase
              key={`${it.courseId}-${it.nodeId}`}
              onClick={() => go(it)}
              sx={{ width: "100%", textAlign: "left", justifyContent: "flex-start", p: 1.25, borderRadius: 2.5, border: "1px solid #eef2f7", gap: 1.25, "&:hover": { borderColor: "#cbd5e1" } }}
            >
              <Box sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: k.color, bgcolor: k.bg }}>
                <Icon icon={k.icon} width={18} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</Typography>
                <Box component="span" sx={{ display: "inline-block", mt: 0.25, px: 0.75, py: 0.1, borderRadius: 999, fontSize: "0.64rem", fontWeight: 700, color: "#475569", bgcolor: "#f1f5f9" }}>{it.courseTitle}</Box>
              </Box>
              {it.points ? <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: "#7c3aed", flexShrink: 0 }}>+{it.points}</Typography> : null}
            </ButtonBase>
          );
        })}
      </Stack>
    </PanelCard>
  );
}
