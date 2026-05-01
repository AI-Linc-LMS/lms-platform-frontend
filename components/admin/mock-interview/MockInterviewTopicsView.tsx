"use client";

import { Box, Typography, Paper, Chip, Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { AdminTopicItem, TopicsResponse } from "@/lib/services/admin/admin-mock-interview.service";

interface MockInterviewTopicsViewProps {
  data: TopicsResponse | null;
  loading: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export function MockInterviewTopicsView({
  data,
  loading,
}: MockInterviewTopicsViewProps) {
  const { t } = useTranslation("common");
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton variant="rounded" width={140} height={40} sx={{ borderRadius: 2 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={220} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!data || !data.topics || data.topics.length === 0) {
    return (
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 2,
          border: "1px dashed var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:book-open-variant" size={36} color="var(--accent-indigo)" />
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 500, color: "var(--font-primary)", mb: 0.5 }}>
          {t("adminMockInterview.noTopicAnalytics")}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          {t("adminMockInterview.topicDataWillAppear")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
        {t("adminMockInterview.topicsCount", { count: data.total_topics })}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        {data.topics.map((topic: AdminTopicItem) => (
          <Paper
            key={topic.topic}
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow:
                "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              transition: "all 0.2s",
              "&:hover": {
                boxShadow:
                  "0 4px 12px color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                borderColor:
                  "color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default) 65%)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <IconWrapper icon="mdi:book-outline" size={22} color="var(--accent-indigo)" />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                {topic.topic}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                  {t("adminMockInterview.interviewsColumn")}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {topic.completed_interviews}/{topic.total_interviews}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                  {t("adminMockInterview.uniqueStudentsColumn")}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {topic.unique_students}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                  {t("adminMockInterview.avgScore")}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color:
                      topic.average_score >= 70
                        ? "var(--success-500)"
                        : topic.average_score >= 50
                        ? "var(--warning-500)"
                        : "var(--error-500)",
                  }}
                >
                  {topic.average_score?.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
            {topic.difficulty_breakdown &&
              Object.keys(topic.difficulty_breakdown).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1 }}>
                    {t("adminMockInterview.difficulty")}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {Object.entries(topic.difficulty_breakdown).map(
                      ([diff, count]) => (
                        <Chip
                          key={diff}
                          label={`${diff}: ${count}`}
                          size="small"
                          sx={{
                            fontSize: "0.7rem",
                            backgroundColor:
                              "color-mix(in srgb, var(--font-secondary) 12%, var(--surface) 88%)",
                            color: "var(--font-primary)",
                          }}
                        />
                      )
                    )}
                  </Box>
                </Box>
              )}
            {topic.subtopics && topic.subtopics.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1 }}>
                  {t("adminMockInterview.subtopics")}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {topic.subtopics.map((st) => (
                    <Box
                      key={st.subtopic}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <Typography variant="body2">{st.subtopic}</Typography>
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                        {st.completed}/{st.total_interviews} · {t("adminMockInterview.avg")} {st.average_score?.toFixed(1)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
