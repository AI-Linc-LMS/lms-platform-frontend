"use client";

import { Paper, Typography, Button } from "@mui/material";
import { ContentDetail } from "@/lib/services/courses.service";

interface AssignmentContentProps {
  content: ContentDetail;
  courseId: number;
  onStartAssignment: () => void;
}

export function AssignmentContent({
  content,
  courseId,
  onStartAssignment,
}: AssignmentContentProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        mb: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "#1a1f2e", mb: 2 }}
      >
        Assignment
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
        {content.details?.description ||
          "Complete this assignment to demonstrate your understanding."}
      </Typography>
      <Button
        variant="contained"
        sx={{
          backgroundColor: "#6366f1",
          "&:hover": {
            backgroundColor: "#4f46e5",
          },
        }}
        onClick={onStartAssignment}
      >
        Start Assignment
      </Button>
    </Paper>
  );
}

