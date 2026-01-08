"use client";

import { Box, Typography, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface EmptyStateProps {
  type: "no-courses" | "no-results";
  onCreateClick?: () => void;
  onClearSearch?: () => void;
}

export function EmptyState({
  type,
  onCreateClick,
  onClearSearch,
}: EmptyStateProps) {
  if (type === "no-results") {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <IconWrapper
          icon="mdi:magnify"
          size={48}
          color="#9ca3af"
          style={{ marginBottom: 16 }}
        />
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
          No courses found
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
          Try adjusting your search terms or browse all courses.
        </Typography>
        {onClearSearch && (
          <Button
            variant="outlined"
            onClick={onClearSearch}
            sx={{ color: "#6366f1", borderColor: "#6366f1" }}
          >
            Clear search and view all courses
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <IconWrapper
        icon="mdi:book-open-variant"
        size={48}
        color="#9ca3af"
        style={{ marginBottom: 16 }}
      />
      <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
        No courses yet
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
        Get started by creating your first course.
      </Typography>
      {onCreateClick && (
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:plus" size={20} />}
          onClick={onCreateClick}
          sx={{ bgcolor: "#6366f1" }}
        >
          Create Your First Course
        </Button>
      )}
    </Box>
  );
}

