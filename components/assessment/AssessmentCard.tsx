"use client";

import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import { Assessment } from "@/lib/services/assessment.service";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentCardProps {
  assessment: Assessment;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
}) => {
  const router = useRouter();
  const isAttempted = assessment.is_attempted || assessment.has_attempted;

  const handleClick = () => {
    if (isAttempted) {
      router.push(`/assessments/result/${assessment.slug}`);
    } else {
      router.push(`/assessments/${assessment.slug}`);
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        minHeight: 320,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: isAttempted ? "rgba(16, 185, 129, 0.2)" : "#e5e7eb",
        borderRadius: 3,
        overflow: "hidden",
        transition: "all 0.3s ease",
        position: "relative",
        cursor: "pointer",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-4px)",
          borderColor: isAttempted ? "rgba(16, 185, 129, 0.4)" : "#6366f1",
        },
      }}
      onClick={handleClick}
    >
      {/* Status Badge */}
      {isAttempted && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1,
          }}
        >
          <Chip
            icon={<IconWrapper icon="mdi:check-circle" size={14} />}
            label="Completed"
            size="small"
            sx={{
              backgroundColor: "#d1fae5",
              color: "#065f46",
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 22,
              "& .MuiChip-icon": {
                color: "#065f46",
              },
            }}
          />
        </Box>
      )}

      {/* Header Section */}
      <Box
        sx={{
          background: isAttempted
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)"
            : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          p: 2,
          pb: 2.5,
          position: "relative",
          minHeight: 90,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: isAttempted ? "#1f2937" : "#ffffff",
            fontWeight: 700,
            fontSize: "1rem",
            mb: 0.5,
            pr: isAttempted ? 10 : 0,
            minHeight: 40,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.3,
          }}
        >
          {assessment.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isAttempted ? "#6b7280" : "rgba(255, 255, 255, 0.9)",
            fontSize: "0.8125rem",
            minHeight: 18,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {assessment.instructions || "\u00A0"}
        </Typography>
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          p: 2,
          pt: 1.5,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Description - Always same height */}
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            mb: 2,
            minHeight: 38,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {assessment.description || "\u00A0"}
        </Typography>

        {/* Stats Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1.5,
            mb: 2,
            minHeight: 60,
          }}
        >
          {/* Duration */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              p: 1.25,
              backgroundColor: "#f3f4f6",
              borderRadius: 1.5,
            }}
          >
            <IconWrapper icon="mdi:clock-outline" size={18} color="#6366f1" />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                Duration
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  lineHeight: 1.2,
                }}
              >
                {assessment.duration_minutes} min
              </Typography>
            </Box>
          </Box>

          {/* Questions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              p: 1.25,
              backgroundColor: "#f3f4f6",
              borderRadius: 1.5,
            }}
          >
            <IconWrapper
              icon="mdi:help-circle-outline"
              size={18}
              color="#6366f1"
            />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                Questions
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#1f2937",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  lineHeight: 1.2,
                }}
              >
                {assessment.number_of_questions}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CTA Button */}
        <Box sx={{ mt: "1" }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={
              <IconWrapper
                icon={
                  isAttempted ? "mdi:eye-outline" : "mdi:play-circle-outline"
                }
                size={18}
              />
            }
            sx={{
              backgroundColor: isAttempted ? "#10b981" : "#6366f1",
              color: "#ffffff",
              fontWeight: 600,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "0.875rem",
              boxShadow: isAttempted
                ? "0 4px 14px 0 rgba(16, 185, 129, 0.39)"
                : "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
              "&:hover": {
                backgroundColor: isAttempted ? "#059669" : "#4f46e5",
                boxShadow: isAttempted
                  ? "0 6px 20px 0 rgba(16, 185, 129, 0.5)"
                  : "0 6px 20px 0 rgba(99, 102, 241, 0.5)",
                transform: "translateY(-2px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {isAttempted ? "View Results" : "Start Assessment"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
