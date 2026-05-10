"use client";

import { Box, Typography, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { ParsedResource } from "@/lib/community/resource-parse";

interface ResourceCardProps {
  resource: ParsedResource;
  /** Compact variant for feed cards (less padding, smaller font). */
  compact?: boolean;
}

/** Branded link card rendered for posts encoded with a `[RESOURCE]` marker. */
export function ResourceCard({ resource, compact = false }: ResourceCardProps) {
  const padding = compact ? 1.5 : 2;
  return (
    <Box
      component="a"
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: padding,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--surface)",
        textDecoration: "none",
        transition: "border-color 0.15s, transform 0.15s",
        "&:hover": {
          borderColor: "var(--accent-indigo)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box
        sx={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          borderRadius: 2,
          backgroundColor: "var(--surface-indigo-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconWrapper
          icon="mdi:link-variant"
          size={compact ? 18 : 22}
          color="var(--accent-indigo)"
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
          <Chip
            size="small"
            label="Resource"
            sx={{
              height: 18,
              fontSize: "0.65rem",
              fontWeight: 700,
              backgroundColor: "var(--surface-indigo-light)",
              color: "var(--accent-indigo)",
              border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
            }}
          />
          {resource.host && (
            <Typography
              variant="caption"
              sx={{ color: "var(--font-tertiary)", fontWeight: 600 }}
              noWrap
            >
              {resource.host}
            </Typography>
          )}
        </Box>
        <Typography
          variant={compact ? "body2" : "subtitle2"}
          fontWeight={700}
          sx={{
            color: "var(--font-primary-dark)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {resource.url}
        </Typography>
      </Box>
      <IconWrapper
        icon="mdi:open-in-new"
        size={compact ? 14 : 16}
        color="var(--font-tertiary)"
      />
    </Box>
  );
}
