"use client";

/**
 * The course's sections, along the bottom of its hero.
 *
 * Each tab is addressable (`?tab=assessments`), so a learner can link someone straight to the
 * assessments of a course, and a reload keeps them where they were rather than dropping them
 * back on the journey.
 */

import { Box, ButtonBase, Stack, Typography } from "@mui/material";
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

/** The strip of six status cards under the hero: one line per section, each a real reading. */
export function CourseSummaryStrip({
  items,
  onJump,
}: {
  items: { id: CourseTabId; step: number; label: string; value: string; icon: string }[];
  onJump: (id: CourseTabId) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0,1fr))",
          sm: "repeat(3, minmax(0,1fr))",
          lg: `repeat(${Math.min(items.length, 6)}, minmax(0,1fr))`,
        },
        mb: 2.5,
      }}
    >
      {items.map((it) => (
        <ButtonBase
          key={it.id}
          onClick={() => onJump(it.id)}
          sx={{
            display: "block",
            textAlign: "left",
            p: 1.5,
            borderRadius: 3,
            border: "1px solid #eef2f7",
            bgcolor: "#fff",
            transition: "border-color .15s, transform .15s",
            "&:hover": { borderColor: "#c7d2fe", transform: "translateY(-1px)" },
            "&:focus-visible": { outline: "2px solid #6366f1", outlineOffset: 2 },
            [PHONE]: { minHeight: 64 },
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 32, height: 32, borderRadius: 2, flexShrink: 0,
                display: "grid", placeItems: "center", color: "#6366f1", bgcolor: "#eef2ff",
                position: "relative",
              }}
            >
              <Icon icon={it.icon} width={17} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>
                {it.label}
              </Typography>
              <Typography sx={{ fontSize: "0.76rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {it.value}
              </Typography>
            </Box>
          </Stack>
        </ButtonBase>
      ))}
    </Box>
  );
}
