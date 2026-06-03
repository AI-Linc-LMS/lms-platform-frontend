"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Typography, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { adaptiveQuizService } from "@/lib/services/adaptive-quiz.service";
import { useAdaptiveFeatureGuard } from "@/hooks/useAdaptiveFeatureGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { AIBeacon } from "@/components/adaptive-quiz/shared/AIBeacon";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";

/**
 * Pre-flight screen for the adaptive quiz.
 *
 * Lands the student on /adaptive-quizzes/start?configId=NN. We open a session
 * eagerly so the engine has the first question ready before the student lands
 * on the live surface, then redirect to /adaptive-quizzes/session/<id>.
 */
export default function AdaptiveQuizStartPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const featureOn = useAdaptiveFeatureGuard();

  const configIdRaw = searchParams.get("configId");
  const configId = configIdRaw ? Number(configIdRaw) : null;

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!featureOn) {
      setError("Adaptive quiz isn't enabled for this organisation.");
    } else if (!configId) {
      setError("No quiz specified. Open this from the Adaptive Quizzes library.");
    }
  }, [featureOn, configId]);

  async function handleStart() {
    if (!configId) return;
    setStarting(true);
    setError(null);
    try {
      const res = await adaptiveQuizService.startSession(configId);
      router.replace(`/adaptive-quizzes/session/${res.session_id}`);
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : "Unable to start adaptive session.";
      setError(detail);
    } finally {
      setStarting(false);
    }
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
            border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
            backdropFilter: "blur(18px) saturate(140%)",
            boxShadow:
              "0 1px 0 0 color-mix(in srgb, white 14%, transparent) inset, 0 24px 60px -32px rgba(99, 102, 241, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <AIBeacon size={64} />
          <AIPill icon={<Icon icon="mdi:robot-happy-outline" width={14} />}>Adaptive Engine</AIPill>
          <Typography sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.025em" }}>
            A quiz that adapts to you
          </Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 520, lineHeight: 1.55 }}>
            Each answer updates a private model of your skills. We pick the next question to learn
            the most about where you are — and where to coach you next. Expect 5–10 questions, with
            the difficulty shifting as your confidence does.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Feature icon="mdi:tune-vertical" label="Difficulty adapts live" />
            <Feature icon="mdi:chart-bell-curve-cumulative" label="Per-skill confidence" />
            <Feature icon="mdi:thought-bubble-outline" label="Reasons explained" />
          </Box>

          {error && <Typography sx={{ color: "#ef4444", fontWeight: 700 }}>{error}</Typography>}

          <ButtonBase
            onClick={() => void handleStart()}
            disabled={!configId || !featureOn || starting}
            sx={{
              mt: 1,
              px: 4,
              py: 1.6,
              borderRadius: 999,
              fontWeight: 800,
              fontSize: "1rem",
              color: "white",
              background: starting
                ? "color-mix(in srgb, #6366f1 50%, transparent)"
                : "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
              boxShadow: "0 18px 36px -16px rgba(99, 102, 241, 0.55)",
              transition: "transform 120ms ease, box-shadow 120ms ease",
              "&:hover": { transform: starting ? "none" : "translateY(-1px)" },
              "&:disabled": { cursor: "not-allowed", opacity: 0.7 },
            }}
          >
            {starting ? "Opening your session…" : "Start adaptive quiz"}
          </ButtonBase>
        </Box>
      </Container>
    </MainLayout>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 50%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
      }}
    >
      <Icon icon={icon} width={16} style={{ color: "#6366f1" }} />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{label}</Typography>
    </Box>
  );
}
