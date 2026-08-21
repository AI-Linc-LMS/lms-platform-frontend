"use client";

import { Box, Typography, Stack } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  MATERIAL_ICONS,
  formatFileSize,
  type LiveSessionMaterial,
} from "@/lib/services/live-session-materials.service";

/**
 * The read-only view of a session's study materials, used by learners on both the upcoming card and
 * the History row.
 *
 * Rendered as a timeline — oldest first, each row carrying who added it and when — because that is
 * what was asked for: a learner should be able to see what was shared and in what order, not just a
 * bag of files.
 *
 * Attribution comes from `uploaded_by_label`, which the backend fills with the instructor CODE for
 * learners. The component never reaches for `uploaded_by_name`; for a learner it is null anyway.
 */
export function StudyMaterialList({
  materials,
  emptyLabel,
  dense = false,
  onOpen,
}: {
  materials: LiveSessionMaterial[];
  emptyLabel?: string;
  dense?: boolean;
  /** Open the material in-app. Without it the row keeps its old open-in-a-new-tab behaviour. */
  onOpen?: (m: LiveSessionMaterial) => void;
}) {
  if (!materials.length) {
    return emptyLabel ? (
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.82rem" }}>
        {emptyLabel}
      </Typography>
    ) : null;
  }

  return (
    <Stack spacing={dense ? 0.75 : 1}>
      {materials.map((m) => (
        <Box
          key={m.id}
          component="a"
          href={m.file_url ?? undefined}
          rel="noopener noreferrer"
          // Stays an anchor on purpose: a plain click previews in-app, but cmd/ctrl/shift/middle
          // click must keep opening a new tab, which converting to a button would destroy.
          {...(onOpen
            ? {
                onClick: (e: React.MouseEvent) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  onOpen(m);
                },
              }
            : { target: "_blank" })}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            p: dense ? 1 : 1.25,
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            textDecoration: "none",
            color: "inherit",
            transition: "border-color .15s, background-color .15s",
            "&:hover": {
              borderColor: "var(--primary-400)",
              backgroundColor: "var(--surface)",
            },
            // A material whose file could not be signed is shown but not clickable, rather than
            // silently dropped — a learner should still see that it exists.
            ...(m.file_url ? {} : { pointerEvents: "none", opacity: 0.6 }),
          }}
        >
          <Box sx={{ mt: "1px", flexShrink: 0 }}>
            <IconWrapper icon={MATERIAL_ICONS[m.file_type] ?? MATERIAL_ICONS.other} size={20} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{ fontWeight: 600, fontSize: dense ? "0.82rem" : "0.88rem", lineHeight: 1.35 }}
            >
              {m.title}
            </Typography>
            {m.description && (
              <Typography
                sx={{ color: "var(--font-secondary)", fontSize: "0.78rem", mt: 0.25 }}
              >
                {m.description}
              </Typography>
            )}
            <Typography
              sx={{ color: "var(--font-secondary)", fontSize: "0.72rem", mt: 0.4 }}
            >
              {m.uploaded_by_label ? `Added by ${m.uploaded_by_label}` : "Added"}
              {" · "}
              {new Date(m.created_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
              {m.file_size ? ` · ${formatFileSize(m.file_size)}` : ""}
            </Typography>
          </Box>
          {/* The download glyph was decorative; it is now the deliberate way out of the platform,
              and must not also trigger the row's preview. */}
          {m.file_url && (
            <Box
              component="a"
              href={m.file_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{ flexShrink: 0, mt: "1px", display: "inline-flex", color: "inherit" }}
            >
              <IconWrapper icon="mdi:download-outline" size={18} />
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}
