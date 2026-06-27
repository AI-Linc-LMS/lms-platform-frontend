"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { DashboardCourse } from "@/lib/types/dashboard";
import { PanelCard } from "./parts";

export function CertificatePanel({ course }: { course: DashboardCourse }) {
  const router = useRouter();
  const { pct, threshold } = course.certificate;
  const ready = pct >= threshold;

  return (
    <PanelCard>
      <Box sx={{ textAlign: "center", py: 0.5 }}>
        <Box sx={{ width: 56, height: 56, mx: "auto", mb: 1, borderRadius: 3, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 12px 26px -12px rgba(124,58,237,0.6)" }}>
          <Icon icon="mdi:certificate" width={28} />
        </Box>
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.6, color: "#7c3aed", textTransform: "uppercase" }}>
          Certificate · {course.title}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", mt: 0.5 }}>
          {ready ? "Your certificate is ready 🎓" : `You're ${pct}% toward your certificate`}
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: "#64748b", mt: 0.5 }}>
          {ready ? "Open the course to download & share it." : `Complete ${threshold}% of the track to unlock your shareable certificate.`}
        </Typography>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <LinearProgress variant="determinate" value={Math.min(100, pct)} sx={{ height: 8, borderRadius: 4, bgcolor: "#eef2f7", "& .MuiLinearProgress-bar": { borderRadius: 4, background: "linear-gradient(90deg, #7c3aed, #ec4899)" } }} />
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
          <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700 }}>{pct}% done</Typography>
          <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700 }}>{threshold}% to unlock</Typography>
        </Stack>
      </Box>

      <ButtonBase
        onClick={() => router.push(`/adaptive-courses/${course.id}`)}
        sx={{ mt: 1.5, width: "100%", py: 1.1, borderRadius: 2.5, fontWeight: 800, fontSize: "0.88rem", color: "white", gap: 0.5, background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
      >
        {ready ? "View certificate" : "Keep going"} <Icon icon="mdi:arrow-right" width={16} />
      </ButtonBase>
    </PanelCard>
  );
}
