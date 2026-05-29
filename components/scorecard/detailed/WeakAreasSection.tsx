"use client";

import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  SectionHero,
  SectionShell,
  fadeRise,
  gridStagger,
  useViewportEntrance,
} from "@/components/scorecard/shared";
import type { WeakAreas } from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface WeakAreasSectionProps {
  data: WeakAreas;
}

const RECO_ICON: Record<string, string> = {
  mcq: "mdi:format-list-checks",
  revise: "mdi:book-open-page-variant",
  video: "mdi:play-circle-outline",
  interview: "mdi:account-voice",
};
const RECO_ACCENT: Record<string, string> = {
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
        fontSize: "0.72rem",
        mt: 0.5,
      }}
    >
      {contentType && (
        <Chip
          size="small"
          label={contentType.replace(/_/g, " ")}
          sx={{
            height: 18,
            fontSize: "0.62rem",
            fontWeight: 800,
            textTransform: "capitalize",
            bgcolor: "color-mix(in srgb, var(--border-default) 35%, transparent)",
            color: "var(--font-secondary)",
          }}
        />
      )}
      {parts.length > 0 && <Box component="span">{parts.join(" › ")}</Box>}
      {itemName && (
        <Box
          component="span"
          sx={{
            color: "var(--font-primary)",
            fontWeight: 700,
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
  const entrance = useViewportEntrance();
  const { weakThreshold, skillsBelowThreshold, topicsFrequentlyIncorrect, skippedQuestions, recommendations } = data;

  const isAllClear =
    skillsBelowThreshold.length === 0 && topicsFrequentlyIncorrect.length === 0 && skippedQuestions.length === 0;

  // Spotlight = the weakest skill (lowest currentScore). If no skills are flagged,
  // fall back to the topic the learner missed most often.
  const skillSpotlight = skillsBelowThreshold[0];
  const topicFallback = !skillSpotlight ? topicsFrequentlyIncorrect[0] : undefined;
  const spotlight: typeof skillSpotlight | undefined = skillSpotlight ?? (
    topicFallback
      ? {
          skillName: topicFallback.topicName,
          currentScore:
            topicFallback.totalAttempts > 0
              ? Math.max(
                  0,
                  Math.round(
                    ((topicFallback.totalAttempts - topicFallback.incorrectCount) /
                      topicFallback.totalAttempts) *
                      100,
                  ),
                )
              : 0,
          threshold: weakThreshold,
          recommendation: `Missed ${topicFallback.incorrectCount} of ${topicFallback.totalAttempts} times — review this topic before your next attempt.`,
          sourceContext: topicFallback.sourceContext,
        }
      : undefined
  );
  const spotlightLabel = skillSpotlight ? "Top priority · weakest skill" : "Top priority · most-missed topic";

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, #f59e0b 16%, transparent), transparent 60%)",
          "radial-gradient(45% 60% at 100% 0%, color-mix(in srgb, var(--accent-indigo) 10%, transparent), transparent 60%)",
        ]}
      >
        <SectionHero
          chapter="Chapter 05"
          title="Weak Areas & Attention Alerts"
          subtitle={`Skills below ${Math.round(weakThreshold)}%, topics you keep missing, and questions you skipped.`}
          accentTop="#f59e0b"
          accentBottom="#d97706"
          iconBadge={{
            icon: "mdi:alert-decagram-outline",
            gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          }}
          rightSlot={
            <Tooltip
              title={`Skills below ${Math.round(weakThreshold)}% surface here as priority practice.`}
              arrow
            >
              <Chip
                size="small"
                icon={<IconWrapper icon="mdi:flag" size={14} />}
                label={`Threshold: ${Math.round(weakThreshold)}%`}
                sx={{
                  fontWeight: 800,
                  bgcolor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                  color: "#b45309",
                }}
              />
            </Tooltip>
          }
        />

        {isAllClear ? (
          <Box
            component={motion.div}
            variants={fadeRise}
            {...entrance}
            sx={{
              py: { xs: 6, sm: 8 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, #10b981 50%, transparent)",
              bgcolor: "color-mix(in srgb, #10b981 6%, transparent)",
              color: "var(--font-primary)",
            }}
          >
            <IconWrapper icon="mdi:check-decagram" size={56} color="#10b981" />
            <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
              All clear — no flagged weak areas right now.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 480, mx: "auto" }}>
              Keep going. Cards reappear if proficiency drops below {Math.round(weakThreshold)}% or topics are repeatedly missed.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Spotlight hero — biggest weakness, with action prompt */}
            {spotlight && (
              <Box
                component={motion.div}
                variants={fadeRise}
                {...entrance}
                sx={{
                  position: "relative",
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 3,
                  mb: { xs: 3.5, md: 4.5 },
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, #ef4444 12%, transparent) 0%, color-mix(in srgb, #f59e0b 10%, transparent) 100%)",
                  border: "1px solid color-mix(in srgb, #ef4444 22%, transparent)",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "auto minmax(0, 1fr)" },
                  gap: { xs: 2.5, md: 3 },
                  alignItems: "center",
                }}
              >
                <AnimatedRing
                  value={spotlight.currentScore}
                  size={130}
                  strokeWidth={11}
                  color="#ef4444"
                  caption=""
                  valueFontSize={28}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#b45309",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    {spotlightLabel}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2rem" },
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                      mt: 0.25,
                    }}
                  >
                    {spotlight.skillName}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 700, color: "var(--font-secondary)", fontSize: "0.9rem" }}>
                      Currently
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: "#ef4444", fontSize: "1.4rem", fontVariantNumeric: "tabular-nums" }}>
                      {spotlight.currentScore.toFixed(0)}%
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: "var(--font-secondary)", fontSize: "0.9rem" }}>
                      vs threshold
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "1.1rem", fontVariantNumeric: "tabular-nums" }}>
                      {Math.round(spotlight.threshold)}%
                    </Typography>
                  </Box>
                  {spotlight.recommendation && (
                    <Typography variant="body2" sx={{ mt: 1.5, color: "var(--font-primary)", lineHeight: 1.5 }}>
                      {spotlight.recommendation}
                    </Typography>
                  )}
                  {spotlight.sourceContext && (
                    <Breadcrumb
                      contentType={spotlight.sourceContext.contentType}
                      itemName={spotlight.sourceContext.itemName}
                      courseName={spotlight.sourceContext.courseName}
                      moduleName={spotlight.sourceContext.moduleName}
                      submoduleName={spotlight.sourceContext.submoduleName}
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Recommendations row */}
            {recommendations.length > 0 && (
              <Box
                component={motion.div}
                variants={gridStagger}
                {...entrance}
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(240px, 1fr))" },
                  mb: { xs: 3, md: 4 },
                }}
              >
                {[...recommendations]
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec) => {
                  const accent = RECO_ACCENT[rec.type] ?? "var(--accent-indigo)";
                  const icon = RECO_ICON[rec.type] ?? "mdi:lightbulb-outline";
                  const isLink = !!rec.actionUrl;
                  const isExternal = isLink && /^https?:\/\//i.test(rec.actionUrl ?? "");
                  const Wrapper: any = isLink ? "a" : motion.div;
                  return (
                    <motion.div
                      key={`${rec.type}-${rec.title}`}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
                      }}
                    >
                      <Wrapper
                        {...(isLink
                          ? {
                              href: rec.actionUrl,
                              target: isExternal ? "_blank" : "_self",
                              rel: isExternal ? "noopener noreferrer" : undefined,
                            }
                          : {})}
                        style={{ textDecoration: "none", display: "block" }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                            bgcolor: "var(--card-bg)",
                            cursor: isLink ? "pointer" : "default",
                            transition: "border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
                            ...(isLink && {
                              "&:hover": {
                                borderColor: `color-mix(in srgb, ${accent} 50%, transparent)`,
                                transform: "translateY(-2px)",
                                boxShadow: `0 18px 40px -24px color-mix(in srgb, ${accent} 40%, transparent)`,
                              },
                            }),
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.75 }}>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                                color: accent,
                              }}
                            >
                              <IconWrapper icon={icon} size={16} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
                              {rec.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                            {rec.description}
                          </Typography>
                        </Box>
                      </Wrapper>
                    </motion.div>
                  );
                })}
              </Box>
            )}

            {/* Sub-panels: remaining weak skills + topics + skipped */}
            <Box
              component={motion.div}
              variants={gridStagger}
              {...entrance}
              sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}
            >
              {skillsBelowThreshold.length > 1 && (
                <Box
                  component={motion.div}
                  variants={fadeRise}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                    bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444", boxShadow: "0 0 0 4px color-mix(in srgb, #ef4444 18%, transparent)" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
                      Other skills below threshold (<CountUp value={skillsBelowThreshold.length - 1} />)
                    </Typography>
                  </Box>
                  <Box sx={{ display: "grid", gap: 1.25 }}>
                    {skillsBelowThreshold.slice(1, 6).map((s) => {
                      const accent = proficiencyBandColor(s.currentScore);
                      return (
                        <Box key={s.skillName}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.skillName}>
                              {s.skillName}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums" }}>
                              {s.currentScore.toFixed(0)}% / {Math.round(s.threshold)}%
                            </Typography>
                          </Box>
                          <Box sx={{ height: 6, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)", overflow: "hidden" }}>
                            <Box
                              sx={{
                                width: `${Math.max(0, Math.min(100, s.currentScore))}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${accent} 0%, color-mix(in srgb, ${accent} 65%, transparent) 100%)`,
                                transition: "width 0.6s ease",
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {topicsFrequentlyIncorrect.length > 0 && (
                <Box
                  component={motion.div}
                  variants={fadeRise}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                    bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#f59e0b", boxShadow: "0 0 0 4px color-mix(in srgb, #f59e0b 18%, transparent)" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
                      Topics you keep missing
                    </Typography>
                  </Box>
                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(180px, 1fr))" } }}>
                    {topicsFrequentlyIncorrect.slice(0, 6).map((t) => {
                      const ratio = t.totalAttempts > 0 ? t.incorrectCount / t.totalAttempts : 0;
                      const pct = Math.round(ratio * 100);
                      return (
                        <Box
                          key={t.topicName}
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                            bgcolor: "var(--card-bg)",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                            {t.topicName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#b45309", fontWeight: 800, letterSpacing: "0.02em" }}>
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

              {skippedQuestions.length > 0 && (
                <Box
                  component={motion.div}
                  variants={fadeRise}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                    bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                    gridColumn: { md: "1 / -1" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "var(--accent-indigo)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--accent-indigo) 18%, transparent)" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
                      Questions you skipped recently
                    </Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2.25, m: 0, display: "grid", gap: 0.5, color: "var(--font-primary)", fontSize: "0.85rem" }}>
                    {skippedQuestions.map((q, idx) => (
                      <Box component="li" key={`${q}-${idx}`} sx={{ lineHeight: 1.5 }}>
                        {q}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
      </SectionShell>
    </Reveal>
  );
}
