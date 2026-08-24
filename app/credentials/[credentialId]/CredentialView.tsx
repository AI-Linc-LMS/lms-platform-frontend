"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import {
  certificateFileBase,
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/lib/certificates/export";
import { formatCertificateDate } from "@/lib/certificates/format";
import { publicCertificatesService } from "@/lib/services/certificates.service";
import type { CertificateRenderPayload } from "@/lib/certificates/types";

type LoadState = "loading" | "ok" | "notfound";

/**
 * The public verification page. Anyone with the link, signed in or not, lands
 * here from a LinkedIn profile, a CV, or a recruiter pasting a credential id.
 *
 * Three things this page has to get right, all of them learned the hard way:
 *
 *  - It renders the SAME artwork the learner downloaded, from the server's
 *    render payload. The previous version drew a card of its own and then
 *    POSTed the recipient's name to an unauthenticated node-canvas route to
 *    paint it onto a template image, so what a verifier saw and what the
 *    learner held were two different pictures produced by two different code
 *    paths.
 *  - A revoked credential renders as REVOKED. Not as a 404, because the link is
 *    already published and a dead link reads as a broken site; and not as a
 *    valid certificate, because that is the entire point of revocation.
 *  - It works in both colour schemes. A verifier following a link at night gets
 *    the dark shell, and the certificate itself keeps its own paper colours
 *    because the artwork is a document, not a UI surface.
 */
export function CredentialView({ credentialId }: { credentialId: string }) {
  const theme = useTheme();
  const { t } = useTranslation("common");
  const [cred, setCred] = useState<CertificateRenderPayload | null>(null);
  const [status, setStatus] = useState<LoadState>("loading");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  // The ref must land on the untransformed 1000x707 artwork node, which is what
  // CertificatePreview forwards, so the export is full resolution however small
  // the preview is being displayed.
  const artworkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await publicCertificatesService.getCredential(credentialId);
        if (cancelled) return;
        if (c?.credential_id) {
          setCred(c);
          setStatus("ok");
        } else {
          setStatus("notfound");
        }
      } catch {
        if (!cancelled) setStatus("notfound");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [credentialId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        cred?.verify_url || (typeof window !== "undefined" ? window.location.href : ""),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the URL is in the address bar anyway */
    }
  };

  const download = async (format: "png" | "pdf") => {
    const node = artworkRef.current;
    if (!cred || !node || exporting) return;
    try {
      setExporting(format);
      const base = certificateFileBase(cred);
      if (format === "png") await downloadCertificatePng(node, `${base}.png`);
      else await downloadCertificatePdf(node, `${base}.pdf`);
    } catch {
      /* the buttons re-enable; nothing is lost by a failed export */
    } finally {
      setExporting(null);
    }
  };

  const revoked = cred?.status === "revoked";
  const subject = cred?.subtitle?.trim() || cred?.source?.label?.trim() || cred?.title || "";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, md: 4 },
        bgcolor: "background.default",
        // A soft tint rather than a fixed pastel gradient: the old hardcoded
        // indigo-to-pink wash was invisible white glare in dark mode.
        backgroundImage: `radial-gradient(120% 90% at 50% 0%, ${alpha(
          theme.palette.primary.main,
          theme.palette.mode === "dark" ? 0.16 : 0.1,
        )} 0%, transparent 62%)`,
      }}
    >
      {status === "loading" && <CircularProgress />}

      {status === "notfound" && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            maxWidth: 460,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <IconWrapper icon="mdi:alert-circle-outline" size={48} color={theme.palette.warning.main} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", mt: 1 }}>
            {t("certificates.notFoundTitle", "Credential not found")}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            {t(
              "certificates.notFoundBody",
              "We could not find a credential with this ID. It may have been mistyped.",
            )}
          </Typography>
          <Typography sx={{ fontFamily: "monospace", fontWeight: 700, mt: 1.5 }}>
            {credentialId}
          </Typography>
        </Paper>
      )}

      {status === "ok" && cred && (
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 860,
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: `0 30px 60px -30px ${alpha(theme.palette.common.black, 0.35)}`,
          }}
        >
          <Box
            sx={{
              height: 8,
              background: revoked
                ? `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`
                : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          />

          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              spacing={1.5}
              sx={{ mb: 3 }}
            >
              {cred.issuer?.logo_url ? (
                // A tenant logo is an arbitrary remote URL, so it stays a plain
                // <img>: next/image would need every tenant host allowlisted.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cred.issuer.logo_url}
                  alt={cred.issuer.name}
                  style={{ height: 36, objectFit: "contain" }}
                />
              ) : (
                <Typography sx={{ fontWeight: 900, fontSize: "1.1rem" }}>
                  {cred.issuer?.name}
                </Typography>
              )}

              <Chip
                icon={
                  <IconWrapper
                    icon={revoked ? "mdi:close-octagon-outline" : "mdi:check-decagram"}
                    size={18}
                  />
                }
                label={
                  revoked
                    ? t("certificates.statusRevoked", "Revoked credential")
                    : t("certificates.statusVerified", "Verified credential")
                }
                sx={{
                  fontWeight: 800,
                  color: revoked ? "error.main" : "success.main",
                  bgcolor: alpha(
                    revoked ? theme.palette.error.main : theme.palette.success.main,
                    theme.palette.mode === "dark" ? 0.2 : 0.12,
                  ),
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            </Stack>

            {revoked && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.error.main, 0.4),
                  bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.16 : 0.08),
                }}
              >
                <Typography sx={{ fontWeight: 800, color: "error.main" }}>
                  {t("certificates.revokedTitle", "This credential is no longer valid")}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                  {t(
                    "certificates.revokedBody",
                    "It was issued and has since been revoked by the issuing organization. It should not be treated as proof of achievement.",
                  )}
                </Typography>
              </Box>
            )}

            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {revoked
                ? t("certificates.wasIssuedTo", "This credential was issued to")
                : t("certificates.certifiesThat", "This certifies that")}
            </Typography>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.7rem", md: "2.2rem" },
                lineHeight: 1.15,
                mt: 0.5,
              }}
            >
              {cred.recipient_name}
            </Typography>
            {subject && (
              <Typography
                sx={{ fontWeight: 800, fontSize: { xs: "1.1rem", md: "1.35rem" }, mt: 1, color: "primary.main" }}
              >
                {subject}
              </Typography>
            )}

            {/* The credential itself, drawn from the server's payload. Revoked
                artwork carries its own stamp, so it can never be screenshotted
                out of this page and passed off as current. */}
            <Box sx={{ mt: 3 }}>
              <CertificatePreview ref={artworkRef} payload={cred} />
            </Box>

            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
              <Meta label={t("certificates.issuedBy", "Issued by")} value={cred.issuer?.name || ""} />
              <Meta
                label={t("certificates.issuedOn", "Issued on")}
                value={formatCertificateDate(cred.issued_at)}
              />
              {cred.metrics?.map((m) => (
                <Meta key={`${m.label}-${m.value}`} label={m.label} value={m.value} />
              ))}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                  }}
                >
                  {t("certificates.credentialIdLabel", "Credential ID")}
                </Typography>
                <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem" }}>
                  {cred.credential_id}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {/* Downloads stay available on a revoked credential on purpose:
                    the artwork stamps itself REVOKED, and the person who earned
                    it is entitled to their own record of what happened. */}
                <Button
                  variant="outlined"
                  disabled={exporting !== null}
                  startIcon={
                    exporting === "png" ? (
                      <CircularProgress size={16} />
                    ) : (
                      <IconWrapper icon="mdi:image-outline" size={18} />
                    )
                  }
                  onClick={() => download("png")}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {t("certificates.downloadPng", "Download PNG")}
                </Button>
                <Button
                  variant="outlined"
                  disabled={exporting !== null}
                  startIcon={
                    exporting === "pdf" ? (
                      <CircularProgress size={16} />
                    ) : (
                      <IconWrapper icon="mdi:file-pdf-box" size={18} />
                    )
                  }
                  onClick={() => download("pdf")}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {t("certificates.downloadPdf", "Download PDF")}
                </Button>
                <Button
                  onClick={copyLink}
                  variant="contained"
                  startIcon={<IconWrapper icon={copied ? "mdi:check" : "mdi:link-variant"} size={18} />}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {copied
                    ? t("certificates.linkCopied", "Verification link copied.")
                    : t("certificates.copyVerifyLink", "Copy verification link")}
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              px: { xs: 2.5, md: 4 },
              py: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.04),
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
              <IconWrapper
                icon="mdi:shield-check-outline"
                size={15}
                style={{ verticalAlign: "-2px", marginInlineEnd: 4 }}
              />
              {revoked
                ? t(
                    "certificates.footerRevoked",
                    "This record is served directly by the issuing organization, which has revoked it. Anyone with this link sees the same status.",
                  )
                : t(
                    "certificates.footerVerified",
                    "This is a verified credential served directly by the issuing organization. Anyone with this link can confirm it.",
                  )}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Box>
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{value}</Typography>
    </Box>
  );
}
