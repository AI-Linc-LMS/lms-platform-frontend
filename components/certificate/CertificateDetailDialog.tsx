"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { learnerCertificatesService } from "@/lib/services/certificates.service";
import {
  certificateFileBase,
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/lib/certificates/export";
import { formatCertificateDate } from "@/lib/certificates/format";
import {
  getLinkedInAddToProfileUrl,
  openLinkedInPopup,
} from "@/lib/services/certificate-share.service";
import type { CertificateRenderPayload } from "@/lib/certificates/types";
import { CertificatePreview } from "./CertificatePreview";
import { useCertificateArtworkLabels } from "./CertificateArtwork";
import { certificateQueryKeys } from "./useLearnerCertificates";

/**
 * One credential, opened big, with everything a learner does with it.
 *
 * WHY THIS DOES NOT REUSE CertificateLearnerToolbar: that component is welded to
 * the previous stack. It mounts a <DynamicCertificate> off-screen from a
 * `CertificateContent` object and exports through lib/utils/certificate-export.utils.
 * Nothing in this module produces a CertificateContent, and mounting a second,
 * hidden certificate to export the one already on screen is how you end up
 * exporting a stale copy. The actions here drive the visible artwork's own ref
 * through lib/certificates/export.ts instead. CertificateShareButton, the other
 * candidate, was deleted with the mock certificate service it depended on.
 *
 * The payload is fetched fresh even when the caller already has one assembled
 * from the list endpoint. The gallery's local copy is good enough to DRAW - it
 * carries the frozen design snapshot - but it has a locally derived issuer and
 * no metric chips, and this is the copy that gets downloaded, printed and put on
 * LinkedIn. The server's payload is the authority for that, so the local one is
 * only ever the placeholder shown while the request is in flight.
 */

export interface CertificateDetailDialogProps {
  open: boolean;
  onClose: () => void;
  /** Null keeps the dialog mounted but idle between openings. */
  credentialId: string | null;
  /** Drawn immediately while the authoritative payload loads. */
  fallbackPayload?: CertificateRenderPayload | null;
  locale?: string;
}

export function CertificateDetailDialog({
  open,
  onClose,
  credentialId,
  fallbackPayload,
  locale = "en-GB",
}: CertificateDetailDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const labels = useCertificateArtworkLabels();

  // Points at the untransformed 1000x707 canvas, never at the scaled wrapper:
  // html-to-image measures clientWidth, which a CSS transform does not touch, so
  // this is what keeps a download full resolution however small the dialog is.
  const artworkRef = useRef<HTMLDivElement>(null);
  const [pngBusy, setPngBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: certificateQueryKeys.detail(credentialId ?? ""),
    queryFn: () => learnerCertificatesService.detail(credentialId as string),
    enabled: open && !!credentialId,
    staleTime: 5 * 60 * 1000,
  });

  const payload = data ?? fallbackPayload ?? null;
  const revoked = payload?.status === "revoked";

  const runExport = async (
    kind: "png" | "pdf",
    setBusy: (v: boolean) => void,
  ) => {
    const node = artworkRef.current;
    if (!node || !payload) {
      showToast(
        t("certificatesUpload.detailNotReady", "The certificate is still loading."),
        "warning",
      );
      return;
    }
    setBusy(true);
    try {
      const base = certificateFileBase(payload);
      if (kind === "png") await downloadCertificatePng(node, `${base}.png`);
      else await downloadCertificatePdf(node, `${base}.pdf`);
      showToast(
        t("certificatesUpload.detailExportDone", "Certificate downloaded."),
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : t("certificatesUpload.detailExportFailed", "Could not prepare the download."),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = async () => {
    if (!payload?.verify_url) return;
    try {
      await navigator.clipboard.writeText(payload.verify_url);
      showToast(
        t("certificatesUpload.detailLinkCopied", "Verification link copied."),
        "success",
      );
    } catch {
      // Clipboard access is denied outright in some embedded browsers, and a
      // silent failure here looks like the button does nothing.
      showToast(
        t("certificatesUpload.copyFailed", "Could not copy"),
        "error",
      );
    }
  };

  const handleLinkedIn = () => {
    if (!payload) return;
    if (revoked) {
      showToast(
        t(
          "certificatesUpload.detailRevokedShare",
          "This credential has been revoked and cannot be shared.",
        ),
        "warning",
      );
      return;
    }
    const issued = new Date(payload.issued_at);
    const valid = !Number.isNaN(issued.getTime());
    const now = new Date();
    // The "Add to Profile" deep link pre-fills LinkedIn's own certifications
    // form. No OAuth, no app review: the same mechanism Coursera and Udemy use.
    openLinkedInPopup(
      getLinkedInAddToProfileUrl({
        certificationName: payload.subtitle?.trim() || payload.title,
        organizationName: payload.issuer.name,
        issueYear: (valid ? issued : now).getFullYear(),
        issueMonth: (valid ? issued : now).getMonth() + 1,
        certUrl: payload.verify_url || undefined,
        certId: payload.credential_id,
      }),
    );
  };

  const metaRows = payload
    ? [
        {
          icon: "mdi:calendar-check-outline",
          label: t("certificatesUpload.artIssued", "Issued"),
          value: formatCertificateDate(payload.issued_at, locale),
        },
        {
          icon: "mdi:identifier",
          label: t("certificatesUpload.artCredentialId", "Credential ID"),
          value: payload.credential_id,
        },
        {
          icon: "mdi:bookmark-outline",
          label: t("certificatesUpload.detailAwardedFor", "Awarded for"),
          value: payload.source?.label ?? "",
        },
      ].filter((row) => row.value)
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 4 },
          bgcolor: theme.palette.background.paper,
          backgroundImage: "none",
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: theme.palette.warning.dark,
                '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
              }}
            >
              {payload?.title ??
                t("certificatesUpload.detailLoading", "Loading credential")}
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.15rem", sm: "1.4rem" },
                letterSpacing: "-0.5px",
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              {payload?.subtitle?.trim() || payload?.source?.label || " "}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label={t("common.close", "Close")}>
            <IconWrapper icon="mdi:close" size={22} />
          </IconButton>
        </Stack>

        {revoked && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              display: "flex",
              gap: 1,
              alignItems: "flex-start",
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              color: theme.palette.error.main,
            }}
          >
            <IconWrapper icon="mdi:alert-circle-outline" size={20} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                {t("certificatesUpload.detailRevokedTitle", "This credential was revoked")}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", opacity: 0.9 }}>
                {t(
                  "certificatesUpload.detailRevokedBody",
                  "The verification page still resolves and reports it as revoked. Contact your organisation if you think this is a mistake.",
                )}
              </Typography>
            </Box>
          </Box>
        )}

        {payload ? (
          <CertificatePreview
            ref={artworkRef}
            payload={payload}
            labels={labels}
            locale={locale}
            radius={10}
          />
        ) : (
          <Skeleton
            variant="rectangular"
            sx={{ width: "100%", aspectRatio: "1000 / 707", borderRadius: "10px" }}
          />
        )}

        {metaRows.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            {metaRows.map((row) => (
              <Stack
                key={row.label}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.text.primary, 0.02),
                  minWidth: 0,
                }}
              >
                <Box sx={{ color: theme.palette.text.disabled, flexShrink: 0 }}>
                  <IconWrapper icon={row.icon} size={18} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: theme.palette.text.disabled,
                      '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                    }}
                  >
                    {row.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={row.value}
                  >
                    {row.value}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        )}

        <Stack
          direction="row"
          spacing={1.25}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2.5 }}
        >
          <Button
            variant="contained"
            disabled={!payload || pngBusy || isLoading}
            onClick={() => runExport("png", setPngBusy)}
            startIcon={
              pngBusy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:image-outline" size={19} />
              )
            }
            sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            {t("certificatesUpload.detailDownloadPng", "Download PNG")}
          </Button>
          <Button
            variant="outlined"
            disabled={!payload || pdfBusy || isLoading}
            onClick={() => runExport("pdf", setPdfBusy)}
            startIcon={
              pdfBusy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:file-pdf-box" size={19} />
              )
            }
            sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            {t("certificatesUpload.detailDownloadPdf", "Download PDF")}
          </Button>
          <Button
            variant="outlined"
            disabled={!payload?.verify_url}
            onClick={handleCopyLink}
            startIcon={<IconWrapper icon="mdi:link-variant" size={19} />}
            sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            {t("certificatesUpload.detailCopyLink", "Copy verify link")}
          </Button>
          <Button
            variant="outlined"
            disabled={!payload}
            onClick={handleLinkedIn}
            startIcon={<IconWrapper icon="mdi:linkedin" size={19} />}
            sx={{ borderRadius: 999, fontWeight: 800, textTransform: "none" }}
          >
            {t("certificatesUpload.detailShareLinkedIn", "Share to LinkedIn")}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
