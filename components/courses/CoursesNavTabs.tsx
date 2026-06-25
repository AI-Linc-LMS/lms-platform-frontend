"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";

/**
 * Section switch shown at the top of the Courses area: "Courses" (legacy) and
 * "Adaptive courses" (the adaptive library page). Each tab is its own page/route
 * — adaptive courses are a section *within* Courses, not a separate sidebar item.
 * The Adaptive tab only appears when the tenant has the adaptive feature.
 */
export function CoursesNavTabs({ active }: { active: "courses" | "adaptive" }) {
  const router = useRouter();
  const adaptiveOn = useIsAdaptiveQuizEnabled();

  const tabs: { key: "courses" | "adaptive"; label: string; icon: string; href: string }[] = [
    { key: "courses", label: "Courses", icon: "mdi:book-open-page-variant-outline", href: "/courses" },
  ];
  if (adaptiveOn) {
    tabs.push({ key: "adaptive", label: "Adaptive courses", icon: "mdi:book-education-outline", href: "/adaptive-courses" });
  }

  // With only one tab there's nothing to switch between.
  if (tabs.length < 2) return null;

  return (
    <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <ButtonBase
            key={t.key}
            onClick={() => !isActive && router.push(t.href)}
            sx={{
              px: 2.25, py: 0.9, borderRadius: 999, fontWeight: 800, fontSize: "0.9rem", gap: 0.6,
              display: "inline-flex", alignItems: "center",
              color: isActive ? "white" : "text.primary",
              background: isActive
                ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
              border: isActive ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
            }}
          >
            <Icon icon={t.icon} width={17} />
            {t.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
