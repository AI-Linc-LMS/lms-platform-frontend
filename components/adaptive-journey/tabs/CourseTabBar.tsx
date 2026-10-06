"use client";

/**
 * The course's sections, along the bottom of its hero.
 *
 * Each tab is addressable (`?tab=assessments`), so a learner can link someone straight to the
 * assessments of a course, and a reload keeps them where they were rather than dropping them
 * back on the journey.
 */

import { Box, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import type { CourseTab, CourseTabId } from "./courseTabs";

export function CourseTabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: CourseTab[];
  active: CourseTabId;
  onChange: (id: CourseTabId) => void;
}) {
  return (
    <Box
      role="tablist"
      aria-label="Course sections"
      sx={{
        display: "flex",
        gap: 0.5,
        px: { xs: 1.5, md: 2.5 },
        // Scrolls rather than wraps: six tabs do not fit a phone, and a wrapped tab bar
        // pushes the content below the fold on every load.
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        borderTop: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <ButtonBase
            key={t.id}
            role="tab"
            aria-selected={on}
            aria-controls={`course-panel-${t.id}`}
            id={`course-tab-${t.id}`}
            onClick={() => onChange(t.id)}
            sx={{
              flexShrink: 0,
              gap: 0.85,
              px: 1.75,
              py: 1.5,
              borderBottom: "2px solid",
              borderColor: on ? "#c084fc" : "transparent",
              color: on ? "#fff" : "rgba(255,255,255,0.62)",
              fontWeight: on ? 800 : 600,
              fontSize: "0.88rem",
              transition: "color .15s, border-color .15s",
              "&:hover": { color: "#fff" },
              "&:focus-visible": { outline: "2px solid #c084fc", outlineOffset: -2 },
              [PHONE]: { minHeight: 48, fontSize: "0.85rem", px: 1.25 },
            }}
          >
            <Icon icon={t.icon} width={17} />
            {t.label}
            {t.badge && (
              <Box
                component="span"
                sx={{
                  px: 0.75,
                  borderRadius: 5,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  color: "#052e16",
                  bgcolor: "#86efac",
                }}
              >
                {t.badge}
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
