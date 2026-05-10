"use client";

import { Drawer, Box, Typography, Button, Divider } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export type FeedFilterValue = "all" | "queries" | "polls" | "humor" | "mine";

interface FilterOption {
  value: FeedFilterValue;
  label: string;
  icon: string;
}

const FILTERS: FilterOption[] = [
  { value: "all", label: "All posts", icon: "mdi:forum-outline" },
  { value: "queries", label: "Questions", icon: "mdi:help-circle-outline" },
  { value: "polls", label: "Polls", icon: "mdi:poll" },
  { value: "humor", label: "Humor & memes", icon: "mdi:emoticon-happy-outline" },
  { value: "mine", label: "My posts", icon: "mdi:account" },
];

const SORT_OPTIONS: { value: "recent" | "popular"; label: string; icon: string }[] = [
  { value: "recent", label: "Most recent", icon: "mdi:clock-outline" },
  { value: "popular", label: "Most popular", icon: "mdi:fire" },
];

interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filter: FeedFilterValue;
  onFilterChange: (next: FeedFilterValue) => void;
  sort: "recent" | "popular";
  onSortChange: (next: "recent" | "popular") => void;
}

/**
 * Bottom sheet for filter + sort, used on small viewports where horizontal-scroll
 * pills feel cramped. Renders only when open — no observers on close.
 */
export function MobileFilterSheet({
  open,
  onClose,
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: MobileFilterSheetProps) {
  const itemSx = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    width: "100%",
    px: 2,
    py: 1.5,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
    justifyContent: "flex-start",
    color: active ? "var(--accent-indigo)" : "var(--font-primary-dark)",
    backgroundColor: active ? "var(--surface-indigo-light)" : "transparent",
    "&:hover": {
      backgroundColor: active
        ? "color-mix(in srgb, var(--accent-indigo) 18%, var(--card-bg))"
        : "var(--surface)",
    },
  });

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            border: "1px solid var(--border-default)",
            borderBottom: "none",
            backgroundColor: "var(--card-bg)",
            maxHeight: "80vh",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: "var(--border-default)",
          }}
        />
      </Box>
      <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ color: "var(--font-primary-dark)", display: "flex", alignItems: "center", gap: 1 }}
        >
          <IconWrapper icon="mdi:filter-variant" size={18} color="var(--accent-indigo)" />
          Filter & sort
        </Typography>
      </Box>

      <Box sx={{ px: 2 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, letterSpacing: "0.08em", color: "var(--font-tertiary)" }}
        >
          Filter
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5, mb: 1.5 }}>
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              onClick={() => {
                onFilterChange(f.value);
                onClose();
              }}
              sx={itemSx(filter === f.value)}
              startIcon={
                <IconWrapper
                  icon={f.icon}
                  size={18}
                  color={filter === f.value ? "var(--accent-indigo)" : "var(--font-secondary)"}
                />
              }
            >
              {f.label}
            </Button>
          ))}
        </Box>
        <Divider sx={{ borderColor: "var(--border-default)" }} />
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, letterSpacing: "0.08em", color: "var(--font-tertiary)", mt: 1.5, display: "block" }}
        >
          Sort
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5, mb: 1.5 }}>
          {SORT_OPTIONS.map((s) => (
            <Button
              key={s.value}
              onClick={() => {
                onSortChange(s.value);
                onClose();
              }}
              sx={itemSx(sort === s.value)}
              startIcon={
                <IconWrapper
                  icon={s.icon}
                  size={18}
                  color={sort === s.value ? "var(--accent-indigo)" : "var(--font-secondary)"}
                />
              }
            >
              {s.label}
            </Button>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}
