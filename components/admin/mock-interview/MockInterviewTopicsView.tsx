"use client";

import { Box, Typography, Paper, CircularProgress, Chip, Skeleton } from "@mui/material";
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
          border: "1px dashed #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:book-open-variant" size={36} color="#6366f1" />
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 500, color: "#374151", mb: 0.5 }}>
          No topic analytics yet
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          Topic data will appear as students complete interviews
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" sx={{ color: "#6b7280" }}>
        {data.total_topics} topics
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
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
              transition: "all 0.2s",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.12)",
                borderColor: "#c7d2fe",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <IconWrapper icon="mdi:book-outline" size={22} color="#6366f1" />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
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
                <Typography variant="caption" sx={{ color: "#6b7280" }}>
                  Interviews
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {topic.completed_interviews}/{topic.total_interviews}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280" }}>
                  Unique Students
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {topic.unique_students}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280" }}>
                  Avg Score
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color:
                      topic.average_score >= 70
                        ? "#16a34a"
                        : topic.average_score >= 50
                        ? "#d97706"
                        : "#dc2626",
                  }}
                >
                  {topic.average_score?.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
            {topic.difficulty_breakdown &&
              Object.keys(topic.difficulty_breakdown).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 1 }}>
                    Difficulty
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
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                          }}
                        />
                      )
                    )}
                  </Box>
                </Box>
              )}
            {topic.subtopics && topic.subtopics.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 1 }}>
                  Subtopics
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
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <Typography variant="body2">{st.subtopic}</Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280" }}>
                        {st.completed}/{st.total_interviews} · avg {st.average_score?.toFixed(1)}%
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
