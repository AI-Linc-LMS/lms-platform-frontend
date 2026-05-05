"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentCard } from "./AssessmentCard";
import { Assessment } from "@/lib/services/assessment.service";
import { useTranslation } from "react-i18next";

interface AssessmentsGridProps {
  assessments: Assessment[];
  searchQuery: string;
}

export function AssessmentsGrid({
  assessments,
  searchQuery,
}: AssessmentsGridProps) {
  const { t } = useTranslation("common");

  if (assessments.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 5, sm: 8 },
          textAlign: "center",
          border: "1px dashed var(--border-default)",
          borderRadius: 3,
          backgroundColor: "var(--card-bg)",
        }}
      >
        <Box
          sx={{
            width: { xs: 72, sm: 80 },
            height: { xs: 72, sm: 80 },
            borderRadius: "50%",
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
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
            color="var(--accent-indigo)"
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: "var(--font-primary)",
            fontWeight: 600,
            mb: 1,
          }}
        >
          {t("assessments.noAssessmentsFound")}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-secondary)",
            maxWidth: 400,
            mx: "auto",
            lineHeight: 1.55,
          }}
        >
          {searchQuery
            ? t("assessments.adjustSearchFilter")
            : t("assessments.checkBackLater")}
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
        gap: { xs: 2.25, sm: 3.25 },
        width: "100%",
        overflow: "visible",
      }}
    >
      {assessments.map((assessment) => (
        <Box 
          key={assessment.id}
          sx={{
            width: "100%",
            minWidth: 0,
            overflow: "visible",
          }}
        >
          <AssessmentCard assessment={assessment} />
        </Box>
      ))}
    </Box>
  );
}


