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
import {
  isPsychometricAssessment,
  getPsychometricTags,
} from "@/lib/utils/psychometric-utils";

interface AssessmentCardProps {
  assessment: Assessment;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
}) => {
  const router = useRouter();
  const isAttempted = assessment.is_attempted || assessment.has_attempted;
  const isPsychometric = isPsychometricAssessment(assessment);
  const psychometricTags = isPsychometric ? getPsychometricTags(assessment) : [];

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
        minHeight: isPsychometric ? 360 : 320,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: isPsychometric
          ? isAttempted
            ? "rgba(124, 58, 237, 0.2)"
            : "rgba(124, 58, 237, 0.3)"
          : isAttempted
          ? "rgba(16, 185, 129, 0.2)"
          : "#e5e7eb",
        borderRadius: 3,
        overflow: "hidden",
        transition: "all 0.3s ease",
        position: "relative",
        cursor: "pointer",
        boxShadow: isPsychometric
          ? "0 4px 12px rgba(124, 58, 237, 0.15)"
          : "0 2px 8px rgba(0, 0, 0, 0.08)",
        "&:hover": {
          boxShadow: isPsychometric
            ? "0 12px 32px rgba(124, 58, 237, 0.25)"
            : "0 8px 24px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-4px)",
          borderColor: isPsychometric
            ? isAttempted
              ? "rgba(124, 58, 237, 0.4)"
              : "rgba(124, 58, 237, 0.5)"
            : isAttempted
            ? "rgba(16, 185, 129, 0.4)"
            : "#6366f1",
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
            zIndex: 2,
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

      {/* Proctored Badge */}
      {assessment.proctoring_enabled && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: isAttempted ? 100 : 10,
            zIndex: 2,
          }}
        >
          <Chip
            icon={<IconWrapper icon="mdi:shield-account" size={14} />}
            label="Proctored"
            size="small"
            sx={{
              backgroundColor: "#fef3c7",
              color: "#92400e",
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 22,
              "& .MuiChip-icon": {
                color: "#92400e",
              },
            }}
          />
        </Box>
      )}

      {/* Header Section */}
      <Box
        sx={{
          background: isPsychometric
            ? isAttempted
              ? "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)"
              : `url(/images/psychometric-test.png) center/cover no-repeat, linear-gradient(135deg, rgba(124, 58, 237, 0.85) 0%, rgba(99, 102, 241, 0.85) 100%)`
            : isAttempted
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)"
            : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          p: 2,
          pb: 2.5,
          position: "relative",
          minHeight: isPsychometric ? 120 : 90,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Overlay for psychometric image */}
        {isPsychometric && !isAttempted && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.75) 0%, rgba(99, 102, 241, 0.75) 100%)",
              zIndex: 0,
            }}
          />
        )}
        
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: isAttempted ? "#1f2937" : "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              mb: 0.5,
              pr: isAttempted || isPsychometric ? 10 : 0,
              pl: isPsychometric && !isAttempted ? 0 : 0,
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
          
          {/* Tags for psychometric assessments */}
          {isPsychometric && psychometricTags.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 1.5,
              }}
            >
              {psychometricTags.slice(0, 3).map((tag, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: isAttempted
                      ? `${tag.color}10`
                      : "rgba(255, 255, 255, 0.2)",
                    color: isAttempted ? tag.color : "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    border: isAttempted
                      ? `1.5px solid ${tag.color}30`
                      : "1.5px solid rgba(255, 255, 255, 0.4)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: isAttempted
                        ? `${tag.color}20`
                        : "rgba(255, 255, 255, 0.3)",
                      transform: "translateY(-1px)",
                      boxShadow: isAttempted
                        ? `0 2px 8px ${tag.color}25`
                        : "0 2px 8px rgba(255, 255, 255, 0.2)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: isAttempted ? tag.color : "#ffffff",
                      boxShadow: isAttempted
                        ? `0 0 4px ${tag.color}50`
                        : "0 0 4px rgba(255, 255, 255, 0.5)",
                    }}
                  />
                  <span>{tag.name}</span>
                </Box>
              ))}
            </Box>
          )}
        </Box>
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
              backgroundColor: isPsychometric
                ? isAttempted
                  ? "#7c3aed"
                  : "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)"
                : isAttempted
                ? "#10b981"
                : "#6366f1",
              color: "#ffffff",
              fontWeight: 600,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "0.875rem",
              boxShadow: isPsychometric
                ? isAttempted
                  ? "0 4px 14px 0 rgba(124, 58, 237, 0.39)"
                  : "0 4px 14px 0 rgba(124, 58, 237, 0.5)"
                : isAttempted
                ? "0 4px 14px 0 rgba(16, 185, 129, 0.39)"
                : "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
              "&:hover": {
                backgroundColor: isPsychometric
                  ? isAttempted
                    ? "#6d28d9"
                    : "#6d28d9"
                  : isAttempted
                  ? "#059669"
                  : "#4f46e5",
                boxShadow: isPsychometric
                  ? "0 6px 20px 0 rgba(124, 58, 237, 0.6)"
                  : isAttempted
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
