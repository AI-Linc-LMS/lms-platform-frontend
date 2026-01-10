"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentCard } from "./AssessmentCard";
import { Assessment } from "@/lib/services/assessment.service";

interface AssessmentsGridProps {
  assessments: Assessment[];
  searchQuery: string;
}

export function AssessmentsGrid({
  assessments,
  searchQuery,
}: AssessmentsGridProps) {
  if (assessments.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 8,
          textAlign: "center",
          border: "1px dashed #e5e7eb",
          borderRadius: 3,
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <IconWrapper
            icon={
              searchQuery
                ? "mdi:file-search-outline"
                : "mdi:clipboard-text-outline"
            }
            size={40}
            color="#6366f1"
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: "#374151",
            fontWeight: 600,
            mb: 1,
          }}
        >
          {searchQuery ? "No assessments found" : "No assessments available"}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            maxWidth: 400,
            mx: "auto",
          }}
        >
          {searchQuery
            ? "Try adjusting your search or filter criteria"
            : "Check back later for new assessments"}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        },
        gap: 3,
      }}
    >
      {assessments.map((assessment) => (
        <Box key={assessment.id}>
          <AssessmentCard assessment={assessment} />
        </Box>
      ))}
    </Box>
  );
}


