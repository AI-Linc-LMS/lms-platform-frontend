"use client";

import { Box, Paper, Typography, Button, Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ContentDetail } from "@/lib/services/courses.service";
import { IconWrapper } from "@/components/common/IconWrapper";

interface QuizStartScreenProps {
  content: ContentDetail;
  onStartQuiz: () => void;
  /** When true, hide title (shown once in page header) */
  hideTitle?: boolean;
}

export function QuizStartScreen({
  content,
  onStartQuiz,
  hideTitle = false,
}: QuizStartScreenProps) {
  const { t } = useTranslation("common");
  const duration =
    content.duration_in_minutes ||
    content.details?.durating_in_minutes ||
    15;
  const totalQuestions =
    content.details?.mcqs?.length || content.details?.questions?.length || 0;
  const marks = content.marks || 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4 },
        backgroundColor: "var(--card-bg)",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        mb: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {!hideTitle && (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 1.5,
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
            }}
          >
            {content.content_title || "Quiz"}
          </Typography>
        )}
        {content.details?.instructions && (
          <Typography
            variant="body1"
            sx={{
              color: "var(--font-secondary)",
              lineHeight: 1.7,
              mb: 1,
            }}
          >
            {content.details.instructions}
          </Typography>
        )}
        {content.details?.description && (
          <Box
            dangerouslySetInnerHTML={{
              __html: content.details.description,
            }}
            sx={{
              color: "var(--font-secondary)",
              lineHeight: 1.7,
              "& p": {
                mb: 1,
              },
            }}
          />
        )}
      </Box>

      {/* Quiz Details Grid */}
      <Grid container spacing={2} sx={{ mb: 3, alignItems: "stretch" }}>
        {[
          {
            icon: "mdi:clock-outline",
            value: duration,
            label: t("courses.minutes"),
          },
          {
            icon: "mdi:help-circle-outline",
            value: totalQuestions,
            label: t("courses.questions"),
          },
          {
            icon: "mdi:star-outline",
            value: marks,
            label: t("courses.totalMarks"),
          },
          {
            icon: "mdi:file-document-outline",
            value: content.content_type || "Quiz",
            label: t("courses.typeLabel"),
            capitalize: true,
          },
        ].map((item, idx) => (
          <Grid key={idx} size={{ xs: 6, sm: 3 }}>
            <Box
              sx={{
                backgroundColor: "var(--surface)",
                borderRadius: 2,
                p: 2,
                border: "1px solid var(--border-default)",
                textAlign: "center",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
                <IconWrapper
                  icon={item.icon}
                  size={24}
                  color="var(--accent-indigo)"
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "var(--font-primary)",
                  fontSize: "1.5rem",
                  mb: 0.5,
                  ...(item.capitalize && { textTransform: "capitalize" }),
                }}
              >
                {item.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Start Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={onStartQuiz}
        sx={{
          background:
            "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
          color: "var(--font-light)",
          py: 1.5,
          fontSize: "1rem",
          fontWeight: 600,
          borderRadius: 2,
          textTransform: "none",
          boxShadow:
            "0 4px 12px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
          "&:hover": {
            background:
              "linear-gradient(135deg, var(--accent-indigo-dark) 0%, color-mix(in srgb, var(--accent-indigo-dark) 80%, black 20%) 100%)",
            boxShadow:
              "0 6px 16px color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          transition: "all 0.2s ease-in-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <IconWrapper icon="mdi:play-circle" size={20} color="var(--font-light)" />
        {t("courses.startQuiz")}
      </Button>
    </Paper>
  );
}

