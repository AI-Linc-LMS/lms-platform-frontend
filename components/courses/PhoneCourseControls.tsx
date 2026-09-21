"use client";

import { Box, ButtonBase, IconButton, InputBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import type { ListView } from "@/components/common/list";

/* ==========================================================================
 * Search, sort and view for a course list, built for a thumb.
 *
 * The desktop toolbar (SearchFilterBar with a Sort select and a 34px view toggle in its right
 * slot) was simply squeezed onto a phone: a 40px search box, a select that opened a desktop menu,
 * and two icon buttons too small to hit reliably. Here each control is its own row:
 *
 *   1. a 48px search field with a clear button, next to a 46px card/list switch;
 *   2. the sort options as pills in a ScrollRow, one tap each instead of open-select-close.
 *
 * Rendered only below `sm`; wider screens keep the SearchFilterBar exactly as it was.
 * ======================================================================== */

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

const VIEWS: { mode: ListView; icon: string; label: string }[] = [
  { mode: "cards", icon: "mdi:view-agenda-outline", label: "Card view" },
  { mode: "list", icon: "mdi:view-list-outline", label: "List view" },
];

export function PhoneCourseControls<T extends string>({
  search,
  onSearchChange,
  placeholder,
  sort,
  sortOptions,
  onSortChange,
  view,
  onViewChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder: string;
  sort?: T;
  sortOptions?: SortOption<T>[];
  onSortChange?: (v: T) => void;
  view?: ListView;
  onViewChange?: (v: ListView) => void;
}) {
  const showSort = !!sortOptions && sortOptions.length > 0 && !!onSortChange;
  const showView = !!view && !!onViewChange;

  return (
    <Box data-testid="phone-course-controls" sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", "& > *": { minWidth: 0 } }}>
        <Box
          sx={{
            flex: 1,
            height: 48,
            display: "flex",
            alignItems: "center",
            gap: 1,
            pl: 1.5,
            pr: 0.5,
            borderRadius: 3,
            bgcolor: "var(--card-bg)",
            border: "1px solid var(--border-default)",
            "&:focus-within": { borderColor: "var(--accent-indigo, #6366f1)" },
          }}
        >
          <Icon icon="mdi:magnify" width={20} style={{ color: "var(--font-tertiary)", flexShrink: 0 }} />
          <InputBase
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            // 16px keeps iOS Safari from zooming the page when the field takes focus.
            inputProps={{ "aria-label": placeholder, type: "search", enterKeyHint: "search" }}
            sx={{
              flex: 1,
              minWidth: 0,
              // The input fills the 48px field, so a tap anywhere on it lands in the input.
              alignSelf: "stretch",
              "& input": { height: "100%", py: 0 },
              fontSize: "1rem",
              color: "var(--font-primary)",
              "& input::-webkit-search-cancel-button": { display: "none" },
            }}
          />
          {search && (
            <IconButton
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
              sx={{ width: 44, height: 44, flexShrink: 0, color: "var(--font-tertiary)" }}
            >
              <Icon icon="mdi:close-circle" width={18} />
            </IconButton>
          )}
        </Box>

        {showView && (
          <Box
            role="group"
            aria-label="Layout"
            sx={{
              display: "flex",
              flexShrink: 0,
              overflow: "hidden",
              borderRadius: 3,
              bgcolor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
            }}
          >
            {VIEWS.map((v) => {
              const active = view === v.mode;
              return (
                <ButtonBase
                  key={v.mode}
                  aria-label={v.label}
                  aria-pressed={active}
                  onClick={() => onViewChange!(v.mode)}
                  sx={{
                    width: 46,
                    height: 46,
                    color: active ? "#fff" : "var(--font-tertiary)",
                    bgcolor: active ? "var(--accent-indigo, #6366f1)" : "transparent",
                    transition: "background-color 140ms ease",
                  }}
                >
                  <Icon icon={v.icon} width={20} />
                </ButtonBase>
              );
            })}
          </Box>
        )}
      </Box>

      {showSort && (
        // scroll-padding: ScrollRow snaps each pill to "start", which without it is the scrollport
        // edge rather than the gutter, so the first pill was pulled flush against the screen edge.
        <ScrollRow ariaLabel="Sort courses" gap={0.75} sx={{ scrollPaddingInline: "16px" }}>
          {sortOptions!.map((o) => {
            const active = o.value === sort;
            return (
              <ButtonBase
                key={o.value}
                aria-pressed={active}
                onClick={() => onSortChange!(o.value)}
                sx={{
                  height: 44,
                  px: 1.75,
                  gap: 0.5,
                  borderRadius: 999,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: active ? "var(--accent-indigo-dark, #4338ca)" : "var(--font-secondary)",
                  bgcolor: active
                    ? "color-mix(in srgb, var(--accent-indigo, #6366f1) 14%, var(--card-bg, #fff))"
                    : "var(--card-bg)",
                  border: "1px solid",
                  borderColor: active ? "color-mix(in srgb, var(--accent-indigo, #6366f1) 45%, transparent)" : "var(--border-default)",
                }}
              >
                {active && <Icon icon="mdi:check" width={16} />}
                {o.label}
              </ButtonBase>
            );
          })}
        </ScrollRow>
      )}
    </Box>
  );
}
