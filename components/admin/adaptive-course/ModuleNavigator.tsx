"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { AdminAdaptiveCourseModule } from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Index + pager for the course content tree.
 *
 * A finished course is 8-12 modules of 3-5 submodules, each carrying a quiz, an article, a coding
 * problem and a video. Rendered flat that is several thousand pixels of scroll to reach the last
 * module, and every one of those rows mounts whether you look at it or not — so the page is both
 * slow to reach the bottom of and slow to render at all.
 *
 * Two fixes, one component. The index makes any module one click away, and the pager means only a
 * slice is mounted at a time. Paging is skipped entirely below the threshold, because a pager over
 * four modules is worse than no pager.
 */

export const MODULES_PER_PAGE = 4;

export function ModuleNavigator({
  modules,
  page,
  onPageChange,
  onJumpToModule,
  activeModuleId,
}: {
  modules: AdminAdaptiveCourseModule[];
  page: number;
  onPageChange: (page: number) => void;
  onJumpToModule: (moduleId: number, page: number) => void;
  activeModuleId?: number | null;
}) {
  const pageCount = Math.max(1, Math.ceil(modules.length / MODULES_PER_PAGE));
  const paged = pageCount > 1;

  if (modules.length === 0) return null;

  return (
    <Box
      sx={{
        mb: 2.5,
        p: { xs: 1.75, md: 2 },
        borderRadius: 4,
        border: "1px solid #e4e7f0",
        bgcolor: "#fff",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
        // Sticky so the index stays reachable while reading a long module. Offset clears the
        // app header; without it the first chip row hides underneath it.
        position: { md: "sticky" },
        top: { md: 76 },
        zIndex: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25, flexWrap: "wrap" }}>
        <Icon icon="mdi:format-list-numbered" width={16} style={{ color: "#7c3aed" }} />
        <Typography
          sx={{
            fontSize: "0.62rem", fontWeight: 800, letterSpacing: 0.5,
            textTransform: "uppercase", color: "#64748b",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          Jump to module
        </Typography>
        <Box sx={{ flex: 1 }} />
        {paged && (
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700 }}>
            {modules.length} modules
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {modules.map((m, i) => {
          const targetPage = Math.floor(i / MODULES_PER_PAGE);
          const active = activeModuleId === m.id;
          return (
            <Box
              key={m.id}
              component="button"
              onClick={() => onJumpToModule(m.id, targetPage)}
              // Title carries the full name; the chip itself is truncated so one long module
              // title cannot push the rest of the index off the row.
              title={m.title}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.6,
                maxWidth: 240, px: 1.25, py: 0.6, borderRadius: 999,
                cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.75rem",
                border: active ? "1px solid transparent" : "1px solid #e4e7f0",
                bgcolor: active ? "#7c3aed" : "transparent",
                color: active ? "#fff" : "#475569",
                transition: "background .12s, color .12s",
                "&:hover": { bgcolor: active ? "#7c3aed" : "#f8fafc" },
                "&:focus-visible": { outline: "none", boxShadow: "0 0 0 2px #fff, 0 0 0 4px #7c3aed" },
              }}
            >
              <Box
                component="span"
                sx={{
                  flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
                  display: "grid", placeItems: "center", fontSize: "0.62rem", fontWeight: 800,
                  bgcolor: active ? "rgba(255,255,255,0.22)" : "#f1f5f9",
                  color: active ? "#fff" : "#64748b",
                }}
              >
                {i + 1}
              </Box>
              <Box
                component="span"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {m.title}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {paged && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #eef2f7" }}
        >
          <PagerButton
            icon="mdi:chevron-left"
            label="Previous"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          />
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
              Page {page + 1} of {pageCount}
            </Typography>
          </Box>
          <PagerButton
            icon="mdi:chevron-right"
            label="Next"
            disabled={page >= pageCount - 1}
            onClick={() => onPageChange(page + 1)}
            trailingIcon
          />
        </Stack>
      )}
    </Box>
  );
}

function PagerButton({
  icon, label, disabled, onClick, trailingIcon = false,
}: {
  icon: string; label: string; disabled: boolean; onClick: () => void; trailingIcon?: boolean;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        display: "inline-flex", alignItems: "center", gap: 0.5,
        px: 1.5, py: 0.7, borderRadius: 999, fontFamily: "inherit",
        fontWeight: 800, fontSize: "0.75rem",
        border: "1px solid #e4e7f0", bgcolor: "#fff",
        color: disabled ? "#cbd5e1" : "#475569",
        cursor: disabled ? "default" : "pointer",
        "&:hover": { bgcolor: disabled ? "#fff" : "#f8fafc" },
        "&:focus-visible": { outline: "none", boxShadow: "0 0 0 2px #fff, 0 0 0 4px #7c3aed" },
      }}
    >
      {!trailingIcon && <Icon icon={icon} width={15} />}
      {label}
      {trailingIcon && <Icon icon={icon} width={15} />}
    </Box>
  );
}
