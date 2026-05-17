"use client";

import { memo } from "react";
import { Box, Typography, Divider, Chip } from "@mui/material";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { IconWrapper } from "@/components/common/IconWrapper";

interface EmailTemplatePreviewProps {
  /** Subject line shown as the headline inside the email card. */
  subject?: string;
  /** Headline override (defaults to `subject`). */
  headline?: string;
  /** Editable body slot. Place the editor (or rendered content) here. */
  children: React.ReactNode;
  /** Sign-off line shown above the company line in the footer. */
  signOff?: string;
  /** Small line shown beneath the editor / above the footer. */
  footerNote?: React.ReactNode;
  /** Width of the email card. Defaults to 600px to match transactional templates. */
  maxWidth?: number | string;
  /** Override the outer wrapper background. */
  background?: string;
  /** Top accent strip colour. Defaults to the indigo accent token. */
  accentColor?: string;
  /** Show a small "Preview" chip in the top-right corner of the card. */
  showPreviewChip?: boolean;
  /**
   * URL of an attachment that will be sent with this email. If provided, a
   * clickable attachment chip is rendered below the body — exactly like
   * recipients see in transactional emails. The URL opens in a new tab.
   */
  attachmentUrl?: string | null;
  /**
   * Display name for the attachment. Falls back to the last path segment of
   * `attachmentUrl` when omitted. Passing just a name with no URL renders a
   * non-clickable chip — useful when the file isn't uploaded yet.
   */
  attachmentName?: string | null;
}

const deriveAttachmentName = (url: string | null | undefined): string => {
  if (!url) return "attachment";
  try {
    const path = url.split("?")[0].split("#")[0];
    const last = path.split("/").pop() || "";
    return last ? decodeURIComponent(last) : "attachment";
  } catch {
    return "attachment";
  }
};

const SANS_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Helvetica Neue", Arial, sans-serif';

/**
 * Postmark-style transactional email frame used to wrap an editable body so
 * authors see a realistic representation of what recipients will receive.
 *
 * Layout: thin accent strip → branded header (logo or client name) →
 * subject as H1 → body slot (e.g. editor) → footer with sign-off,
 * client name, and small note.
 */
function EmailTemplatePreviewInner({
  subject,
  headline,
  children,
  signOff = "Best regards,",
  footerNote,
  maxWidth = 600,
  background,
  accentColor = "var(--accent-indigo)",
  showPreviewChip = true,
  attachmentUrl,
  attachmentName,
}: EmailTemplatePreviewProps) {
  const hasAttachment = Boolean(attachmentUrl || attachmentName);
  const resolvedAttachmentName =
    attachmentName?.trim() || (attachmentUrl ? deriveAttachmentName(attachmentUrl) : null);
  const { clientInfo } = useClientInfo();
  const clientName = clientInfo?.name?.trim() || "Your team";
  const logoUrl = clientInfo?.app_logo_url || null;
  const heading = (headline ?? subject ?? "").trim();

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: background ?? "#f3f4f6",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "var(--border-default)",
        py: { xs: 2.5, sm: 4 },
        px: { xs: 1.5, sm: 3 },
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth,
          bgcolor: "#ffffff",
          borderRadius: 2,
          boxShadow: "0 10px 24px -12px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
          color: "#1f2937",
          fontFamily: SANS_STACK,
        }}
      >
        {/* Accent strip */}
        <Box
          sx={{
            height: 4,
            width: "100%",
            bgcolor: accentColor,
          }}
        />

        {showPreviewChip && (
          <Chip
            label="Live preview"
            size="small"
            icon={<IconWrapper icon="mdi:eye-outline" size={14} />}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              height: 22,
              fontSize: "0.68rem",
              fontWeight: 600,
              bgcolor:
                "color-mix(in srgb, var(--accent-indigo) 12%, #ffffff 88%)",
              color: "var(--accent-indigo)",
              border: "1px solid",
              borderColor:
                "color-mix(in srgb, var(--accent-indigo) 24%, transparent)",
              "& .MuiChip-icon": { color: "var(--accent-indigo)", ml: 0.5 },
              "& .MuiChip-label": { px: 0.85 },
            }}
          />
        )}

        {/* Header */}
        <Box
          sx={{
            px: { xs: 3, sm: 5 },
            pt: { xs: 3.5, sm: 5 },
            pb: { xs: 2.5, sm: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          {logoUrl ? (
            // Plain <img> on purpose; this mimics email HTML which can't use next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={clientName}
              style={{
                maxHeight: 52,
                maxWidth: 220,
                objectFit: "contain",
              }}
            />
          ) : (
            <Typography
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "#0f172a",
                letterSpacing: "0.01em",
              }}
            >
              {clientName}
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: "#eef0f3", mx: { xs: 3, sm: 5 } }} />

        {/* Body */}
        <Box
          sx={{
            px: { xs: 3, sm: 5 },
            pt: { xs: 3, sm: 4 },
            pb: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {heading ? (
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.35rem", sm: "1.5rem" },
                fontWeight: 700,
                color: "#0f172a",
                m: 0,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              {heading}
            </Typography>
          ) : (
            <Typography
              component="div"
              sx={{
                fontSize: "0.85rem",
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              Add a subject above to see it appear as the email headline.
            </Typography>
          )}
          <Box
            sx={{
              fontSize: "0.95rem",
              lineHeight: 1.65,
              color: "#1f2937",
              "& p": { my: 1 },
              "& a": { color: accentColor },
            }}
          >
            {children}
          </Box>

          {hasAttachment ? (
            <Box>
              <Typography
                component="div"
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  mb: 0.75,
                }}
              >
                Attachment
              </Typography>
              <Box
                component={attachmentUrl ? "a" : "div"}
                {...(attachmentUrl
                  ? {
                      href: attachmentUrl,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {})}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  color: "#0f172a",
                  textDecoration: "none",
                  maxWidth: "100%",
                  cursor: attachmentUrl ? "pointer" : "default",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  ...(attachmentUrl
                    ? {
                        "&:hover": {
                          borderColor: accentColor,
                          bgcolor: "#f1f5f9",
                        },
                      }
                    : {}),
                }}
              >
                <IconWrapper icon="mdi:paperclip" size={18} color="#6b7280" />
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 320,
                  }}
                >
                  {resolvedAttachmentName}
                </Typography>
                {attachmentUrl ? (
                  <IconWrapper
                    icon="mdi:open-in-new"
                    size={14}
                    color="#9ca3af"
                  />
                ) : null}
              </Box>
            </Box>
          ) : null}
        </Box>

        {/* Footer note (above sign-off) */}
        {footerNote ? (
          <Box
            sx={{
              px: { xs: 3, sm: 5 },
              pb: 2,
              fontSize: "0.75rem",
              color: "#6b7280",
              lineHeight: 1.55,
            }}
          >
            {footerNote}
          </Box>
        ) : null}

        {/* Footer */}
        <Divider sx={{ borderColor: "#eef0f3" }} />
        <Box
          sx={{
            px: { xs: 3, sm: 5 },
            py: { xs: 3, sm: 3.5 },
            bgcolor: "#f8fafc",
            textAlign: "center",
          }}
        >
          <Typography
            component="div"
            sx={{ fontSize: "0.85rem", color: "#4b5563", mb: 0.5 }}
          >
            {signOff}
          </Typography>
          <Typography
            component="div"
            sx={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "0.005em",
            }}
          >
            {clientName}
          </Typography>
          <Typography
            component="div"
            sx={{
              mt: 1.5,
              fontSize: "0.7rem",
              color: "#9ca3af",
              lineHeight: 1.55,
            }}
          >
            You received this email because you are enrolled with {clientName}.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Memoised so callers can pass stable subject + children and avoid the
// non-trivial sx tree rebuild on every parent re-render.
export const EmailTemplatePreview = memo(EmailTemplatePreviewInner);

export default EmailTemplatePreview;
