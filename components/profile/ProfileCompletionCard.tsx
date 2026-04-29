"use client";

import { useTranslation } from "react-i18next";
import { Box, Paper, Typography, LinearProgress, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile } from "@/lib/services/profile.service";
import { calculateProfileCompletion } from "@/lib/utils/profileCompletion";

interface ProfileCompletionCardProps {
  profile: UserProfile;
  onCompleteProfile?: () => void;
}

export function ProfileCompletionCard({
  profile,
  onCompleteProfile,
}: ProfileCompletionCardProps) {
  const { t } = useTranslation("common");
  const completion = calculateProfileCompletion(profile);
  const { percentage, missingFields } = completion;

  const getCompletionColor = () => {
    return "var(--accent-indigo)"; // LinkedIn blue for all states
  };

  const getCompletionMessage = () => {
    if (percentage === 100) return t("profile.profileComplete");
    if (percentage >= 80) return t("profile.profileAlmostThere");
    if (percentage >= 50) return t("profile.profileHalfway");
    return t("profile.profileCompleteToUnlock");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 2px 4px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        backgroundColor: "var(--background)",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--font-primary) 10%, transparent), 0 4px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: "1.25rem",
              }}
            >
              {t("profile.profileStrength")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: getCompletionColor(),
                  fontSize: "1.5rem",
                }}
              >
                {percentage}%
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.9375rem",
              mb: 2,
              lineHeight: 1.5,
            }}
          >
            {getCompletionMessage()}
          </Typography>

          {/* Progress Bar */}
          <Box sx={{ mb: 2.5 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "var(--border-default)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  backgroundColor: getCompletionColor(),
                },
              }}
            />
          </Box>

          {/* Completion Stats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
              mb: missingFields.length > 0 ? 2.5 : 0,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "var(--font-primary)",
                  fontSize: "1.5rem",
                  mb: 0.25,
                }}
              >
                {completion.completedFields}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.8125rem",
                }}
              >
                {t("profile.completed")}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "var(--font-primary)",
                  fontSize: "1.5rem",
                  mb: 0.25,
                }}
              >
                {completion.totalFields}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.8125rem",
                }}
              >
                {t("profile.totalFields")}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "var(--font-primary)",
                  fontSize: "1.5rem",
                  mb: 0.25,
                }}
              >
                {missingFields.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.8125rem",
                }}
              >
                {t("profile.remaining")}
              </Typography>
            </Box>
          </Box>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "var(--font-primary)",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  display: "block",
                  mb: 1.5,
                }}
              >
                {t("profile.addTheseToStrengthen")}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {missingFields.slice(0, 6).map((field, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: "16px",
                      backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
                      border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "color-mix(in srgb, var(--surface) 72%, var(--background))",
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--font-primary)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                      }}
                    >
                      {field}
                    </Typography>
                  </Box>
                ))}
                {missingFields.length > 6 && (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: "16px",
                      backgroundColor: "color-mix(in srgb, var(--surface) 85%, var(--background))",
                      border: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--font-secondary)",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                      }}
                    >
                      +{missingFields.length - 6} more
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Action Button */}
      {percentage < 100 && onCompleteProfile && (
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid color-mix(in srgb, var(--font-primary) 10%, transparent)" }}>
          <Button
            variant="contained"
            size="medium"
            onClick={onCompleteProfile}
            startIcon={<IconWrapper icon="mdi:pencil" size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9375rem",
              backgroundColor: getCompletionColor(),
              borderRadius: "24px",
              px: 3,
              py: 1,
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("profile.completeProfile")}
          </Button>
        </Box>
      )}
    </Paper>
  );
}
