"use client";

import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  useCertificateActions,
  type UseCertificateActionsOptions,
} from "@/components/certificate/useCertificateActions";

interface CertificateButtonsProps extends UseCertificateActionsOptions {
  courseId: number;
  /** URL to share (certificate page or course page). Defaults to current window URL. */
  certificateUrl?: string;
}

/**
 * Learner certificate actions for the legacy LMS course page — Download +
 * Share on LinkedIn + Add to LinkedIn profile, as full-size buttons. All the
 * capture/share logic lives in the shared `useCertificateActions` hook.
 */
export function CertificateButtons(props: CertificateButtonsProps) {
  const cert = useCertificateActions(props);

  if (!cert.available) return null;

  const linkedInSx = {
    borderColor: "#0077b5",
    color: "#0077b5",
    "&:hover": { borderColor: "#005885", backgroundColor: "rgba(0, 119, 181, 0.04)" },
  } as const;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
      {cert.portal}

      {!cert.ready && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Sign in to generate your certificate.
        </Typography>
      )}
      {cert.ready && !cert.canClaim && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Complete {cert.minPct}% of the course to unlock certificate download and sharing.
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={
            cert.downloading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <IconWrapper icon="mdi:download" size={20} />
            )
          }
          onClick={cert.downloadCertificate}
          disabled={cert.downloading || !cert.hasUser || !cert.canClaim}
          sx={{
            backgroundColor: "var(--primary-600)",
            color: "var(--font-light)",
            "&:hover": { backgroundColor: "var(--primary-700)" },
          }}
        >
          {cert.downloading ? "Downloading..." : "Download Certificate"}
        </Button>

        <Button
          variant="outlined"
          startIcon={
            cert.sharing ? <CircularProgress size={20} /> : <IconWrapper icon="mdi:linkedin" size={20} />
          }
          onClick={cert.shareOnLinkedIn}
          disabled={!cert.hasUser || cert.sharing || !cert.canClaim}
          sx={linkedInSx}
        >
          Share on LinkedIn
        </Button>

        <Button
          variant="outlined"
          startIcon={<IconWrapper icon="mdi:linkedin" size={20} />}
          onClick={cert.addToLinkedInProfile}
          disabled={!cert.hasUser || !cert.canClaim}
          sx={linkedInSx}
        >
          Add to LinkedIn profile
        </Button>
      </Box>
    </Box>
  );
}
