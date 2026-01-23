"use client";

import { Box, Typography, Paper, Grid, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { WeakAreas } from "@/lib/types/scorecard.types";
import { useRouter } from "next/navigation";

interface WeakAreasSectionProps {
  data: WeakAreas;
}

export function WeakAreasSection({ data }: WeakAreasSectionProps) {
  const router = useRouter();

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "revise":
        return "mdi:book-open-variant";
      case "mcq":
        return "mdi:clipboard-check";
      case "video":
        return "mdi:play-circle";
      case "interview":
        return "mdi:account-tie";
      default:
        return "mdi:lightbulb";
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case "revise":
        return "#0a66c2";
      case "mcq":
        return "#10b981";
      case "video":
        return "#f59e0b";
      case "interview":
        return "#6366f1";
      default:
        return "#9ca3af";
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#000000",
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          mb: 3,
        }}
      >
        Weak Areas & Attention Alerts
      </Typography>

      {/* Skills Below Threshold */}
      {data.skillsBelowThreshold.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#000000",
              fontSize: "1rem",
              mb: 2,
            }}
          >
            Skills Below Threshold (&lt;60%)
          </Typography>
          <Grid container spacing={2}>
            {data.skillsBelowThreshold.map((skill, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#fef2f2",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: "#000000",
                      mb: 0.5,
                    }}
                  >
                    {skill.skillName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666666", mb: 1 }}>
                    Current: {skill.currentScore}% (Threshold: {skill.threshold}%)
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.8125rem" }}>
                    {skill.recommendation}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Topics Frequently Incorrect */}
      {data.topicsFrequentlyIncorrect.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#000000",
              fontSize: "1rem",
              mb: 2,
            }}
          >
            Topics Frequently Incorrect
          </Typography>
          <Grid container spacing={2}>
            {data.topicsFrequentlyIncorrect.map((topic, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: "#000000",
                      mb: 0.5,
                    }}
                  >
                    {topic.topicName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666666" }}>
                    {topic.incorrectCount} incorrect out of {topic.totalAttempts} attempts
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#000000",
              fontSize: "1rem",
              mb: 2,
            }}
          >
            Recommended Actions
          </Typography>
          <Grid container spacing={2}>
            {data.recommendations.map((rec, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    border: `2px solid ${getRecommendationColor(rec.type)}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${getRecommendationColor(rec.type)}40`,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: `${getRecommendationColor(rec.type)}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconWrapper
                        icon={getRecommendationIcon(rec.type)}
                        size={20}
                        color={getRecommendationColor(rec.type)}
                      />
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: "#000000",
                        fontSize: "1rem",
                      }}
                    >
                      {rec.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666666",
                      fontSize: "0.875rem",
                      mb: 2,
                    }}
                  >
                    {rec.description}
                  </Typography>
                  {rec.actionUrl && (
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<IconWrapper icon="mdi:arrow-right" size={16} />}
                      onClick={() => router.push(rec.actionUrl!)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: getRecommendationColor(rec.type),
                        color: getRecommendationColor(rec.type),
                        borderRadius: "20px",
                        "&:hover": {
                          borderColor: getRecommendationColor(rec.type),
                          backgroundColor: `${getRecommendationColor(rec.type)}10`,
                        },
                      }}
                    >
                      Take Action
                    </Button>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
}
