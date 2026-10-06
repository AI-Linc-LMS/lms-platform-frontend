"use client";

/**
 * The certificate, as ONE station at the end of the journey.
 *
 * It rendered twice for a while: a milestone card saying "Your course certificate — finish 80%
 * and it unlocks here", and immediately beneath it the full `CertificateCard` saying "Complete
 * 80% of the course to unlock certificate download & LinkedIn sharing". The same thing, told
 * twice, in two different voices.
 *
 * This is the milestone chrome and the real certificate machinery in one card. The actions come
 * from `useCertificateActions`, the same hook the old card used, so download, LinkedIn share
 * and Add-to-profile keep the server-decided `canClaim` gate - eligibility is the backend's
 * answer, never a percentage compared in the browser.
 */

import { useState } from "react";
import { Box, ButtonBase, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useCertificateActions } from "@/components/certificate/useCertificateActions";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import { getPublicAppOrigin } from "@/lib/config";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";
import { SpineRow } from "./SpineRow";
import { MilestoneMarker } from "./MilestoneRow";
import { CertificatePreviewDialog } from "./CertificatePreviewDialog";

function Action({
  icon, label, onClick, disabled, busy, primary,
}: {
  icon: string; label: string; onClick: () => void;
  disabled?: boolean; busy?: boolean; primary?: boolean;
}) {
  return (
    <ButtonBase
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      sx={{
        flexShrink: 0, gap: 0.6, px: 2, py: 0.9, borderRadius: 2,
        fontWeight: 800, fontSize: "0.8rem",
        ...(primary
          ? { color: "white", background: "linear-gradient(135deg, #f59e0b 0%, #db2777 100%)" }
          : { color: "#b45309", border: "1px solid #fcd34d", bgcolor: "#fffbeb" }),
        "&.Mui-disabled": { opacity: 0.45, color: primary ? "white" : "#b45309" },
        [PHONE]: { minHeight: 44, fontSize: "0.9rem", borderRadius: 2.5 },
      }}
    >
      {busy ? <CircularProgress size={14} thickness={5} sx={{ color: "inherit" }} />
            : <Icon icon={icon} width={16} />}
      {label}
    </ButtonBase>
  );
}

export function CertificateMilestone({
  board, first, last,
}: {
  board: JourneyBoard;
  first?: boolean;
  last?: boolean;
}) {
  const c = board.course;
  const completion = board.progressCard?.completionPct ?? 0;
  const [preview, setPreview] = useState(false);
  const cert = useCertificateActions({
    courseTitle: c.certificateTitle || c.title,
    certificateAvailable: c.certificateEnabled,
    uploadedTemplateUrl: c.certificateTemplateUrl,
    completionPercentage: completion,
    minCompletion: c.certificateThreshold,
    score: `${completion}%`,
    courseDescription: c.description,
    generatePost: () => adaptiveJourneyService.getCertificateLinkedInPost(c.id),
    getCredential: async () => {
      const cred = await adaptiveJourneyService.issueCertificate(c.id);
      return {
        credentialId: cred.credential_id,
        verifyUrl: `${getPublicAppOrigin()}/credentials/${cred.credential_id}`,
      };
    },
  });

  const threshold = cert.minPct || c.certificateThreshold || 80;
  // Progress toward the bar, for the strip. It is DECORATION: whether the certificate can
  // actually be claimed is `cert.canClaim`, which is the server's answer. A percentage
  // compared here is the exact bug `useCertificateActions` documents having removed.
  const pct = Math.max(0, Math.min(100, Math.round((completion / Math.max(1, threshold)) * 100)));

  return (
    <SpineRow
      marker={<MilestoneMarker reached={cert.canClaim} icon="mdi:certificate" />}
      tone={cert.canClaim ? "done" : "ahead"}
      first={first}
      last={last}
    >
      {cert.portal}
      <CertificatePreviewDialog
        open={preview}
        onClose={() => setPreview(false)}
        courseTitle={c.certificateTitle || c.title}
        completion={completion}
        threshold={threshold}
        earned={cert.canClaim}
      />
      <Box
        sx={{
          mb: 1.5, p: { xs: 1.75, md: 2.25 }, borderRadius: 3.5,
          bgcolor: "#fff", border: "1px solid",
          borderColor: cert.canClaim ? "#bbf7d0" : "#fde68a",
          backgroundImage: cert.canClaim
            ? "linear-gradient(120deg, #f0fdf4 0%, #ffffff 55%)"
            : "linear-gradient(120deg, #fffbeb 0%, #ffffff 55%)",
          boxShadow: "0 10px 26px -24px rgba(245,158,11,0.9)",
          [PHONE]: { p: 1.5 },
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}
               justifyContent="space-between" alignItems={{ sm: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
                display: "grid", placeItems: "center", color: "white",
                background: cert.canClaim
                  ? "linear-gradient(135deg, #22c55e 0%, #15803d 100%)"
                  : "linear-gradient(135deg, #f59e0b 0%, #db2777 100%)",
                boxShadow: "0 10px 22px -14px rgba(245,158,11,0.9)",
              }}
            >
              <Icon icon="mdi:trophy" width={21} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.8,
                  color: cert.canClaim ? "#15803d" : "#b45309",
                  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                  [PHONE]: { fontSize: "0.72rem", letterSpacing: 0.5 },
                }}
              >
                CERTIFICATE
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mt: 0.25, color: "#0f172a", [PHONE]: { fontSize: "1rem" } }}>
                {c.certificateTitle || "Certificate of completion"}
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mt: 0.5, lineHeight: 1.5, [PHONE]: { fontSize: "0.85rem" } }}>
                {cert.canClaim
                  ? "Yours. Verifiable, shareable, and shown to recruiters in Jobs."
                  : `Finish ${threshold}% of this course to unlock it. Verifiable, shareable, and shown to recruiters in Jobs.`}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            {/* Always available, earned or not. A learner who can almost read their own name on
                it has a reason to finish; "complete 80%" alone gives them nothing to want. */}
            <Action
              icon="mdi:eye-outline"
              label="Preview"
              onClick={() => setPreview(true)}
            />
            {cert.canClaim && (
              <>
                <Action
                  icon="mdi:download"
                  label={cert.downloading ? "Preparing…" : "Certificate"}
                  onClick={cert.downloadCertificate}
                  disabled={cert.downloading}
                  busy={cert.downloading}
                  primary
                />
                <Action
                  icon="mdi:linkedin"
                  label="Share"
                  onClick={cert.shareOnLinkedIn}
                  disabled={cert.sharing}
                  busy={cert.sharing}
                />
              </>
            )}
          </Stack>
        </Stack>

        {!cert.canClaim && (
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                flex: 1, height: 6, borderRadius: 3, bgcolor: "#fef3c7",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  background: "linear-gradient(90deg, #f59e0b, #db2777)",
                },
              }}
            />
            <Typography
              sx={{
                fontSize: "0.7rem", fontWeight: 800, letterSpacing: 0.6, color: "#b45309",
                flexShrink: 0,
                '[dir="rtl"] &': { letterSpacing: "normal" },
                [PHONE]: { fontSize: "0.76rem" },
              }}
            >
              {completion}% OF {threshold}%
            </Typography>
          </Stack>
        )}

        {cert.canClaim && (
          <ButtonBase
            onClick={(e) => { e.stopPropagation(); cert.addToLinkedInProfile(); }}
            sx={{
              mt: 1.25, gap: 0.5, fontSize: "0.76rem", fontWeight: 700, color: "#0a66c2",
              "&:hover": { textDecoration: "underline" },
              [PHONE]: { minHeight: 44, fontSize: "0.82rem" },
            }}
          >
            <Icon icon="mdi:linkedin" width={14} /> Add to LinkedIn profile
          </ButtonBase>
        )}
      </Box>
    </SpineRow>
  );
}
