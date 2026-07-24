"use client";

/**
 * AssessmentEmptyState
 * --------------------
 * Shared empty-state primitive for the assessment-management admin redesign.
 *
 * A centered block inside a rounded, hairline-bordered card that reads well as
 * both a table-empty state (e.g. "No submissions yet") and a full-page-empty
 * state (e.g. "No assessments created"). Composed of a soft indigo-tinted icon
 * tile, a title, an optional muted description, and an optional caller-supplied
 * action node (typically a primary button).
 *
 * Theme-aware via CSS custom properties; no hard-coded colors.
 */

import * as React from "react";
import { Box, Typography } from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";

export interface AssessmentEmptyStateProps {
  /** MDI iconify name for the tile glyph. */
  icon?: string;
  /** Primary line - what is empty. */
  title: string;
  /** Optional supporting copy explaining the state or next step. */
  description?: string;
  /** Optional action node, e.g. a primary button the caller passes in. */
  action?: React.ReactNode;
}

export function AssessmentEmptyState({
  icon = "mdi:clipboard-text-outline",
  title,
  description,
  action,
}: AssessmentEmptyStateProps): React.ReactElement {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 1.5,
        px: 3,
        py: 5,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      {/* Soft indigo-tinted rounded icon tile */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: 2,
          border:
            "1px solid color-mix(in srgb, var(--accent-indigo) 24%, var(--surface) 76%)",
          backgroundColor:
            "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
        }}
      >
        <IconWrapper icon={icon} size={28} color="var(--accent-indigo)" />
      </Box>

      <Typography
        component="h3"
        sx={{
          m: 0,
          fontSize: "1rem",
          fontWeight: 600,
          lineHeight: 1.4,
          color: "var(--font-primary)",
        }}
      >
        {title}
      </Typography>

      {description ? (
        <Typography
          component="p"
          sx={{
            m: 0,
            maxWidth: 420,
            fontSize: "0.875rem",
            lineHeight: 1.5,
            color: "var(--font-secondary)",
          }}
        >
          {description}
        </Typography>
      ) : null}

      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}

export default AssessmentEmptyState;
