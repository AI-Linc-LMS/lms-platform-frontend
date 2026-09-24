"use client";

import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PHONE } from "@/components/common/mobile/phone";
// The question-by-question list below this card already draws a skipped question in grey with
// the label "Not answered" (components/assessment/result/questionOutcome.ts). Reusing its badge
// keeps the summary and the detail it summarises speaking the same language by construction.
import { OUTCOME_STYLE } from "./questionOutcome";

interface TopicStats {
  /** Questions SERVED in this topic - answered and skipped alike. */
  total: number;
  correct: number;
  incorrect: number;
  /** correct + incorrect. Optional: older API responses predate the field. */
  attempted?: number;
  /** total - attempted. Optional: older API responses predate the field. */
  unattempted?: number;
  /** correct / attempted. Meaningless when nothing in the topic was attempted. */
  accuracy_percent: number;
  /** correct / served * 5 - the per-topic twin of the overall placement readiness. */
  rating_out_of_5: number;
}

interface TopicWiseBreakdownProps {
  topicWiseStats: Record<string, TopicStats>;
}

/**
 * Derive the attempted/unattempted split.
 *
 * The server sends both, but a result page can be open against an older backend during a rolling
 * deploy, so fall back to the arithmetic that always held: attempted = correct + incorrect.
 */
function splitCounts(stats: TopicStats) {
  const correct = Number(stats.correct) || 0;
  const incorrect = Number(stats.incorrect) || 0;
  const attempted =
    typeof stats.attempted === "number" ? stats.attempted : correct + incorrect;
  const total = Math.max(Number(stats.total) || 0, attempted);
  const unattempted =
    typeof stats.unattempted === "number"
      ? stats.unattempted
      : Math.max(total - attempted, 0);
  return { correct, incorrect, attempted, unattempted, total };
}

export function TopicWiseBreakdown({
  topicWiseStats,
}: TopicWiseBreakdownProps) {
  const { t } = useTranslation();

  if (!topicWiseStats || Object.keys(topicWiseStats).length === 0) {
    return null;
  }

  const topics = Object.entries(topicWiseStats);

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return { fullStars, hasHalfStar, emptyStars };
  };

  const getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 80) return "var(--course-cta)";
    if (accuracy >= 60) return "var(--accent-blue-light)";
    if (accuracy >= 40) return "var(--warning-500)";
    return "var(--error-500)";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid var(--border-default)",
        borderRadius: 3,
        background: "var(--card-bg)",
        [PHONE]: { p: 2 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 2,
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-box" size={24} color="var(--accent-indigo)" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 0.25,
            }}
          >
            {t("assessmentTopicBreakdown.title", "Topic-wise Performance")}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.8125rem",
            }}
          >
            {t(
              "assessmentTopicBreakdown.subtitle",
              "Detailed breakdown by topic",
            )}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {topics.map(([topic, stats]) => {
          const { correct, incorrect, attempted, unattempted, total } =
            splitCounts(stats);
          // Nothing was attempted, so there is no accuracy to colour by. Colouring the row red
          // would read as "you got it all wrong", which is exactly the confusion this card
          // used to cause by hiding skipped questions.
          const color = attempted
            ? getPerformanceColor(stats.accuracy_percent)
            : "var(--border-light)";
          const { fullStars, hasHalfStar, emptyStars } = getRatingStars(
            stats.rating_out_of_5
          );

          return (
            <Box
              key={topic}
              data-testid="topic-row"
              data-topic={topic}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "1px solid var(--border-default)",
                background: "linear-gradient(135deg, var(--card-bg) 0%, var(--surface) 100%)",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: color,
                },
                [PHONE]: { p: 1.75 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 200,
                    // A 360px phone cannot honour a 200px minimum beside the accuracy block
                    // without pushing the card sideways; below `sm` the two stack instead.
                    [PHONE]: { minWidth: 0, flexBasis: "100%" },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: "var(--font-primary)",
                      mb: 1,
                      fontSize: "1rem",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {topic}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      [PHONE]: { gap: 1.25 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <IconWrapper
                        icon="mdi:check-circle"
                        size={18}
                        color="var(--course-cta)"
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--course-cta)",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        {t("assessmentTopicBreakdown.correct", {
                          defaultValue: "{{n}} Correct",
                          n: correct,
                        })}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <IconWrapper
                        icon="mdi:close-circle"
                        size={18}
                        color="var(--error-500)"
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--error-500)",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        {t("assessmentTopicBreakdown.incorrect", {
                          defaultValue: "{{n}} Incorrect",
                          n: incorrect,
                        })}
                      </Typography>
                    </Box>
                    {unattempted > 0 && (
                      <Box
                        data-testid="topic-unattempted"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <IconWrapper
                          icon={OUTCOME_STYLE.unanswered.icon}
                          size={18}
                          color={OUTCOME_STYLE.unanswered.color}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: OUTCOME_STYLE.unanswered.color,
                            fontWeight: 600,
                            fontSize: "0.875rem",
                          }}
                        >
                          {t("assessmentTopicBreakdown.notAnswered", {
                            defaultValue: "{{n}} Not answered",
                            n: unattempted,
                          })}
                        </Typography>
                      </Box>
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {t("assessmentTopicBreakdown.questionsAsked", {
                        defaultValue: "{{n}} asked",
                        n: total,
                      })}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    textAlign: "right",
                    [PHONE]: { textAlign: "left" },
                  }}
                >
                  {attempted > 0 ? (
                    <>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: color,
                          mb: 0.5,
                          fontSize: "1.75rem",
                        }}
                      >
                        {stats.accuracy_percent.toFixed(1)}%
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "var(--font-secondary)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {t(
                          "assessmentTopicBreakdown.accuracyOfAttempted",
                          "Accuracy on {{attempted}} answered",
                          { attempted },
                        )}
                      </Typography>
                    </>
                  ) : (
                    <>
                      {/* A placeholder glyph, not information: the caption under it is what a
                          screen reader should announce. */}
                      <Typography
                        aria-hidden
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "var(--font-secondary)",
                          mb: 0.5,
                          fontSize: "1.75rem",
                        }}
                      >
                        &mdash;
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "var(--font-secondary)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {t(
                          "assessmentTopicBreakdown.nothingAttempted",
                          "Nothing answered here",
                        )}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* Progress Bar - the accuracy of what they answered */}
              <Box sx={{ mb: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={attempted > 0 ? Math.min(stats.accuracy_percent, 100) : 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "var(--surface)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 5,
                      backgroundColor: color,
                    },
                  }}
                />
              </Box>

              {/* Rating Stars - marks out of everything the topic asked */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flexWrap: "wrap",
                }}
              >
                {Array.from({ length: fullStars }).map((_, i) => (
                  <IconWrapper
                    key={`full-${i}`}
                    icon="mdi:star"
                    size={16}
                    color="var(--accent-yellow)"
                  />
                ))}
                {hasHalfStar && (
                  <IconWrapper
                    icon="mdi:star-half-full"
                    size={16}
                    color="var(--accent-yellow)"
                  />
                )}
                {Array.from({ length: emptyStars }).map((_, i) => (
                  <IconWrapper
                    key={`empty-${i}`}
                    icon="mdi:star-outline"
                    size={16}
                    color="var(--border-light)"
                  />
                ))}
                <Typography
                  variant="caption"
                  sx={{
                    ml: 1,
                    color: "var(--font-secondary)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    [PHONE]: { ml: 0.5 },
                  }}
                >
                  {t(
                    "assessmentTopicBreakdown.topicScore",
                    "{{rating}}/5.0 across all {{total}} questions",
                    { rating: stats.rating_out_of_5.toFixed(1), total },
                  )}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
