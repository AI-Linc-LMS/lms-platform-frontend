"use client";

import { Box, Typography, IconButton } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface SubmoduleContentHeaderProps {
  currentIndex: number;
  totalContents: number;
  submoduleName: string;
  contentTitle?: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onBack?: () => void;
}

export function SubmoduleContentHeader({
  currentIndex,
  totalContents,
  submoduleName,
  contentTitle,
  hasPrevious,
  hasNext,
  onNavigatePrevious,
  onNavigateNext,
  onBack,
}: SubmoduleContentHeaderProps) {
  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        backgroundColor: "#ffffff",
        minHeight: "72px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem", display: "block" }}
          >
            Content {currentIndex} of {totalContents}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1a1f2e",
              mt: 0.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contentTitle || submoduleName}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        <IconButton
          onClick={onNavigatePrevious}
          disabled={!hasPrevious}
          size="small"
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#f9fafb",
            },
            "&:disabled": {
              opacity: 0.3,
              cursor: "not-allowed",
            },
          }}
        >
          <IconWrapper icon="mdi:chevron-left" size={20} />
        </IconButton>
        <IconButton
          onClick={onNavigateNext}
          disabled={!hasNext}
          size="small"
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: "#f9fafb",
            },
            "&:disabled": {
              opacity: 0.3,
              cursor: "not-allowed",
            },
          }}
        >
          <IconWrapper icon="mdi:chevron-right" size={20} />
        </IconButton>
      </Box>
    </Box>
  );
}
