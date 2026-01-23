"use client";

import { Box, Paper, Typography, LinearProgress, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { UserProfile } from "@/lib/services/profile.service";
import { calculateProfileCompletion, ProfileCompletionResult } from "@/lib/utils/profileCompletion";

interface ProfileCompletionCardProps {
  profile: UserProfile;
  onCompleteProfile?: () => void;
}

export function ProfileCompletionCard({
  profile,
  onCompleteProfile,
}: ProfileCompletionCardProps) {
  const completion = calculateProfileCompletion(profile);
  const { percentage, missingFields, completedFields, totalFields } = completion;

  const getCompletionColor = () => {
    return "#0a66c2"; // LinkedIn blue for all states
  };

  const getCompletionMessage = () => {
    if (percentage === 100) {
      return "Your profile is complete!";
    }
    if (percentage >= 80) {
      return "You're almost there! Complete your profile to stand out to recruiters.";
    }
    if (percentage >= 50) {
      return "Your profile is halfway complete. Add more details to showcase your skills.";
    }
    return "Complete your profile to unlock more opportunities and connect with professionals.";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.12)",
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
                color: "#000000",
                fontSize: "1.25rem",
              }}
            >
              Profile Strength
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
              color: "#666666",
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
                backgroundColor: "#e0e0e0",
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
                  color: "#000000",
                  fontSize: "1.5rem",
                  mb: 0.25,
                }}
              >
                {completion.completedFields}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.8125rem",
                }}
              >
                Completed
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1.5rem",
                  mb: 0.25,
                }}
              >
                {completion.totalFields}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.8125rem",
                }}
              >
                Total Fields
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1.5rem",
                  mb: 0.25,
                }}
              >
                {missingFields.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.8125rem",
                }}
              >
                Remaining
              </Typography>
            </Box>
          </Box>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#000000",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  display: "block",
                  mb: 1.5,
                }}
              >
                Add these to strengthen your profile:
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
                      backgroundColor: "#f3f2ef",
                      border: "1px solid rgba(0,0,0,0.08)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "#e9e7e3",
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#000000",
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
                      backgroundColor: "#f3f2ef",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#666666",
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
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
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
                backgroundColor: "#004182",
              },
              transition: "all 0.2s ease",
            }}
          >
            Complete your profile
          </Button>
        </Box>
      )}
    </Paper>
  );
}
