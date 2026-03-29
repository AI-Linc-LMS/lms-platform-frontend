"use client";

import { Box, Typography, Paper, Grid, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MockInterviewPerformance } from "@/lib/types/scorecard.types";
import { SkillRadarChart } from "@/components/charts";

interface MockInterviewSectionProps {
  data: MockInterviewPerformance;
  /** When true (e.g. admin view), hide Watch Interview Playback button */
  readOnly?: boolean;
}

export function MockInterviewSection({ data, readOnly }: MockInterviewSectionProps) {
  // Backend returns newest first; use [0] for latest
  const latestInterview = data.interviews[0] ?? data.interviews[data.interviews.length - 1];

  const radarData = latestInterview
    ? latestInterview.parameters.map((param) => ({
        subject: param.name,
        score: param.score,
      }))
    : [];

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
        Mock Interview Performance
      </Typography>

      {data.interviews.length === 0 ? (
        <Box
          sx={{
            py: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <IconWrapper icon="mdi:microphone-question-outline" size={56} color="#9ca3af" />
          <Typography variant="body1" sx={{ mt: 2, color: "#374151", fontWeight: 500 }}>
            No mock interviews yet
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "#6b7280" }}>
            Complete mock interviews to see your performance here.
          </Typography>
        </Box>
      ) : (
        <>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="body2" sx={{ color: "#666666", mb: 0.5 }}>
              Total Interviews
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000" }}>
              {data.totalInterviews}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="body2" sx={{ color: "#666666", mb: 0.5 }}>
              Latest Score
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000" }}>
              {data.latestInterviewScore}%
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="body2" sx={{ color: "#666666", mb: 0.5 }}>
              Readiness Index
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#000000" }}>
              {data.interviewReadinessIndex}%
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography variant="body2" sx={{ color: "#666666", mb: 0.5 }}>
              Improvement
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color:
                  data.improvementSinceFirst > 0
                    ? "#10b981"
                    : data.improvementSinceFirst < 0
                      ? "#ef4444"
                      : "#666666",
              }}
            >
              {data.improvementSinceFirst > 0
                ? `+${data.improvementSinceFirst}%`
                : data.improvementSinceFirst < 0
                  ? `${data.improvementSinceFirst}%`
                  : `${data.improvementSinceFirst}%`}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Radar Chart */}
      {latestInterview && (
        <Box sx={{ mb: 4 }}>
          <SkillRadarChart
            data={radarData}
            dataKeys={[{ key: "score", label: "Latest Interview", color: "#0a66c2" }]}
            title="Parameter-wise Performance"
          />
        </Box>
      )}

      {/* Latest Interview Details */}
      {latestInterview && (
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
            Latest Interview Feedback
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: "#f0fdf4",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: "#000000",
                    mb: 1.5,
                  }}
                >
                  Strengths
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: "none" }}>
                  {latestInterview.feedback.strengths.length > 0 ? latestInterview.feedback.strengths.map((strength, index) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        color: "#666666",
                        fontSize: "0.875rem",
                        mb: 0.75,
                        position: "relative",
                        "&::before": {
                          content: '"✓"',
                          position: "absolute",
                          left: -20,
                          color: "#10b981",
                          fontWeight: "bold",
                        },
                      }}
                    >
                      {strength}
                    </Box>
                  )) : (
                    <Box
                      component="li"
                      sx={{
                        color: "#666666",
                        fontSize: "0.875rem",
                        fontStyle: "italic",
                      }}
                    >
                      No strengths recorded
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.5,
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
                    mb: 1.5,
                  }}
                >
                  Areas of Improvement
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, listStyle: "none" }}>
                  {latestInterview.feedback.areasOfImprovement.length > 0 ? latestInterview.feedback.areasOfImprovement.map((area, index) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        color: "#666666",
                        fontSize: "0.875rem",
                        mb: 0.75,
                        position: "relative",
                        "&::before": {
                          content: '"→"',
                          position: "absolute",
                          left: -20,
                          color: "#ef4444",
                          fontWeight: "bold",
                        },
                      }}
                    >
                      {area}
                    </Box>
                  )) : (
                    <Box
                      component="li"
                      sx={{
                        color: "#666666",
                        fontSize: "0.875rem",
                        fontStyle: "italic",
                      }}
                    >
                      No areas of improvement recorded
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
            {latestInterview.feedback.mentorComments && (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: "#000000",
                      mb: 1.5,
                    }}
                  >
                    Mentor Comments
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666666", whiteSpace: "pre-wrap" }}>
                    {latestInterview.feedback.mentorComments}
                  </Typography>
                </Box>
              </Grid>
            )}
            {latestInterview.playbackLink && !readOnly && (
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  startIcon={<IconWrapper icon="mdi:play-circle" size={18} />}
                  href={latestInterview.playbackLink}
                  target="_blank"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#0a66c2",
                    color: "#0a66c2",
                    borderRadius: "24px",
                    px: 2.5,
                    py: 1,
                    "&:hover": {
                      borderColor: "#004182",
                      backgroundColor: "rgba(10, 102, 194, 0.05)",
                    },
                  }}
                >
                  Watch Interview Playback
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
        </>
      )}
    </Paper>
  );
}
