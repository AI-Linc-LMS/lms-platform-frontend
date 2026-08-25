"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
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
import {
  CERT,
  CERT_BAR_GRADIENT,
  CERT_CTA_GRADIENT,
  CERT_CTA_SHADOW,
} from "@/lib/certificates/ui-tokens";
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
 *  - It has to look like the product to somebody who has never seen the
 *    product. This is the one certificate surface with no app chrome around it
 *    and no logged-in user, so it carries the platform's own language on its
 *    own: the `#fbfbfd` canvas and violet identity of the signed-out auth
 *    screens (components/auth/layout/authTokens.ts) and the student dashboard,
 *    with the tenant's logo as the only variable.
 *
 * On colour: this page used to run every surface through `useTheme()` and
 * `alpha()`, branching on `theme.palette.mode === "dark"`. That mode is never
 * set to "dark" anywhere in this app, so those branches never ran, while
 * `palette.primary` and `palette.secondary` ARE tenant-overridable - which meant
 * the accent bar and the primary button were an unpredictable blue-and-crimson
 * pair rather than the certificate violet a learner sees on their dashboard.
 * The values below are literal for the same reason authTokens.ts is.
 */
export function CredentialView({ credentialId }: { credentialId: string }) {
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
        p: { xs: 1.5, sm: 3, md: 4 },
        bgcolor: CANVAS,
        // The same violet wash the dashboard hero sits in, at a fraction of its
        // strength: this page is a document on a desk, not a hero.
        backgroundImage:
          "radial-gradient(120% 90% at 50% 0%, rgba(124,58,237,0.10) 0%, rgba(251,251,253,0) 62%)",
      }}
    >
      {status === "loading" && <CircularProgress sx={{ color: CERT.violet }} />}

      {status === "notfound" && (
        <Box
          sx={{
            ...cardSx,
            p: { xs: 3, md: 4 },
            maxWidth: 460,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: "auto",
              mb: 1.5,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "#fef2f2",
              color: "#b91c1c",
            }}
          >
            <IconWrapper icon="mdi:alert-circle-outline" size={28} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: CERT.ink }}>
            {t("certificates.notFoundTitle", "Credential not found")}
          </Typography>
          <Typography sx={{ color: CERT.inkFaint, fontSize: "0.88rem", mt: 1, lineHeight: 1.55 }}>
            {t(
              "certificates.notFoundBody",
              "We could not find a credential with this ID. It may have been mistyped.",
            )}
          </Typography>
          <Typography
            sx={{
              display: "inline-block",
              mt: 2,
              px: 1.25,
              py: 0.5,
              borderRadius: 2,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: CERT.inkMuted,
              bgcolor: "#f8fafc",
              border: `1px solid ${CERT.hairlineSoft}`,
              wordBreak: "break-all",
            }}
          >
            {credentialId}
          </Typography>
        </Box>
      )}

      {status === "ok" && cred && (
        <Box
          sx={{
            ...cardSx,
            width: "100%",
            maxWidth: 860,
            overflow: "hidden",
            // The single object on an otherwise empty page, so it carries the
            // dashboard hero's lift rather than a panel's.
            boxShadow: "0 24px 60px -30px rgba(76,29,149,0.7)",
          }}
        >
          <Box
            sx={{
              height: 8,
              background: revoked
                ? "linear-gradient(90deg, #b91c1c, #ef4444)"
                : CERT_BAR_GRADIENT,
            }}
          />

          <Box sx={{ p: { xs: 2, sm: 2.75, md: 4 } }}>
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
                  style={{ height: 36, maxWidth: "min(220px, 55vw)", objectFit: "contain" }}
                />
              ) : (
                <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: CERT.ink }}>
                  {cred.issuer?.name}
                </Typography>
              )}

              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.1,
                  py: 0.45,
                  borderRadius: 999,
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  color: revoked ? "#b91c1c" : "#15803d",
                  bgcolor: revoked ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${revoked ? "#fecaca" : "#dcfce7"}`,
                  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                }}
              >
                <IconWrapper
                  icon={revoked ? "mdi:close-octagon-outline" : "mdi:check-decagram"}
                  size={16}
                />
                {revoked
                  ? t("certificates.statusRevoked", "Revoked credential")
                  : t("certificates.statusVerified", "Verified credential")}
              </Box>
            </Stack>

            {revoked && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2.5,
                  border: "1px solid #fecaca",
                  bgcolor: "#fef2f2",
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#b91c1c" }}>
                  {t("certificates.revokedTitle", "This credential is no longer valid")}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.85rem", color: CERT.inkFaint, mt: 0.5, lineHeight: 1.55 }}
                >
                  {t(
                    "certificates.revokedBody",
                    "It was issued and has since been revoked by the issuing organization. It should not be treated as proof of achievement.",
                  )}
                </Typography>
              </Box>
            )}

            <Typography sx={eyebrowSx}>
              {revoked
                ? t("certificates.wasIssuedTo", "This credential was issued to")
                : t("certificates.certifiesThat", "This certifies that")}
            </Typography>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.55rem", sm: "1.8rem", md: "2.2rem" },
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                color: CERT.ink,
                mt: 0.5,
                overflowWrap: "anywhere",
              }}
            >
              {cred.recipient_name}
            </Typography>
            {subject && (
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.05rem", md: "1.35rem" },
                  lineHeight: 1.25,
                  mt: 1,
                  color: CERT.violet,
                  overflowWrap: "anywhere",
                }}
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

            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(auto-fit, minmax(160px, 1fr))",
                },
                gap: 1.5,
              }}
            >
              <Meta label={t("certificates.issuedBy", "Issued by")} value={cred.issuer?.name || ""} />
              <Meta
                label={t("certificates.issuedOn", "Issued on")}
                value={formatCertificateDate(cred.issued_at)}
              />
              {cred.metrics?.map((m) => (
                <Meta key={`${m.label}-${m.value}`} label={m.label} value={m.value} />
              ))}
            </Box>

            <Box sx={{ height: "1px", bgcolor: CERT.hairlineSoft, my: 3 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={metaLabelSx}>
                  {t("certificates.credentialIdLabel", "Credential ID")}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: CERT.ink,
                    mt: 0.25,
                    wordBreak: "break-all",
                  }}
                >
                  {cred.credential_id}
                </Typography>
              </Box>

              <Stack
                direction="row"
                flexWrap="wrap"
                useFlexGap
                sx={{ gap: 1, width: { xs: "100%", sm: "auto" } }}
              >
                {/* Downloads stay available on a revoked credential on purpose:
                    the artwork stamps itself REVOKED, and the person who earned
                    it is entitled to their own record of what happened. */}
                <Button
                  variant="outlined"
                  disabled={exporting !== null}
                  startIcon={
                    exporting === "png" ? (
                      <CircularProgress size={16} sx={{ color: CERT.violet }} />
                    ) : (
                      <IconWrapper icon="mdi:image-outline" size={18} />
                    )
                  }
                  onClick={() => download("png")}
                  sx={secondaryButtonSx}
                >
                  {t("certificates.downloadPng", "Download PNG")}
                </Button>
                <Button
                  variant="outlined"
                  disabled={exporting !== null}
                  startIcon={
                    exporting === "pdf" ? (
                      <CircularProgress size={16} sx={{ color: CERT.violet }} />
                    ) : (
                      <IconWrapper icon="mdi:file-pdf-box" size={18} />
                    )
                  }
                  onClick={() => download("pdf")}
                  sx={secondaryButtonSx}
                >
                  {t("certificates.downloadPdf", "Download PDF")}
                </Button>
                <Button
                  onClick={copyLink}
                  variant="contained"
                  startIcon={<IconWrapper icon={copied ? "mdi:check" : "mdi:link-variant"} size={18} />}
                  sx={primaryButtonSx}
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
              px: { xs: 2, sm: 2.75, md: 4 },
              py: 2,
              bgcolor: "#f8fafc",
              borderTop: `1px solid ${CERT.hairlineSoft}`,
            }}
          >
            <Typography sx={{ fontSize: "0.78rem", color: CERT.inkFaint, lineHeight: 1.55 }}>
              <IconWrapper
                icon="mdi:shield-check-outline"
                size={15}
                color={CERT.violet}
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
        </Box>
      )}
    </Box>
  );
}

/** The signed-out canvas, shared with the auth screens (authTokens.ts:23). */
const CANVAS = "#fbfbfd";

/** The platform's card: hairline + two-stop shadow, radius 4. Both states use it. */
const cardSx = {
  borderRadius: 4,
  border: `1px solid ${CERT.hairline}`,
  bgcolor: CERT.surface,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)",
} as const;

/** Hero eyebrow tier, in the certificate violet. */
const eyebrowSx = {
  fontSize: "0.7rem",
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: CERT.violet,
  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
} as const;

const metaLabelSx = {
  fontSize: "0.6rem",
  fontWeight: 800,
  letterSpacing: 0.5,
  textTransform: "uppercase" as const,
  color: CERT.inkFaint,
  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
} as const;

const primaryButtonSx = {
  textTransform: "none" as const,
  fontWeight: 800,
  borderRadius: 999,
  px: 2.5,
  py: 1,
  color: "#fff",
  background: CERT_CTA_GRADIENT,
  boxShadow: CERT_CTA_SHADOW,
  width: { xs: "100%", sm: "auto" },
  "&:hover": { background: CERT_CTA_GRADIENT, filter: "brightness(1.06)", boxShadow: CERT_CTA_SHADOW },
} as const;

const secondaryButtonSx = {
  textTransform: "none" as const,
  fontWeight: 700,
  borderRadius: 999,
  px: 2,
  py: 0.9,
  color: CERT.violet,
  borderColor: CERT.violetBorder,
  width: { xs: "100%", sm: "auto" },
  "&:hover": { borderColor: "#c4b5fd", bgcolor: CERT.violetSoft },
  "&.Mui-disabled": { borderColor: CERT.hairlineSoft, color: CERT.inkDim },
} as const;

function Meta({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        border: `1px solid ${CERT.hairlineSoft}`,
        bgcolor: CERT.surface,
        minWidth: 0,
      }}
    >
      <Typography sx={metaLabelSx}>{label}</Typography>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.85rem",
          color: CERT.ink,
          mt: 0.35,
          lineHeight: 1.4,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
