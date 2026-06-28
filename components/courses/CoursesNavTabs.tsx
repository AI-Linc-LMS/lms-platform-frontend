"use client";

import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";

interface TabDef {
  key: "courses" | "adaptive";
  label: string;
  sub: string;
  icon: string;
  href: string;
}

/**
 * Prominent section switcher for the Courses area: "Courses" (legacy) and
 * "Adaptive courses" (the adaptive library page). Rendered as a clear segmented
 * control so the section is obvious — each tab is its own route. The Adaptive
 * tab only appears when the tenant has the adaptive feature.
 */
export function CoursesNavTabs({ active }: { active: "courses" | "adaptive" }) {
  const { push, prefetch } = useInstantNavigation();
  const adaptiveOn = useIsAdaptiveQuizEnabled();

  const tabs: TabDef[] = [
    {
      key: "courses",
      label: "Courses",
      sub: "Structured & self-paced",
      icon: "mdi:book-open-page-variant-outline",
      href: "/courses",
    },
  ];
  if (adaptiveOn) {
    tabs.push({
      key: "adaptive",
      label: "Adaptive courses",
      sub: "AI-personalised in real time",
      icon: "mdi:book-education-outline",
      href: "/adaptive-courses",
    });
  }

  // Nothing to switch between with a single section.
  if (tabs.length < 2) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        p: 0.75,
        mb: 3,
        borderRadius: 4,
        width: "fit-content",
        maxWidth: "100%",
        bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
      }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <ButtonBase
            key={t.key}
            onMouseEnter={() => !isActive && prefetch(t.href)}
            onClick={() => !isActive && push(t.href)}
            sx={{
              flex: { xs: 1, sm: "0 0 auto" },
              minWidth: 0,
              px: { xs: 2, sm: 2.75 },
              py: 1.1,
              borderRadius: 3,
              textAlign: "left",
              color: isActive ? "white" : "text.primary",
              background: isActive
                ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                : "transparent",
              boxShadow: isActive ? "0 14px 28px -14px rgba(124,58,237,0.6)" : "none",
              transition: "background 140ms ease, box-shadow 140ms ease",
              "&:hover": { background: isActive ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "color-mix(in srgb, #6366f1 8%, transparent)" },
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  color: isActive ? "white" : "#6366f1",
                  bgcolor: isActive ? "rgba(255,255,255,0.18)" : "color-mix(in srgb, #6366f1 12%, transparent)",
                }}
              >
                <Icon icon={t.icon} width={20} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", lineHeight: 1.15 }}>{t.label}</Typography>
                <Typography sx={{ fontSize: "0.72rem", lineHeight: 1.2, color: isActive ? "rgba(255,255,255,0.82)" : "text.secondary" }}>
                  {t.sub}
                </Typography>
              </Box>
            </Stack>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
