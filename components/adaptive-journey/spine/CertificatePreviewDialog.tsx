"use client";

/**
 * The certificate, shown before it is earned.
 *
 * A learner who can almost read their own name on it has a reason to finish the course; a card
 * that only says "complete 80%" gives them nothing to want. So this renders the REAL document -
 * the same `DynamicCertificate` the download captures, built from the same content - rather
 * than a placeholder drawing of one.
 *
 * Until it is earned the artwork sits behind a scrim that says so. The scrim is a sibling of
 * the certificate, never painted into it: the export pipeline filters on
 * `exclude-from-certificate-export`, and a learner who later downloads the real thing must not
 * find "Preview" burned into the image.
 */

import { Box, Dialog, DialogContent, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useOptionalClientInfo } from "@/lib/contexts/ClientInfoContext";
import { getUserDisplayName } from "@/lib/utils/user-utils";
import { buildCourseCompletionCertificate } from "@/lib/certificate/copy";
import { buildCertificateBranding, finalizeBranding } from "@/lib/certificate/client-branding";
import { DynamicCertificate } from "@/components/certificate/DynamicCertificate";
import { PHONE } from "@/components/common/mobile/phone";

export function CertificatePreviewDialog({
  open,
  onClose,
  courseTitle,
  completion,
  threshold,
  earned,
}: {
  open: boolean;
  onClose: () => void;
  courseTitle: string;
  /** This learner's completion percent, for the progress line. */
  completion: number;
  /** What the course issues at. */
  threshold: number;
  /** The server's answer, not a comparison made here. */
  earned: boolean;
}) {
  const { user } = useAuth();
  const clientInfo = useOptionalClientInfo();

  // Built exactly as `useCertificateActions` builds it, so the preview and the download are the
  // same document rather than two drawings that happen to look alike.
  const content = useMemo(() => {
    if (!user || !courseTitle.trim()) return null;
    return buildCourseCompletionCertificate({
      recipientName: getUserDisplayName(user),
      courseTitle: courseTitle.trim(),
      branding: finalizeBranding(buildCertificateBranding(clientInfo)),
    });
  }, [user, courseTitle, clientInfo]);

  const pct = Math.max(0, Math.min(100, Math.round((completion / Math.max(1, threshold)) * 100)));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: "#faf9ff" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.8, color: "#b45309", '[dir="rtl"] &': { letterSpacing: "normal" } }}>
              CERTIFICATE
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#0f172a" }}>
              {earned ? "Your certificate" : "Your certificate, when you finish"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close the certificate preview" sx={{ [PHONE]: { width: 44, height: 44 } }}>
            <Icon icon="mdi:close" width={20} />
          </IconButton>
        </Stack>

        {content ? (
          <Box
            sx={{
              position: "relative",
              borderRadius: 3,
              overflow: "hidden",
              // The gradient frame from the design, as a border rather than part of the document.
              p: "4px",
              background: "linear-gradient(135deg, #f59e0b 0%, #db2777 45%, #7c3aed 100%)",
            }}
          >
            <Box
              sx={{
                borderRadius: 2.5,
                overflow: "hidden",
                bgcolor: "#fff",
                // Scaled to the dialog: the document is authored at 1200x675.
                "& > *": { width: "100% !important", height: "auto !important" },
                ...(earned ? {} : { filter: "saturate(0.92)" }),
              }}
            >
              <DynamicCertificate content={content} />
            </Box>

            {!earned && (
              <Stack
                className="exclude-from-certificate-export"
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{
                  position: "absolute", left: 4, right: 4, bottom: 4,
                  py: 1.25, bgcolor: "rgba(15,23,42,0.86)", color: "white",
                  borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
                }}
              >
                <Icon icon="mdi:lock-outline" width={15} />
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  Preview · issued at {threshold}% complete
                </Typography>
              </Stack>
            )}
          </Box>
        ) : (
          <Typography sx={{ py: 4, textAlign: "center", color: "#64748b", fontSize: "0.88rem" }}>
            Sign in to see your certificate.
          </Typography>
        )}

        {!earned && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                flex: 1, height: 7, borderRadius: 4, bgcolor: "#fef3c7",
                "& .MuiLinearProgress-bar": { borderRadius: 4, background: "linear-gradient(90deg, #f59e0b, #db2777)" },
              }}
            />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#b45309", flexShrink: 0 }}>
              {completion}% of {threshold}%
            </Typography>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
