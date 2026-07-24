"use client";

import { ReactNode } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/** Accent tones - drive the icon badge, the ambient glow, and the solid CTA. */
const ACCENTS = {
  indigo: { a: "#6366f1", b: "#4338ca", glow: "rgba(99,102,241,0.45)" },
  purple: { a: "#a855f7", b: "#7c3aed", glow: "rgba(168,85,247,0.45)" },
  pink: { a: "#ec4899", b: "#db2777", glow: "rgba(236,72,153,0.45)" },
  emerald: { a: "#10b981", b: "#047857", glow: "rgba(16,185,129,0.42)" },
  amber: { a: "#f59e0b", b: "#d97706", glow: "rgba(245,158,11,0.42)" },
  cyan: { a: "#06b6d4", b: "#0891b2", glow: "rgba(6,182,212,0.42)" },
  rose: { a: "#f43f5e", b: "#e11d48", glow: "rgba(244,63,94,0.44)" },
} as const;

export type ModuleAccent = keyof typeof ACCENTS;

/**
 * The one page header used across every module (student + admin) so pages stay
 * consistent: a dark violet→indigo gradient hero with an uppercase eyebrow (the
 * module/section it belongs to), a big bold title, a detailed description, an
 * optional icon badge, and a right-hand action slot - "not just a header, but
 * something you can act from". Same dark-hero family as the dashboard/resume
 * heroes so the whole product reads as one surface.
 */
export function ModulePageHeader({
  eyebrow,
  title,
  description,
  accent = "indigo",
  icon,
  action,
}: {
  /** Uppercase category, e.g. "LEARN" or "ASSESSMENT MANAGEMENT". */
  eyebrow: string;
  title: string;
  /** A real description of what the module does - not a one-liner label. */
  description?: string;
  accent?: ModuleAccent;
  /** Optional Iconify icon → shows an icon badge. */
  icon?: string;
  /** Right-side action(s): use HeaderActionButton, a menu, or any node. */
  action?: ReactNode;
}) {
  const tone = ACCENTS[accent];
  return (
    <Box
      sx={{
        borderRadius: 4,
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
        color: "white",
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(120% 130% at 8% 115%, ${tone.glow} 0%, rgba(124,58,237,0.22) 32%, rgba(15,10,40,0) 62%), linear-gradient(150deg, #241653 0%, #181040 55%, #100a2c 100%)`,
        boxShadow: "0 24px 60px -30px rgba(76,29,149,0.7)",
      }}
    >
      {/* faint dotted texture */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ position: "relative" }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 3,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                color: "white",
                background: `linear-gradient(135deg, ${tone.a}, ${tone.b})`,
                boxShadow: `0 10px 24px -8px ${tone.glow}`,
              }}
            >
              <IconWrapper icon={icon} size={26} />
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.5rem", md: "2rem" },
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                mt: 0.25,
              }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                sx={{
                  fontSize: { xs: "0.85rem", sm: "0.92rem" },
                  color: "rgba(255,255,255,0.78)",
                  mt: 1,
                  maxWidth: 680,
                  lineHeight: 1.55,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Stack>
    </Box>
  );
}

/**
 * Pill CTA styled to read on the dark hero. `variant="solid"` = gradient
 * primary; `variant="ghost"` = translucent secondary.
 */
export function HeaderActionButton({
  icon,
  children,
  onClick,
  variant = "solid",
  disabled = false,
}: {
  icon?: string;
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  disabled?: boolean;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        px: 2.25,
        py: 1.1,
        borderRadius: 999,
        fontWeight: 800,
        fontSize: "0.9rem",
        gap: 0.75,
        color: "white",
        opacity: disabled ? 0.5 : 1,
        transition: "filter .15s, background .15s",
        ...(variant === "solid"
          ? {
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              boxShadow: "0 14px 30px -12px rgba(192,38,211,0.7)",
              "&:hover": { filter: "brightness(1.06)" },
            }
          : {
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }),
      }}
    >
      {icon && <IconWrapper icon={icon} size={17} />}
      {children}
    </ButtonBase>
  );
}
