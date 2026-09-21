"use client";

import { Box } from "@mui/material";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import { SegmentedTabs, type SegmentedTab } from "@/components/admin/assessment/shared";

/* ==========================================================================
 * The status filter on the learner's assessment list.
 *
 * `SegmentedTabs` is one inline-flex pill track with `overflowX: auto`. On a desktop it hugs its
 * content and that is exactly right. On an iPhone the five states - All / Available / Under review
 * / Completed / Expired, each carrying a count badge - measure 664px against a 390px screen, so the
 * track becomes a plain scroller with no scrollbar, no fade and no snap: the row simply stops at
 * the screen edge and a learner has no way to know "Completed" and "Expired" exist. Each pill is
 * also only ~34px tall, under the 44px a thumb needs, and its count badge sets 0.7rem type.
 *
 * SegmentedTabs is shared with nine admin pages, so it is left alone. Below `sm` this renders the
 * same tabs as a ScrollRow of 44px chips instead - momentum scroll, snap points and an edge fade,
 * which is what tells a thumb there is more to drag. From `sm` up it IS SegmentedTabs, unchanged.
 *
 * Both branches are in the DOM and chosen by CSS rather than by `useMediaQuery`, matching
 * ResponsiveRows: the page is server-rendered, and a media-query hook would paint the desktop
 * track first and swap it on hydration. `display: none` also removes the hidden branch from the
 * accessibility tree, so a screen reader is never offered the filter twice.
 * ======================================================================== */

export interface AssessmentStatusFilterProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the phone chip row for assistive tech. */
  ariaLabel: string;
}

export function AssessmentStatusFilter<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: AssessmentStatusFilterProps<T>) {
  return (
    <>
      {/* Phone: a scrolling chip row that looks scrollable. */}
      <Box data-testid="assessment-filter-chips" sx={{ display: { xs: "block", sm: "none" } }}>
        <ScrollRow ariaLabel={ariaLabel} gutter={2} gap={1}>
          {tabs.map((tab) => {
            const active = tab.value === value;
            return (
              <Box
                key={tab.value}
                component="button"
                type="button"
                aria-pressed={active}
                onClick={() => onChange(tab.value)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  // A filter a thumb can actually land on.
                  minHeight: 44,
                  px: 1.75,
                  borderRadius: 999,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  fontWeight: active ? 700 : 600,
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                  color: active ? "var(--font-light)" : "var(--font-secondary)",
                  bgcolor: active ? "var(--ai-violet)" : "var(--card-bg)",
                  border: active
                    ? "1px solid transparent"
                    : "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                  boxShadow: active
                    ? "0 6px 14px -8px color-mix(in srgb, var(--ai-violet) 70%, transparent)"
                    : "none",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" ? (
                  <Box
                    component="span"
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: 999,
                      // 12px is the floor for body text on a phone; the shared badge sets 0.7rem.
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      lineHeight: 1.4,
                      bgcolor: active
                        ? "color-mix(in srgb, var(--font-light) 26%, transparent)"
                        : "color-mix(in srgb, var(--ai-violet) 14%, var(--surface) 86%)",
                      color: active ? "var(--font-light)" : "var(--ai-violet)",
                    }}
                  >
                    {tab.count}
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </ScrollRow>
      </Box>

      {/* Tablet and up: the segmented track it always was. */}
      <Box data-testid="assessment-filter-tabs" sx={{ display: { xs: "none", sm: "block" } }}>
        <SegmentedTabs tabs={tabs} value={value} onChange={onChange} />
      </Box>
    </>
  );
}
