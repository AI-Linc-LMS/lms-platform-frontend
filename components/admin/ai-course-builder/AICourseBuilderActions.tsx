"use client";

import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AICourseBuilderActionsProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  /** When true, only render the two action buttons (for top row). When false, only render search (for filter row). */
  buttonsOnly?: boolean;
}

export function AICourseBuilderActions({
  searchQuery = "",
  onSearchChange,
  buttonsOnly = false,
}: AICourseBuilderActionsProps) {
  const router = useRouter();

  if (buttonsOnly) {
    return (
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:text-box" size={20} />}
          onClick={() =>
            router.push("/admin/ai-course-builder/generate/description")
          }
          sx={{
            bgcolor: "#6366f1",
            "&:hover": { bgcolor: "#4f46e5" },
            whiteSpace: "nowrap",
          }}
        >
          Generate from description
        </Button>
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:format-list-bulleted" size={20} />}
          onClick={() =>
            router.push("/admin/ai-course-builder/generate/structured-plan")
          }
          sx={{
            bgcolor: "#10b981",
            "&:hover": { bgcolor: "#059669" },
            whiteSpace: "nowrap",
          }}
        >
          Generate from structured plan
        </Button>
      </Box>
    );
  }

  return (
    <TextField
      placeholder="Search jobs..."
      value={searchQuery}
      onChange={(e) => onSearchChange?.(e.target.value)}
      size="small"
      sx={{ flex: 1, minWidth: { xs: "100%", sm: 260 } }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <IconWrapper icon="mdi:magnify" size={20} color="#9ca3af" />
          </InputAdornment>
        ),
        endAdornment: searchQuery && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onSearchChange?.("")}
              sx={{ color: "#9ca3af" }}
            >
              <IconWrapper icon="mdi:close" size={18} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
