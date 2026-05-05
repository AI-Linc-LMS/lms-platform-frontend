"use client";

import { forwardRef } from "react";
import { Box, Typography } from "@mui/material";
import type { CertificateContent } from "@/lib/certificate/types";

const CERT_WIDTH = 1200;
const CERT_HEIGHT = 675;

function formatCertificateDate(d: Date, locale = "en-GB"): string {
  try {
    return d.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function makeFallbackSignature(name: string, certId: string): string {
  const base = (name || "Organization").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return base;
  const first = parts[0];
  const last = parts[parts.length - 1];
  const seed = (certId || "00").length % 3;
  const connector = seed === 0 ? " " : seed === 1 ? " ~ " : "  ";
  return `${first}${connector}${last}`;
}

export interface DynamicCertificateProps {
  content: CertificateContent;
}

/**
 * Classic landscape certificate (1200×675): light main panel + dark sidebar,
 * org block (logo, name, tagline, slug) from branding, body narrative + optional score/credential lines.
 * Logos use referrerPolicy (no crossOrigin) so external URLs such as GitHub raw typically render.
 */
export const DynamicCertificate = forwardRef<HTMLDivElement, DynamicCertificateProps>(
  function DynamicCertificate({ content }, ref) {
    if (content == null) {
      return (
        <Box
          ref={ref}
          className="certificate-export-root"
          data-certificate-root=""
          sx={{ width: CERT_WIDTH, height: CERT_HEIGHT, bgcolor: "#faf8ff" }}
        />
      );
    }

    const { branding, dateLabelPrefix = "DATE:" } = content;
    const accent = branding?.accentColor || "#5a46a0";
    const nameAccent = "#1587c9";
    const dateStr = formatCertificateDate(content?.issuedOn || new Date());
    const logoUrl = (branding?.logoUrl || "").trim();
    const nameLen = (content.recipientName || "").length;
    const hasBodyCopy =
      Boolean((content.bodyLead || "").trim()) ||
      Boolean(content.bodySegments?.some((s) => String(s.text || "").trim()));
    const signatoryName =
      (branding?.signatoryName || "").trim() ||
      (branding?.issuerDisplayName || "").trim() ||
      "Organization";
    const signatoryTitle =
      (branding?.signatoryTitle || "").trim() || "Authorized representative";
    const hasSignatureImage = Boolean((branding?.signatureImageUrl || "").trim());
    const fallbackSignatureText = makeFallbackSignature(signatoryName, content.certificateId);
    const isExcellence =
      content.variant === "assessment_appreciation" ||
      /excellence|achievement/i.test(content.headlineTitle || "");
    /** Aligns with server canvas sizing in `app/api/certificate/generate/route.ts`. */
    const recipientFontSize = nameLen > 30 ? 56 : nameLen > 20 ? 64 : 72;

    const dotPattern =
      "radial-gradient(circle at 1px 1px, rgba(90,70,160,0.07) 1px, transparent 0)";
    const lineMask =
      "linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px)";

    return (
      <Box
        ref={ref}
        className="certificate-export-root"
        data-certificate-root=""
        sx={{
          width: CERT_WIDTH,
          height: CERT_HEIGHT,
          minWidth: CERT_WIDTH,
          minHeight: CERT_HEIGHT,
          maxWidth: CERT_WIDTH,
          maxHeight: CERT_HEIGHT,
          borderRadius: "14px",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          boxShadow: "0 22px 52px rgba(16, 24, 40, 0.18)",
          fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
          bgcolor: "#faf8ff",
          color: "#1a1033",
          position: "relative",
        }}
      >
        {/* Main panel */}
        <Box
          sx={{
            position: "relative",
            px: 5.5,
            pt: 3,
            pb: content?.credentialLines?.length ? 16 : 3.5,
            backgroundColor: "#f7f4ff",
            backgroundImage: `${lineMask}, ${dotPattern}`,
            backgroundSize: "28px 28px, 22px 22px",
            backgroundPosition: "0 0, 0 0",
          }}
        >
          {isExcellence ? (
            <Box sx={{ position: "absolute", top: 10, left: 10, width: 96, height: 118, zIndex: 3 }}>
              <Box
                component="svg"
                viewBox="0 0 100 120"
                sx={{ width: "100%", height: "100%" }}
                fill="none"
              >
                <circle cx="50" cy="40" r="31" fill="#D4AF37" />
                <circle cx="50" cy="40" r="23" fill="#E9C96B" />
                <path d="M36 68L24 112L46 96L54 118L64 96L86 112L74 68H36Z" fill="#E6C86D" />
                <circle cx="50" cy="40" r="30.2" stroke="#B9911B" strokeWidth="1.6" />
              </Box>
            </Box>
          ) : null}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              mb: 1.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                letterSpacing: "0.08em",
                color: "rgba(26,16,51,0.55)",
                fontWeight: 600,
              }}
            >
              {dateLabelPrefix}{" "}
              <Box component="span" sx={{ color: "#1a1033", fontWeight: 700 }}>
                {dateStr}
              </Box>
            </Typography>
            <Box sx={{ textAlign: "right", maxWidth: 320, flexShrink: 0 }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    maxHeight: 56,
                    maxWidth: 220,
                    objectFit: "contain",
                    display: "block",
                    marginLeft: "auto",
                  }}
                />
              ) : null}
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1a1033",
                  letterSpacing: "0.04em",
                  mt: logoUrl ? 0.75 : 0,
                  lineHeight: 1.3,
                }}
              >
                {branding?.issuerDisplayName || "Organization"}
              </Typography>
              {branding?.issuerTagline ? (
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 500,
                    fontStyle: "italic",
                    color: "rgba(26,16,51,0.65)",
                    mt: 0.25,
                    lineHeight: 1.35,
                  }}
                >
                  {branding.issuerTagline}
                </Typography>
              ) : null}
              {branding?.issuerSubtitle ? (
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(26,16,51,0.5)",
                    letterSpacing: "0.06em",
                    mt: 0.25,
                  }}
                >
                  {branding.issuerSubtitle}
                </Typography>
              ) : null}
            </Box>
          </Box>

          <Typography
            sx={{
              textAlign: "center",
              fontSize: 50,
              fontWeight: 800,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: "#3e3aa5",
              lineHeight: 1.05,
              mb: 0.6,
            }}
          >
            {content.headlineTitle}
          </Typography>

          <Box
            sx={{
              width: "54%",
              mx: "auto",
              mb: 0.8,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Box
              component="svg"
              viewBox="0 0 220 24"
              sx={{ width: "100%", height: 20 }}
              fill="none"
            >
              <path d="M8 12H94" stroke="rgba(90,70,160,0.35)" strokeWidth="1.4" />
              <path d="M126 12H212" stroke="rgba(90,70,160,0.35)" strokeWidth="1.4" />
              <path d="M110 4C104 4 101 8 101 12C101 16 104 20 110 20C116 20 119 16 119 12C119 8 116 4 110 4Z" stroke="rgba(90,70,160,0.55)" strokeWidth="1.4" />
            </Box>
          </Box>

          <Typography
            sx={{
              textAlign: "center",
              fontSize: 19,
              color: "rgba(26,16,51,0.72)",
              mb: 0.2,
            }}
          >
            {content.preamble}
          </Typography>

          <Typography
            sx={{
              textAlign: "center",
              fontFamily: '"Alex Brush"',
              fontSize: recipientFontSize,
              fontWeight: 400,
              lineHeight: 1.15,
              color: nameAccent,
              mb: 0.8,
              px: 2,
              wordBreak: "break-word",
              textTransform: "none",
              letterSpacing: "0",
              textShadow: "0 1px 0 rgba(255,255,255,0.85)",
            }}
          >
            {content.recipientName}
          </Typography>

          <Box
            sx={{
              width: "58%",
              mx: "auto",
              borderBottom: "2px solid rgba(90,70,160,0.45)",
              mb: 1.35,
            }}
          />

          {hasBodyCopy ? (
            <Typography
              component="div"
              sx={{
                textAlign: "center",
                fontSize: 18,
                lineHeight: 1.55,
                color: "rgba(26,16,51,0.85)",
                maxWidth: 720,
                mx: "auto",
                mb: 1.1,
                px: 2,
              }}
            >
              {(content.bodyLead || "").trim() ? (
                <Box component="span" sx={{ fontWeight: 500 }}>
                  {content.bodyLead.trim()}
                  {content.bodySegments?.length ? "\u00A0" : null}
                </Box>
              ) : null}
              {content.bodySegments?.map((seg, i) => (
                <Box
                  component="span"
                  key={i}
                  sx={{
                    fontWeight: seg.bold ? 700 : 500,
                    color: seg.color ?? (seg.bold ? "#1a1033" : "inherit"),
                    ...(seg.fontSizePx != null ? { fontSize: seg.fontSizePx } : {}),
                  }}
                >
                  {seg.text}
                </Box>
              ))}
            </Typography>
          ) : null}

          <Box sx={{ flex: 1 }} />

          <Box
            sx={{
              position: "absolute",
              left: 42,
              right: 42,
              bottom: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              alignItems: "flex-end",
            }}
          >
            <Box sx={{ minWidth: 200, maxWidth: 360, p: 1, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.45)" }}>
              {hasSignatureImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.signatureImageUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    maxHeight: 56,
                    maxWidth: 220,
                    objectFit: "contain",
                    display: "block",
                    marginBottom: 4,
                  }}
                />
              ) : (
                <Box sx={{ mb: 1, width: 220 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Alex Brush", "Brush Script MT", "Segoe Script", cursive',
                      fontSize: 34,
                      lineHeight: 1,
                      color: "#1f7bd8",
                      textAlign: "left",
                      mb: 0.2,
                    }}
                  >
                    {fallbackSignatureText}
                  </Typography>
                  <Box sx={{ borderBottom: "2px solid rgba(26,16,51,0.35)" }} />
                </Box>
              )}
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: "#1a1033", textTransform: "title-case" }}>
                {signatoryName}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "rgba(26,16,51,0.65)" }}>
                {signatoryTitle}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 12, letterSpacing: "0.06em", color: "rgba(26,16,51,0.5)" }}>
                Certificate ID
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1a1033" }}>
                {content.certificateId}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Sidebar */}
        <Box
          sx={{
            background: `linear-gradient(165deg, #0f0518 0%, #1a0a2e 40%, #12081f 100%)`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: 4,
            pb: 3,
            px: 2,
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: `3px solid ${accent}`,
              boxShadow: `0 0 28px ${accent}99, inset 0 0 20px rgba(255,255,255,0.06)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              background: logoUrl
                ? "rgba(255,255,255,0.96)"
                : "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), transparent 55%)",
              p: logoUrl ? 1.5 : 0,
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                referrerPolicy="no-referrer"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <Box
                component="svg"
                viewBox="0 0 48 48"
                sx={{ width: 56, height: 56, opacity: 0.95 }}
                fill="none"
              >
                <path
                  d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
                  stroke={accent}
                  strokeWidth="2"
                  fill={`${accent}33`}
                />
                <path
                  d="M24 14c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z"
                  fill={accent}
                  opacity={0.9}
                />
              </Box>
            )}
          </Box>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 11,
              textAlign: "center",
              lineHeight: 1.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              px: 1,
              mb: "auto",
            }}
          >
            Learning
            <br />
            Excellence
            <br />
            Credential
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              mt: 2,
              flexDirection: logoUrl ? "column" : "row",
              textAlign: "center",
            }}
          >
            {!logoUrl ? (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  background: `linear-gradient(135deg, ${accent}, #312e81)`,
                  flexShrink: 0,
                }}
              />
            ) : null}
            <Box>
              <Typography
                sx={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  lineHeight: 1.25,
                }}
              >
                {(branding?.issuerDisplayName || "ORGANIZATION").toUpperCase()}
              </Typography>
              {branding?.issuerTagline ? (
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 9,
                    fontWeight: 500,
                    fontStyle: "italic",
                    mt: 0.35,
                    lineHeight: 1.35,
                    px: 0.5,
                  }}
                >
                  {branding.issuerTagline}
                </Typography>
              ) : null}
              {branding?.issuerSubtitle ? (
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.72)",
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    mt: 0.35,
                  }}
                >
                  {branding.issuerSubtitle}
                </Typography>
              ) : null}
            </Box>
          </Box>
        </Box>

        {/* Seal overlap */}
        <Box
          sx={{
            position: "absolute",
            right: 300 - 52,
            top: "50%",
            transform: "translateY(-50%)",
            width: 104,
            height: 104,
            borderRadius: "50%",
            border: `4px double ${accent}`,
            bgcolor: "#faf8ff",
            boxShadow: `0 0 22px ${accent}88`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Box
            component="svg"
            viewBox="0 0 40 40"
            sx={{ width: 44, height: 44 }}
            fill="none"
          >
            <path
              d="M20 3L36 11V29L20 37L4 29V11L20 3Z"
              stroke={accent}
              strokeWidth="1.5"
              fill={`${accent}22`}
            />
          </Box>
        </Box>
      </Box>
    );
  }
);

export const CERTIFICATE_PIXEL_WIDTH = CERT_WIDTH;
export const CERTIFICATE_PIXEL_HEIGHT = CERT_HEIGHT;
