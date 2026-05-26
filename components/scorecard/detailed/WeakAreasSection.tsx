"use client";

import { Box, Chip, LinearProgress, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Reveal, gridStagger } from "@/components/scorecard/shared";
import type { WeakAreas } from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface WeakAreasSectionProps {
  data: WeakAreas;
}

const RECOMMENDATION_ICON: Record<string, string> = {
  mcq: "mdi:format-list-checks",
  revise: "mdi:book-open-page-variant",
  video: "mdi:play-circle-outline",
  interview: "mdi:account-voice",
};

const RECOMMENDATION_ACCENT: Record<string, string> = {
  mcq: "var(--accent-indigo)",
  revise: "#f59e0b",
  video: "#10b981",
  interview: "#a855f7",
};

function Breadcrumb({
  contentType,
  itemName,
  courseName,
  moduleName,
  submoduleName,
}: {
  contentType?: string;
  itemName?: string;
  courseName?: string;
  moduleName?: string;
  submoduleName?: string;
}) {
  const parts = [courseName, moduleName, submoduleName].filter(Boolean);
  if (!parts.length && !itemName && !contentType) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        flexWrap: "wrap",
        color: "var(--font-secondary)",
        fontSize: "0.75rem",
        mt: 0.5,
      }}
    >
      {contentType && (
        <Chip
          size="small"
          label={contentType.replace(/_/g, " ")}
          sx={{
            height: 20,
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "capitalize",
            bgcolor: "color-mix(in srgb, var(--border-default) 35%, transparent)",
            color: "var(--font-secondary)",
          }}
        />
      )}
      {parts.length > 0 && (
        <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {parts.join(" › ")}
        </Box>
      )}
      {itemName && (
        <Box
          component="span"
          sx={{
            color: "var(--font-primary)",
            fontWeight: 600,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={itemName}
        >
          — {itemName}
        </Box>
      )}
    </Box>
  );
}

export function WeakAreasSection({ data }: WeakAreasSectionProps) {
  const {
    weakThreshold,
    skillsBelowThreshold,
    topicsFrequentlyIncorrect,
    skippedQuestions,
    recommendations,
  } = data;

  const isAllClear =
    skillsBelowThreshold.length === 0 &&
    topicsFrequentlyIncorrect.length === 0 &&
    skippedQuestions.length === 0;

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Amber/red radial mesh to telegraph the alert nature without alarming. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            backgroundImage: [
              "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, #f59e0b 16%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 100% 0%, color-mix(in srgb, var(--accent-indigo) 12%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              pb: { xs: 2.5, md: 3 },
              mb: { xs: 2.5, md: 3 },
              borderBottom:
                "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, #f59e0b 60%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:alert-decagram-outline" size={22} color="#fff" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    lineHeight: 1.25,
                  }}
                >
                  Weak Areas & Attention Alerts
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.85rem", mt: 0.25 }}
                >
                  Skills below {Math.round(weakThreshold)}%, topics you keep missing, and questions you skipped.
                </Typography>
              </Box>
            </Box>
            <Tooltip
              title={`Skills with proficiency below ${Math.round(weakThreshold)}% surface here as priority practice.`}
              arrow
            >
              <Chip
                size="small"
                icon={<IconWrapper icon="mdi:flag" size={14} />}
                label={`Threshold: ${Math.round(weakThreshold)}%`}
                sx={{
                  fontWeight: 700,
                  bgcolor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                  color: "#b45309",
                }}
              />
            </Tooltip>
          </Box>

          {isAllClear ? (
            <Box
              sx={{
                py: { xs: 4, sm: 5 },
                textAlign: "center",
                borderRadius: 2,
                border: "1px dashed color-mix(in srgb, #10b981 50%, transparent)",
                bgcolor: "color-mix(in srgb, #10b981 6%, transparent)",
                color: "var(--font-primary)",
              }}
            >
              <IconWrapper icon="mdi:check-decagram" size={42} color="#10b981" />
              <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                All clear — no flagged weak areas right now.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Keep going! Cards reappear if proficiency drops below {Math.round(weakThreshold)}% or topics are repeatedly missed.
              </Typography>
            </Box>
          ) : (
            <motion.div
              variants={gridStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "1fr",
              }}
            >
              {/* Recommendations row — surface the call-to-action first. */}
              {recommendations.length > 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(auto-fit, minmax(220px, 1fr))",
                    },
                  }}
                >
                  {recommendations.map((rec) => {
                    const accent = RECOMMENDATION_ACCENT[rec.type] ?? "var(--accent-indigo)";
                    const icon = RECOMMENDATION_ICON[rec.type] ?? "mdi:lightbulb-outline";
                    const isLink = !!rec.actionUrl;
                    const Wrapper: any = isLink ? "a" : "div";
                    return (
                      <Wrapper
                        key={`${rec.type}-${rec.title}`}
                        {...(isLink ? { href: rec.actionUrl, target: "_self", rel: "noreferrer" } : {})}
                        style={{ textDecoration: "none" }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            p: 1.75,
                            borderRadius: 2.5,
                            border:
                              "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                            bgcolor: "var(--card-bg)",
                            cursor: isLink ? "pointer" : "default",
                            transition: "border-color 0.18s ease, transform 0.18s ease",
                            "&:hover": isLink
                              ? {
                                  borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
                                  transform: "translateY(-1px)",
                                }
                              : undefined,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: `color-mix(in srgb, ${accent} 16%, transparent)`,
                                color: accent,
                              }}
                            >
                              <IconWrapper icon={icon} size={16} />
                            </Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 800, color: "var(--font-primary)" }}
                            >
                              {rec.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                            {rec.description}
                          </Typography>
                        </Box>
                      </Wrapper>
                    );
                  })}
                </Box>
              )}

              {/* Skills below threshold */}
              {skillsBelowThreshold.length > 0 && (
                <Box
                  sx={{
                    p: { xs: 1.75, sm: 2 },
                    borderRadius: 2.5,
                    border:
                      "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                    bgcolor:
                      "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#ef4444",
                        boxShadow:
                          "0 0 0 4px color-mix(in srgb, #ef4444 18%, transparent)",
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)" }}>
                      Skills below threshold ({skillsBelowThreshold.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "grid", gap: 1.25 }}>
                    {skillsBelowThreshold.slice(0, 6).map((s) => {
                      const accent = proficiencyBandColor(s.currentScore);
                      return (
                        <Box key={s.skillName}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                              {s.skillName}
                            </Typography>
                            <Tooltip
                              title={`Threshold ${Math.round(s.threshold)}% · current ${s.currentScore.toFixed(0)}%`}
                              arrow
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 800,
                                  fontVariantNumeric: "tabular-nums",
                                  color: accent,
                                }}
                              >
                                {s.currentScore.toFixed(0)}% / {Math.round(s.threshold)}%
                              </Typography>
                            </Tooltip>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(0, Math.min(100, s.currentScore))}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor:
                                "color-mix(in srgb, var(--border-default) 45%, transparent)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                backgroundColor: accent,
                              },
                            }}
                          />
                          {s.recommendation && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              {s.recommendation}
                            </Typography>
                          )}
                          {s.sourceContext && (
                            <Breadcrumb
                              contentType={s.sourceContext.contentType}
                              itemName={s.sourceContext.itemName}
                              courseName={s.sourceContext.courseName}
                              moduleName={s.sourceContext.moduleName}
                              submoduleName={s.sourceContext.submoduleName}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Topics frequently incorrect */}
              {topicsFrequentlyIncorrect.length > 0 && (
                <Box
                  sx={{
                    p: { xs: 1.75, sm: 2 },
                    borderRadius: 2.5,
                    border:
                      "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                    bgcolor:
                      "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#f59e0b",
                        boxShadow:
                          "0 0 0 4px color-mix(in srgb, #f59e0b 18%, transparent)",
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)" }}>
                      Topics you keep missing
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(220px, 1fr))" },
                    }}
                  >
                    {topicsFrequentlyIncorrect.map((t) => {
                      const ratio = t.totalAttempts > 0 ? t.incorrectCount / t.totalAttempts : 0;
                      const pct = Math.round(ratio * 100);
                      return (
                        <Box
                          key={t.topicName}
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            border:
                              "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                            bgcolor: "var(--card-bg)",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                            {t.topicName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#b45309", fontWeight: 700 }}
                          >
                            {t.incorrectCount}/{t.totalAttempts} wrong · {pct}%
                          </Typography>
                          {t.sourceContext && (
                            <Breadcrumb
                              contentType={t.sourceContext.contentType}
                              itemName={t.sourceContext.itemName}
                              courseName={t.sourceContext.courseName}
                              moduleName={t.sourceContext.moduleName}
                              submoduleName={t.sourceContext.submoduleName}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Skipped questions */}
              {skippedQuestions.length > 0 && (
                <Box
                  sx={{
                    p: { xs: 1.75, sm: 2 },
                    borderRadius: 2.5,
                    border:
                      "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                    bgcolor:
                      "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "var(--accent-indigo)",
                        boxShadow:
                          "0 0 0 4px color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)" }}>
                      Questions you skipped recently
                    </Typography>
                  </Box>
                  <Box
                    component="ul"
                    sx={{
                      pl: 2.25,
                      m: 0,
                      display: "grid",
                      gap: 0.5,
                      color: "var(--font-primary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {skippedQuestions.map((q, idx) => (
                      <Box component="li" key={`${q}-${idx}`} sx={{ lineHeight: 1.5 }}>
                        {q}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </motion.div>
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
