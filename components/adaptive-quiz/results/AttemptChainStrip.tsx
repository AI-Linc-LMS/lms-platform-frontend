"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import type { AdaptiveSessionDetail } from "@/lib/types/adaptive-quiz";

type Chain = NonNullable<AdaptiveSessionDetail["attempt_chain"]>;
type Attempt = Chain["attempts"][number];

/**
 * The full topic attempt chain (original + every re-quiz), so a learner can see in ONE place how
 * many quizzes they've taken on a topic and jump to any of them. Hidden for a lone quiz (total<=1).
 */
export function AttemptChainStrip({ chain }: { chain?: Chain }) {
  const router = useRouter();
  if (!chain || chain.total <= 1) return null;

  const go = (a: Attempt) => {
    if (a.is_current) return;
    // A completed/abandoned attempt has a results page; an in-progress one resumes live.
    if (a.status === "active") router.push(`/adaptive-quizzes/session/${a.session_id}`);
    else router.push(`/adaptive-quizzes/session/${a.session_id}/results`);
  };

  return (
    <Box
      sx={{
        p: { xs: 1.75, md: 2 },
        borderRadius: 4,
        mb: 2,
        bgcolor: "color-mix(in srgb, #6366f1 7%, var(--card-bg))",
        border: "1px solid color-mix(in srgb, #6366f1 22%, transparent)",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Box
          sx={{
            width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center",
            color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", flexShrink: 0,
          }}
        >
          <Icon icon="mdi:history" width={19} />
        </Box>
        <Box sx={{ lineHeight: 1.1 }}>
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1" }}>
            Your attempts on this topic
          </Typography>
          <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: "text.primary" }}>
            {chain.total} quiz{chain.total === 1 ? "" : "zes"} taken
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", flex: 1, minWidth: 0, justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
        {chain.attempts.map((a) => (
          <ButtonBase
            key={a.session_id}
            onClick={() => go(a)}
            disabled={a.is_current}
            sx={{
              px: 1.4, py: 0.6, borderRadius: 999, fontWeight: 800, fontSize: "0.76rem", gap: 0.5,
              border: "1px solid",
              borderColor: a.is_current ? "#6366f1" : "color-mix(in srgb, #6366f1 28%, transparent)",
              color: a.is_current ? "white" : "#6366f1",
              bgcolor: a.is_current ? "#6366f1" : "color-mix(in srgb, #6366f1 8%, white)",
              cursor: a.is_current ? "default" : "pointer",
              "&:hover": { bgcolor: a.is_current ? "#6366f1" : "color-mix(in srgb, #6366f1 16%, white)" },
            }}
          >
            <Icon
              icon={a.status === "completed" ? "mdi:check-circle" : a.status === "active" ? "mdi:play-circle" : "mdi:close-circle-outline"}
              width={14}
            />
            {a.label}
            {a.is_current && <span style={{ opacity: 0.85 }}>· this one</span>}
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}
