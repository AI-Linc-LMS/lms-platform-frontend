"use client";

import { Box } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface SegmentedTab<T extends string = string> {
  value: T;
  label: string;
  icon?: string;
  /** Optional trailing count badge. */
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Fill available width (equal segments) vs. hug content. */
  fullWidth?: boolean;
}

/**
 * Adaptive pill/segmented tab control — a single rounded track with a filled active
 * segment, replacing the MUI underline Tabs. Keeps the caller's value/onChange contract
 * (so URL-driven tab state is unchanged); this is purely the presentation.
 */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  fullWidth = false,
}: SegmentedTabsProps<T>) {
  return (
    <Box
      role="tablist"
      sx={{
        display: "inline-flex",
        gap: 0.5,
        p: 0.5,
        borderRadius: 999,
        border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        bgcolor: "var(--card-bg)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        maxWidth: "100%",
        overflowX: "auto",
        ...(fullWidth ? { display: "flex", width: "100%" } : {}),
      }}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Box
            key={tab.value}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(tab.value);
              }
            }}
            sx={{
              flex: fullWidth ? 1 : "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              px: 2,
              py: 0.9,
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "0.85rem",
              fontWeight: active ? 700 : 500,
              color: active ? "var(--font-light)" : "var(--font-secondary)",
              bgcolor: active ? "var(--ai-violet)" : "transparent",
              boxShadow: active
                ? "0 6px 14px -8px color-mix(in srgb, var(--ai-violet) 70%, transparent)"
                : "none",
              transition: "background-color 0.15s ease, color 0.15s ease",
              "&:hover": active
                ? {}
                : {
                    bgcolor: "color-mix(in srgb, var(--ai-violet) 10%, var(--surface) 90%)",
                    color: "var(--ai-violet)",
                  },
            }}
          >
            {tab.icon ? <IconWrapper icon={tab.icon} size={17} /> : null}
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? (
              <Box
                component="span"
                sx={{
                  ml: 0.25,
                  px: 0.75,
                  py: 0.05,
                  borderRadius: 999,
                  fontSize: "0.7rem",
                  fontWeight: 700,
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
    </Box>
  );
}
