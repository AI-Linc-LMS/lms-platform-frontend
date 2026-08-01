"use client";

import type { ReactNode } from "react";
import { Box, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CTA_GRADIENT,
  HERO_BG,
  HERO_RADIUS,
  HERO_SHADOW,
  ON_DARK,
  PROFILE,
  TILE_GRADIENT,
} from "@/components/profile/theme/profileTokens";
import {
  RANGE_OPTIONS,
  type AdaptiveCourseOption,
  type RangeKey,
} from "@/lib/services/admin/admin-insights.service";

/**
 * The admin dashboard's own surfaces, in the profile design language.
 *
 * These import `profileTokens` rather than restating the values. The tokens file already exists
 * because the profile redesign needed the dashboard's hero as an object rather than something
 * that merely looks similar; pointing a third surface at the same constants is the whole reason
 * it was extracted. A copied hex here is how two surfaces silently drift apart.
 *
 * The hero carries the controls, not just decoration. Period and course govern every number on
 * the page, so they belong with the headline figures they change — not in a toolbar the reader
 * has already scrolled past by the time a number looks wrong.
 */

export function DashboardHero({
  tenantName,
  summary,
  facts,
  range,
  onRangeChange,
  courses,
  courseId,
  onCourseChange,
  disabled,
  action,
  children,
}: {
  tenantName?: string;
  /** One plain sentence synthesising the numbers below. The reason to read the hero at all. */
  summary?: ReactNode;
  /** Small context chips: course count, cohort count, freshness. */
  facts?: Array<{ icon: string; label: string }>;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  courses: AdaptiveCourseOption[];
  courseId: number | null;
  onCourseChange: (id: number | null) => void;
  disabled?: boolean;
  /** Right-aligned control on the hero's filter row (the PDF export lives here). */
  action?: ReactNode;
  children?: ReactNode;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const active = courses.find((c) => c.id === courseId);

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: HERO_RADIUS,
        background: HERO_BG,
        boxShadow: HERO_SHADOW,
        color: "#fff",
        p: { xs: 2.5, md: 3.5 },
        mb: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            background: CTA_GRADIENT,
            boxShadow: "0 14px 30px -14px rgba(192,38,211,0.8)",
          }}
        >
          <IconWrapper icon="mdi:chart-box-outline" size={26} color="#fff" />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: "0.66rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: ON_DARK.textFaint,
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {tenantName ? `${tenantName} · Analytics` : "Analytics"}
          </Typography>
          <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" }, fontWeight: 800, mt: 0.25 }}>
            Dashboard
          </Typography>

          {/* The synthesis, not a restatement. An admin who reads only this line should still
              know whether anything needs them today. */}
          <Typography
            sx={{ color: ON_DARK.textSoft, fontSize: "0.92rem", mt: 0.5, maxWidth: "72ch" }}
          >
            {summary ?? "Everything below covers adaptive courses only."}
          </Typography>

          {facts && facts.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1.25 }}>
              {facts.map((f) => (
                <Box
                  key={f.label}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 999,
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: ON_DARK.textSoft,
                    background: ON_DARK.fill,
                    border: `1px solid ${ON_DARK.border}`,
                  }}
                >
                  <IconWrapper icon={f.icon} size={13} />
                  {f.label}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          flexWrap: "wrap",
          alignItems: "center",
          mt: 2,
        }}
      >
        {RANGE_OPTIONS.map((opt) => {
          const on = opt.key === range;
          return (
            <Box
              key={opt.key}
              component="button"
              type="button"
              disabled={disabled}
              aria-pressed={on}
              title={opt.label}
              onClick={() => onRangeChange(opt.key)}
              sx={{
                px: 1.6,
                py: 0.65,
                borderRadius: 999,
                cursor: disabled ? "default" : "pointer",
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "0.75rem",
                color: "#fff",
                border: on ? "1px solid transparent" : `1px solid ${ON_DARK.border}`,
                background: on ? CTA_GRADIENT : ON_DARK.fill,
                opacity: disabled ? 0.6 : 1,
                transition: "background .12s",
                "&:hover": { background: on ? CTA_GRADIENT : ON_DARK.fillStrong },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow: `0 0 0 2px ${PROFILE.night}, 0 0 0 4px ${PROFILE.violetLight}`,
                },
              }}
            >
              {opt.short}
            </Box>
          );
        })}

        <Box sx={{ flex: 1, minWidth: 8 }} />

        <Box
          component="button"
          type="button"
          disabled={disabled}
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            maxWidth: 320,
            px: 1.6,
            py: 0.7,
            borderRadius: 999,
            cursor: disabled ? "default" : "pointer",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: "0.78rem",
            color: "#fff",
            border: `1px solid ${ON_DARK.border}`,
            background: ON_DARK.fill,
            "&:hover": { background: ON_DARK.fillStrong },
          }}
        >
          <IconWrapper icon="mdi:school-outline" size={15} />
          <Box
            component="span"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {active ? active.title : "All adaptive courses"}
          </Box>
          <IconWrapper icon="mdi:chevron-down" size={15} />
        </Box>
        {action}
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          slotProps={{ paper: { sx: { maxHeight: 380, minWidth: 260 } } }}
        >
          <MenuItem
            selected={courseId === null}
            onClick={() => {
              onCourseChange(null);
              setAnchor(null);
            }}
          >
            All adaptive courses
          </MenuItem>
          {courses.map((c) => (
            <MenuItem
              key={c.id}
              selected={c.id === courseId}
              onClick={() => {
                onCourseChange(c.id);
                setAnchor(null);
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.title}
                </Box>
                {!c.is_published && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      px: 0.75,
                      py: 0.2,
                      borderRadius: 999,
                      bgcolor: "#f1f5f9",
                      color: "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    Draft
                  </Box>
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {children}
    </Box>
  );
}

/** A KPI tile on the dark hero. Translucent, so the hero stays one object rather than a tray. */
export function HeroKpi({
  label,
  value,
  suffix,
  denominator,
  definition,
  delta,
  footnote,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  denominator?: number;
  definition: string;
  delta?: { diff: number; pct: number | null };
  footnote?: string;
}) {
  const up = (delta?.diff ?? 0) > 0;
  const flat = (delta?.diff ?? 0) === 0;

  return (
    <Box
      sx={{
        background: ON_DARK.cardFill,
        border: `1px solid ${ON_DARK.border}`,
        borderRadius: 3,
        p: { xs: 1.5, md: 1.75 },
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: ON_DARK.textFaint,
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          {label}
        </Typography>
        <Tooltip title={definition} arrow enterTouchDelay={0} describeChild>
          <Box
            component="span"
            sx={{ display: "inline-flex", color: ON_DARK.textFaint, cursor: "help" }}
          >
            <IconWrapper icon="mdi:information-outline" size={13} />
          </Box>
        </Tooltip>
      </Box>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 0.25 }}>
        <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.1 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
        {suffix && (
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: ON_DARK.textSoft }}>
            {suffix}
          </Typography>
        )}
        {denominator !== undefined && (
          <Typography sx={{ fontSize: "0.82rem", color: ON_DARK.textFaint }}>
            / {denominator.toLocaleString()}
          </Typography>
        )}
      </Box>

      {delta ? (
        flat ? (
          <Typography sx={{ fontSize: "0.72rem", color: ON_DARK.textFaint }}>
            No change vs previous
          </Typography>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <IconWrapper
              icon={up ? "mdi:trending-up" : "mdi:trending-down"}
              size={14}
              color={up ? "#4ade80" : "#fca5a5"}
            />
            <Typography
              sx={{ fontSize: "0.72rem", fontWeight: 700, color: up ? "#4ade80" : "#fca5a5" }}
            >
              {up ? "+" : ""}
              {delta.diff.toLocaleString()}
              {/* pct is null when the previous period was zero. "+100%" from a base of nothing
                  is meaningless, so say nothing rather than invent a baseline. */}
              {delta.pct !== null ? ` (${delta.pct > 0 ? "+" : ""}${delta.pct}%)` : ""}
            </Typography>
          </Box>
        )
      ) : (
        footnote && (
          <Typography sx={{ fontSize: "0.72rem", color: ON_DARK.textFaint }}>{footnote}</Typography>
        )
      )}
    </Box>
  );
}

/** The uppercase rule that separates one question from the next down the deck. */
export function DeckSection({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box sx={{ mt: 3.5, mb: 1.5, display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: 4,
          height: 26,
          borderRadius: 999,
          flexShrink: 0,
          background: TILE_GRADIENT,
        }}
      />
      <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: "0.66rem",
          fontWeight: 800,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: PROFILE.inkFaint,
          '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
        }}
      >
        {title}
      </Typography>
      {hint && (
        <Typography sx={{ fontSize: "0.78rem", color: PROFILE.inkFaint, mt: 0.25 }}>
          {hint}
        </Typography>
      )}
      </Box>
    </Box>
  );
}
