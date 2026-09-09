"use client";

import { Box, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  MODULE_CTA_BG,
  MODULE_HERO_SHADOW,
  RESUME_HERO_BG,
} from "@/lib/theme/gradients";

/** Feature highlights, mirroring the resume builder's actual capabilities. */
const PILLS = [
  { icon: "mdi:view-grid-outline", label: "12 templates" },
  { icon: "mdi:speedometer", label: "Live ATS score" },
  { icon: "mdi:auto-fix", label: "AI tailoring" },
  { icon: "mdi:file-pdf-box", label: "One-click PDF" },
];

/**
 * Dashboard-style hero for the Resume Builder page. Matches the AI-briefing
 * hero so the standalone /resume route reads as part of the same product surface --
 * through the shared gradients now, rather than by re-typing its literals, which is how
 * this hero stayed violet on a tenant that had repainted every other one.
 */
export function ResumeHero() {
  return (
    <Box
      sx={{
        borderRadius: 5,
        p: { xs: 2.5, md: 4 },
        mb: 3,
        color: "white",
        position: "relative",
        overflow: "hidden",
        background: RESUME_HERO_BG,
        boxShadow: MODULE_HERO_SHADOW,
      }}
    >
      {/* faint dotted texture */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.4,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <Box sx={{ position: "relative" }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.75 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 3,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              color: "white",
              background: MODULE_CTA_BG,
              // Its own offsets, the CTA's colour. The stock alpha moves 0.85 -> 0.7 with the
              // shared variable; on a 24px blur under a 54px tile that is not a visible change,
              // and it is worth more than a fourth shadow key.
              boxShadow: "0 10px 24px -8px var(--module-cta-shadow, rgba(192,38,211,0.85))",
            }}
          >
            <IconWrapper icon="mdi:file-account-outline" size={27} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: 1.6,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              CAREER
            </Typography>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.55rem", md: "2.05rem" },
                lineHeight: 1.1,
              }}
            >
              Resume Builder
            </Typography>
          </Box>
        </Stack>

        <Typography
          sx={{
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.82)",
            maxWidth: 660,
            lineHeight: 1.55,
            mb: 2.25,
          }}
        >
          Craft a polished, ATS-friendly resume from your profile - pick a
          template, edit with a live preview, check your ATS score, and export to
          PDF in one click.
        </Typography>

        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
          {PILLS.map((p) => (
            <Stack
              key={p.label}
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <IconWrapper icon={p.icon} size={15} />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>
                {p.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
