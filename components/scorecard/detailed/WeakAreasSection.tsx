"use client";

import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  WeakAreas,
  WeakArea,
  TopicIncorrect,
  WeakAreaSourceContext,
} from "@/lib/types/scorecard.types";

export interface WeakAreasSectionProps {
  data: WeakAreas;
  /** When true, section is shown in read-only mode (e.g. admin view). */
  readOnly?: boolean;
}

function formatSourceContextMessage(
  ctx: WeakAreaSourceContext | undefined,
  suffix = "— need to study again"
): string | null {
  if (!ctx) return null;
  const parts: string[] = [];
  const contentType = ctx.contentType?.replace(/^./, (c) => c.toUpperCase()) || "activity";
  const itemName = ctx.itemName?.trim();
  const course = ctx.courseName?.trim();
  const module = ctx.moduleName?.trim();
  const submodule = ctx.submoduleName?.trim();
  const breadcrumb = [course, module, submodule].filter(Boolean).join(" › ");

  if (itemName) parts.push(`You attempted "${itemName}"`);
  else parts.push(`You attempted this ${contentType}`);
  if (breadcrumb) parts.push(`from ${breadcrumb}`);
  if (suffix) parts.push(suffix);
  return parts.join(" ");
}

export const WeakAreasSection: React.FC<WeakAreasSectionProps> = ({ data, readOnly }) => {
  const isEmpty =
    data.skillsBelowThreshold.length === 0 &&
    data.topicsFrequentlyIncorrect.length === 0;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
          borderBottom: "1px solid #fed7aa",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(249, 115, 22, 0.15)",
              border: "1px solid #fed7aa",
            }}
          >
            <IconWrapper icon="mdi:alert-octagon" size={26} color="#ea580c" />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1c1917",
                fontSize: { xs: "1.2rem", sm: "1.35rem" },
                letterSpacing: "-0.02em",
              }}
            >
              Weak Areas & Attention Alerts
            </Typography>
            <Typography variant="body2" sx={{ color: "#78716c", mt: 0.25, fontSize: "0.875rem" }}>
              Focus areas identified from your recent activity
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        {isEmpty ? (
          <Box
            sx={{
              py: 5,
              px: 3,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "#fafaf9",
              border: "1px dashed #d6d3d1",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
              }}
            >
              <IconWrapper icon="mdi:check-circle" size={28} color="#16a34a" />
            </Box>
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "#166534" }}>
              All clear
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#4d7c0f" }}>
              No weak areas identified. Keep up the great work!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Skills Below Threshold */}
            {data.skillsBelowThreshold.length > 0 && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#ef4444",
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#44403c", fontSize: "0.875rem" }}
                  >
                    Skills Below Threshold
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 1.5,
                  }}
                >
                  {data.skillsBelowThreshold.map((skill: WeakArea, i: number) => {
                    const sourceMsg = formatSourceContextMessage(skill.sourceContext);
                    return (
                      <Box
                        key={i}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "#fff",
                          border: "1px solid #fecaca",
                          borderLeft: "4px solid #ef4444",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.08)",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#1c1917", fontSize: "0.9375rem" }}>
                            {skill.skillName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "#b91c1c",
                              fontSize: "0.875rem",
                            }}
                          >
                            {skill.currentScore}%
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: "#57534e", lineHeight: 1.5, display: "block" }}>
                          {skill.recommendation}
                        </Typography>
                        {sourceMsg && (
                          <Box
                            sx={{
                              mt: 1.5,
                              py: 1,
                              px: 1.25,
                              borderRadius: 1,
                              bgcolor: "#fef2f2",
                              borderLeft: "3px solid #f87171",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#78716c", fontSize: "0.75rem", fontStyle: "italic", lineHeight: 1.4 }}>
                              📍 {sourceMsg}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Topics Frequently Incorrect */}
            {data.topicsFrequentlyIncorrect.length > 0 && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#f59e0b",
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#44403c", fontSize: "0.875rem" }}
                  >
                    Topics Frequently Incorrect
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 1.5,
                  }}
                >
                  {data.topicsFrequentlyIncorrect.map((topic: TopicIncorrect, i: number) => {
                    const sourceMsg = formatSourceContextMessage(topic.sourceContext);
                    return (
                      <Box
                        key={i}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "#fff",
                          border: "1px solid #fde68a",
                          borderLeft: "4px solid #f59e0b",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#1c1917", fontSize: "0.9375rem" }}>
                            {topic.topicName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "#b45309",
                              fontSize: "0.8125rem",
                            }}
                          >
                            {topic.incorrectCount}/{topic.totalAttempts} wrong
                          </Typography>
                        </Box>
                        {sourceMsg && (
                          <Box
                            sx={{
                              py: 1,
                              px: 1.25,
                              borderRadius: 1,
                              bgcolor: "#fffbeb",
                              borderLeft: "3px solid #fbbf24",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#78716c", fontSize: "0.75rem", fontStyle: "italic", lineHeight: 1.4 }}>
                              📍 {sourceMsg}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};
