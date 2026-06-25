"use client";

import { Box, ButtonBase, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useCertificateActions } from "@/components/certificate/useCertificateActions";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

/** Compact pill button matching the adaptive journey side-panel style. */
function Pill({
  icon,
  label,
  onClick,
  disabled,
  busy,
  tone,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  busy?: boolean;
  tone: "primary" | "linkedin";
}) {
  const active = !disabled;
  const color = active ? (tone === "primary" ? "white" : "#0a66c2") : "#64748b";
  const bgcolor = active && tone === "primary" ? "#6366f1" : "#f1f5f9";
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        flex: 1,
        py: 0.9,
        px: 1,
        borderRadius: 2,
        fontWeight: 700,
        fontSize: "0.8rem",
        gap: 0.5,
        color,
        bgcolor,
        border: "1px solid #eef2f7",
        transition: "filter 120ms ease",
        "&:hover": { filter: active ? "brightness(0.96)" : "none" },
      }}
    >
      {busy ? <CircularProgress size={14} sx={{ color }} /> : <Icon icon={icon} width={16} />}
      {label}
    </ButtonBase>
  );
}

/**
 * Learner certificate card for the adaptive journey — the compact card with a
 * download + LinkedIn-share pill (matching the journey side-panel style),
 * powered by the shared certificate hook. The LinkedIn post is AI-generated
 * from the course (with a local fallback).
 */
export function CertificateCard({ board }: { board: JourneyBoard }) {
  const c = board.course;
  const completion = board.progressCard.completionPct ?? 0;

  const cert = useCertificateActions({
    courseTitle: c.certificateTitle || c.title,
    certificateAvailable: c.certificateEnabled,
    uploadedTemplateUrl: c.certificateTemplateUrl,
    completionPercentage: completion,
    minCompletion: c.certificateThreshold,
    score: `${completion}%`,
    courseDescription: c.description,
    generatePost: () => adaptiveJourneyService.getCertificateLinkedInPost(c.id),
  });

  return (
    <Box sx={{ p: 2, mb: 2, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
      {cert.portal}

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
          <Icon icon="mdi:certificate" width={17} />
        </Box>
        <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>Certificate</Typography>
      </Stack>

      <Typography sx={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
        {cert.canClaim ? (
          <>Your certificate is ready — download it or share it on LinkedIn. 🎓</>
        ) : (
          <>
            Complete <b style={{ color: "#0f172a" }}>{c.certificateThreshold}%</b> of the course to unlock
            certificate download &amp; LinkedIn sharing.
          </>
        )}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Pill
          icon="mdi:download"
          label={cert.downloading ? "Preparing…" : "Certificate"}
          onClick={cert.downloadCertificate}
          disabled={!cert.canClaim || cert.downloading}
          busy={cert.downloading}
          tone="primary"
        />
        <Pill
          icon="mdi:linkedin"
          label="Share"
          onClick={cert.shareOnLinkedIn}
          disabled={!cert.canClaim || cert.sharing}
          busy={cert.sharing}
          tone="linkedin"
        />
      </Stack>

      <ButtonBase
        onClick={cert.addToLinkedInProfile}
        disabled={!cert.canClaim}
        sx={{
          mt: 1,
          gap: 0.5,
          fontSize: "0.76rem",
          fontWeight: 700,
          color: cert.canClaim ? "#0a66c2" : "#94a3b8",
          "&:hover": { textDecoration: cert.canClaim ? "underline" : "none" },
        }}
      >
        <Icon icon="mdi:linkedin" width={14} /> Add to LinkedIn profile
      </ButtonBase>
    </Box>
  );
}
