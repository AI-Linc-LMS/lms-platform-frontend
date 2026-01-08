"use client";

import { Box, Paper, Typography, Button, Grid } from "@mui/material";
import { ContentDetail } from "@/lib/services/courses.service";
import { IconWrapper } from "@/components/common/IconWrapper";

interface QuizStartScreenProps {
  content: ContentDetail;
  onStartQuiz: () => void;
}

export function QuizStartScreen({
  content,
  onStartQuiz,
}: QuizStartScreenProps) {
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
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        mb: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1a1f2e",
            mb: 1.5,
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
          }}
        >
          {content.content_title || "Quiz"}
        </Typography>
        {content.details?.instructions && (
          <Typography
            variant="body1"
            sx={{
              color: "#6b7280",
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
              color: "#6b7280",
              lineHeight: 1.7,
              "& p": {
                mb: 1,
              },
            }}
          />
        )}
      </Box>

      {/* Quiz Details Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              backgroundColor: "#f9fafb",
              borderRadius: 2,
              p: 2,
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
              <IconWrapper icon="mdi:clock-outline" size={24} color="#6366f1" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1a1f2e",
                fontSize: "1.5rem",
                mb: 0.5,
              }}
            >
              {duration}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Minutes
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              backgroundColor: "#f9fafb",
              borderRadius: 2,
              p: 2,
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
              <IconWrapper icon="mdi:help-circle-outline" size={24} color="#6366f1" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1a1f2e",
                fontSize: "1.5rem",
                mb: 0.5,
              }}
            >
              {totalQuestions}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Questions
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              backgroundColor: "#f9fafb",
              borderRadius: 2,
              p: 2,
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
              <IconWrapper icon="mdi:star-outline" size={24} color="#6366f1" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1a1f2e",
                fontSize: "1.5rem",
                mb: 0.5,
              }}
            >
              {marks}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Total Marks
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box
            sx={{
              backgroundColor: "#f9fafb",
              borderRadius: 2,
              p: 2,
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: 1, display: "flex", justifyContent: "center" }}>
              <IconWrapper icon="mdi:file-document-outline" size={24} color="#6366f1" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#1a1f2e",
                fontSize: "1.125rem",
                mb: 0.5,
                textTransform: "capitalize",
              }}
            >
              {content.content_type || "Quiz"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Type
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Start Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={onStartQuiz}
        sx={{
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          color: "#ffffff",
          py: 1.5,
          fontSize: "1rem",
          fontWeight: 600,
          borderRadius: 2,
          textTransform: "none",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
            boxShadow: "0 6px 16px rgba(99, 102, 241, 0.4)",
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
        <IconWrapper icon="mdi:play-circle" size={20} color="#ffffff" />
        Start Quiz
      </Button>
    </Paper>
  );
}

