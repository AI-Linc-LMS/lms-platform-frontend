"use client";

import { Box, ButtonBase, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { PanelCard, SectionHeader } from "./parts";
import { CountUp } from "@/components/scorecard/shared/CountUp";
import { useProfileGate } from "@/lib/contexts/ProfileGateContext";

const MODULE_LABELS: Record<string, string> = {
  resume: "Resume",
  jobs: "Jobs",
  interview: "Interview",
};

/**
 * "Your profile is N% complete — complete it to unlock all benefits."
 *
 * Every value comes from the server's `profile_completion`, including the field LABELS. Nothing
 * here knows the five field names, so adding a sixth mandatory field on the backend needs no
 * frontend change — and the percentage shown can never drift from the one the API gates on.
 *
 * Renders nothing once the profile is complete, for an exempt learner, or while the gate is still
 * loading. Which is also why the dashboard skeleton deliberately reserves no space for it: a
 * shimmer would flash a card that then vanishes for most users.
 */
export function ProfileCompletionPanel() {
  const router = useRouter();
  const { status, completion, percentage } = useProfileGate();

  if (status !== "ready" || !completion) return null;
  if (completion.is_complete || completion.exempt) return null;

  const locked = completion.locked_modules
    .map((m) => MODULE_LABELS[m] ?? m)
    .filter(Boolean);

  return (
    <PanelCard sx={{ mb: 0 }} data-tour-id="dash-profile">
      <SectionHeader
        icon="mdi:account-check-outline"
        title="Complete your profile"
        subtitle={locked.length ? `Unlock ${locked.join(", ")}` : "Unlock all benefits"}
      />

      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: "#f5f3ff",
          border: "1px solid #ede9fe",
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: "2.2rem", color: "#6366f1", lineHeight: 1.1 }}>
          <CountUp value={percentage} suffix="%" />
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>
          complete — finish it to unlock all benefits
        </Typography>
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, percentage)}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "#eef2f7",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              background: "linear-gradient(90deg, #7c3aed, #ec4899)",
            },
          }}
        />
      </Box>

      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        {completion.required_fields.map((f) => (
          <Stack key={f.field} direction="row" spacing={1} alignItems="center">
            <Icon
              icon={f.filled ? "mdi:check-circle" : "mdi:circle-outline"}
              width={16}
              style={{ color: f.filled ? "#10b981" : "#cbd5e1", flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: f.filled ? 600 : 700,
                color: f.filled ? "#94a3b8" : "#334155",
                textDecoration: f.filled ? "line-through" : "none",
              }}
            >
              {f.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <ButtonBase
        onClick={() => router.push("/profile#profile-strength")}
        sx={{
          mt: 1.5,
          width: "100%",
          py: 1.1,
          borderRadius: 2.5,
          fontWeight: 800,
          fontSize: "0.88rem",
          color: "white",
          gap: 0.5,
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
        }}
      >
        Complete profile <Icon icon="mdi:arrow-right" width={16} />
      </ButtonBase>
    </PanelCard>
  );
}
