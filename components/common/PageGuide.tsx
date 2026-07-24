"use client";

import { useState } from "react";
import { Box, Button, ButtonBase, Dialog, DialogContent, IconButton, Tooltip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useTour } from "@/components/community/TourProvider";
import type { PageGuideContent } from "@/lib/guide/registry";

/**
 * The one page-guide "?" used across every module header. Opens a modal that
 * explains what the page is for and what you can do on it (from the route's
 * registry entry), with an optional 60-second guided spotlight tour for pages
 * that have data-tour-id targets. Generalizes the old CommunityHelpButton so a
 * single component + one content registry powers the guide on every page.
 */
export function PageGuide({
  content,
  variant = "hero",
  label,
  tooltip = "Guide to this page",
}: {
  content: PageGuideContent;
  /** "hero" = translucent-white icon for the dark page header; "nav" = light pill for the top nav. */
  variant?: "hero" | "nav";
  /** Optional pill label (nav variant), hidden on xs. */
  label?: string;
  tooltip?: string;
}) {
  const [open, setOpen] = useState(false);
  const { startTour } = useTour();
  const hasTour = !!content.tourSteps && content.tourSteps.length > 0;

  // 0.1s of silent WAV, base64. Playing it from inside the click handler primes
  // the browser's autoplay gate so the tour's TTS narration then plays without a
  // per-step click.
  const SILENT_WAV =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  const handleStartTour = () => {
    if (!hasTour) return;
    try {
      const primer = new Audio(SILENT_WAV);
      primer.volume = 0;
      void primer.play().catch(() => {});
    } catch {
      // no-op
    }
    setOpen(false);
    // Brief delay so the modal exit animation runs before the spotlight measures.
    window.setTimeout(() => startTour(content.tourSteps!), 220);
  };

  return (
    <>
      <Tooltip title={tooltip}>
        {variant === "nav" ? (
          <ButtonBase
            onClick={() => setOpen(true)}
            aria-label={tooltip}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: label ? 2 : 1,
              py: 1,
              borderRadius: 2,
              backgroundColor: "var(--surface-indigo-light)",
              border: "1px solid",
              borderColor: "var(--primary-200)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "var(--primary-100)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <IconWrapper icon="mdi:compass-outline" size={16} color="var(--primary-700)" />
            {label && (
              <Typography
                variant="body2"
                sx={{
                  display: { xs: "none", sm: "block" },
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--primary-700)",
                }}
              >
                {label}
              </Typography>
            )}
          </ButtonBase>
        ) : (
          <IconButton
            onClick={() => setOpen(true)}
            size="small"
            aria-label={tooltip}
            sx={{
              width: 38,
              height: 38,
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.22)",
              backgroundColor: "rgba(255,255,255,0.12)",
              transition: "all 0.15s",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.22)",
                borderColor: "rgba(255,255,255,0.4)",
              },
            }}
          >
            <IconWrapper icon="mdi:help-circle-outline" size={20} />
          </IconButton>
        )}
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            border: "1px solid var(--border-default)",
            overflow: "hidden",
          },
        }}
      >
        {/* Accent header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #a78bfa, #ec4899)",
            color: "#fff",
            px: 3,
            py: 2.25,
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5, pr: 4 }}>
            <IconWrapper icon="mdi:compass-outline" size={26} color="#fff" />
            <Typography variant="h6" fontWeight={700}>
              {content.headerTitle}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.92 }}>
            {content.headerSubtitle}
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
            }}
          >
            <IconWrapper icon="mdi:close" size={18} color="#fff" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: content.tip ? 2.5 : 1 }}>
            {content.features.map((f) => (
              <Box
                key={f.title}
                sx={{
                  display: "flex",
                  gap: 1.25,
                  alignItems: "flex-start",
                  p: 1.25,
                  borderRadius: "10px",
                  border: "1px solid var(--border-default)",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    flexShrink: 0,
                    backgroundColor: `${f.color}15`,
                    border: `1px solid ${f.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon={f.icon} size={17} color={f.color} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {f.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {f.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {content.tip && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                p: 1.5,
                borderRadius: "10px",
                backgroundColor: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.3)",
                mb: 2,
              }}
            >
              <IconWrapper icon="mdi:lightbulb-on-outline" size={18} color="#a78bfa" />
              <Typography variant="caption" sx={{ color: "var(--font-primary)", flex: 1 }}>
                {content.tip}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={() => setOpen(false)} sx={{ textTransform: "none", color: "var(--font-secondary)" }}>
              {hasTour ? "Close" : "Got it"}
            </Button>
            {hasTour && (
              <Button
                variant="contained"
                onClick={handleStartTour}
                startIcon={<IconWrapper icon="mdi:play" size={14} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #a78bfa, #ec4899)",
                  boxShadow: "none",
                  "&:hover": { filter: "brightness(0.92)", boxShadow: "none" },
                }}
              >
                Start the tour
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
