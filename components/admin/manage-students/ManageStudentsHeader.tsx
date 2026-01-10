"use client";

import { Box, Typography, Chip } from "@mui/material";

interface ManageStudentsHeaderProps {
  totalCount: number;
}

export function ManageStudentsHeader({
  totalCount,
}: ManageStudentsHeaderProps) {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1, sm: 2 },
          mb: 1,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#111827",
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          Manage Students
        </Typography>
        {totalCount > 0 && (
          <Chip
            label={`${totalCount} Student${totalCount !== 1 ? "s" : ""}`}
            sx={{
              backgroundColor: "#eef2ff",
              color: "#6366f1",
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              height: { xs: 28, sm: 32 },
            }}
          />
        )}
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "#6b7280",
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
        }}
      >
        View and manage all students, their progress, and activity
      </Typography>
    </Box>
  );
}
