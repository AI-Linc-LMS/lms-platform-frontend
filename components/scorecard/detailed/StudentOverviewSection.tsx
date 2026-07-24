"use client";

import Link from "next/link";
import { Box, Typography, Chip, Tooltip, Avatar } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatTimeSpent } from "@/lib/services/scorecard.service";
import { StudentOverview } from "@/lib/types/scorecard.types";
import {
  gradeLevelColor,
  gradeLevelGradient,
  learningStateAccentColor,
  learningStateLabel,
  learningStateTooltip,
} from "@/lib/utils/scorecard-visual";
import {
  CountUp,
  Reveal,
  fadeRise,
  gridStagger,
  useViewportEntrance,
} from "@/components/scorecard/shared";

interface StudentOverviewSectionProps {
  data: StudentOverview;
  /** When true (e.g. admin view), course cards are not clickable */
  readOnly?: boolean;
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/**
 * Convert "Interview-Ready" → "A+", "Advanced" → "A", "Intermediate" → "B", else "C".
 * Used only as the visual grade glyph; the full label is still shown as a chip.
 */
function gradeGlyph(level: string): string {
  switch (level) {
    case "Interview-Ready":
      return "A+";
    case "Advanced":
      return "A";
    case "Intermediate":
      return "B";
    default:
      return "C";
  }
}

export function StudentOverviewSection({ data, readOnly }: StudentOverviewSectionProps) {
  const gradeColor = gradeLevelColor(data.overallGrade);
  const gradeGrad = gradeLevelGradient(data.overallGrade);
  const learningStateColor = learningStateAccentColor(data.statusBadge);
  const entrance = useViewportEntrance();

  const dailyScore =
    data.dailyPerformanceScore != null && data.dailyPerformanceScore >= 0
      ? Math.round(data.dailyPerformanceScore)
      : null;

  const programNames = data.programName
    ? Array.from(
        new Set(
          data.programName.split(",").map((s) => s.trim()).filter(Boolean),
        ),
      )
    : [];

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Decorative gradient mesh behind everything */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.55,
            backgroundImage: [
              `radial-gradient(60% 70% at 0% 0%, ${gradeColor}1F, transparent 60%)`,
              `radial-gradient(45% 60% at 100% 0%, color-mix(in srgb, var(--accent-cyan) 14%, transparent), transparent 60%)`,
              `radial-gradient(50% 55% at 100% 100%, color-mix(in srgb, var(--accent-purple) 10%, transparent), transparent 60%)`,
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 5 } }}>
          {/* Identity block - stacked editorial layout */}
          <Box
            sx={{
              pb: { xs: 3, md: 3.5 },
              mb: { xs: 3, md: 4 },
              borderBottom: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            {/* Row 1: avatar + name + cohort tag */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 2, sm: 2.5 },
                minWidth: 0,
              }}
            >
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                {/* Subtle ring halo */}
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: -6,
                    borderRadius: "50%",
                    background: `conic-gradient(from 140deg, ${gradeColor} 0%, color-mix(in srgb, ${gradeColor} 30%, transparent) 65%, transparent 100%)`,
                    filter: "blur(2px)",
                    opacity: 0.6,
                  }}
                />
                {data.profilePicUrl ? (
                  <Avatar
                    src={data.profilePicUrl}
                    alt={data.studentName || "Student"}
                    sx={{
                      position: "relative",
                      width: { xs: 56, sm: 64 },
                      height: { xs: 56, sm: 64 },
                      border: "3px solid var(--card-bg)",
                      boxShadow: `0 10px 30px ${gradeColor}55`,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      width: { xs: 56, sm: 64 },
                      height: { xs: 56, sm: 64 },
                      borderRadius: "50%",
                      background: gradeGrad,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "3px solid var(--card-bg)",
                      boxShadow: `0 10px 30px ${gradeColor}55`,
                    }}
                  >
                    <IconWrapper icon="mdi:account-circle" size={36} color="#ffffff" />
                  </Box>
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    mb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: gradeColor,
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${gradeColor} 20%, transparent)`,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    Student Overview
                  </Typography>
                </Box>
                <Typography
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.65rem", sm: "2rem", md: "2.35rem" },
                    lineHeight: 1.05,
                    letterSpacing: "-0.035em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={data.studentName || ""}
                >
                  {data.studentName || "-"}
                </Typography>
              </Box>
              {data.cohort && (
                <Box
                  sx={{
                    display: { xs: "none", sm: "inline-flex" },
                    alignItems: "center",
                    gap: 0.75,
                    flexShrink: 0,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 999,
                    border:
                      "1px solid color-mix(in srgb, var(--font-secondary) 22%, transparent)",
                    backgroundColor:
                      "color-mix(in srgb, var(--font-secondary) 6%, transparent)",
                  }}
                >
                  <IconWrapper
                    icon="mdi:account-group-outline"
                    size={14}
                    color="var(--font-secondary)"
                  />
                  <Typography
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {data.cohort}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Row 2: enrolled programs */}
            {programNames.length > 0 && (
              <Box sx={{ mt: { xs: 2.5, md: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    mb: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 18,
                      height: 1,
                      background: "var(--accent-indigo)",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--accent-indigo)",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Enrolled · {programNames.length}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 1,
                      background:
                        "color-mix(in srgb, var(--border-default) 80%, transparent)",
                    }}
                  />
                  {data.cohort && (
                    <Typography
                      sx={{
                        display: { xs: "inline-block", sm: "none" },
                        color: "var(--font-secondary)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {data.cohort}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.875,
                  }}
                >
                  {programNames.map((name, index) => (
                    <Box
                      key={`program-${index}-${name}`}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.5,
                        py: 0.625,
                        borderRadius: 999,
                        backgroundColor:
                          "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                        border:
                          "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
                        backgroundImage:
                          "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 6%, transparent) 0%, transparent 100%)",
                      }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "var(--accent-indigo)",
                        }}
                      />
                      <Typography
                        sx={{
                          color: "var(--accent-indigo)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          letterSpacing: "-0.005em",
                          lineHeight: 1.3,
                        }}
                      >
                        {name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            {programNames.length === 0 && (
              <Typography
                variant="body2"
                sx={{ mt: 2, color: "var(--font-secondary)", fontStyle: "italic" }}
              >
                No program enrolled yet.
              </Typography>
            )}
          </Box>

          {/* Hero grid: massive grade + animated ring + supporting numbers */}
          <Box
            component={motion.div}
            variants={gridStagger}
            {...entrance}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
              gap: { xs: 3, md: 5 },
              alignItems: "stretch",
            }}
          >
            {/* LEFT: hero - massive grade letter + ring overlay */}
            <Box
              component={motion.div}
              variants={fadeRise}
              sx={{
                position: "relative",
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                overflow: "hidden",
                background: `linear-gradient(140deg, ${gradeColor}18 0%, ${gradeColor}04 60%, transparent 100%)`,
                border: `1px solid ${gradeColor}33`,
              }}
            >
              {/* Glyph behind */}
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  top: { xs: -10, md: -40 },
                  right: { xs: -10, md: -20 },
                  fontWeight: 900,
                  letterSpacing: "-0.08em",
                  lineHeight: 0.8,
                  fontSize: { xs: "9rem", sm: "12rem", md: "16rem" },
                  background: gradeGrad,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  opacity: 0.18,
                  userSelect: "none",
                }}
              >
                {gradeGlyph(data.overallGrade)}
              </Box>

              <Box sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    Overall Performance
                  </Typography>
                  <Typography
                    component="div"
                    sx={{
                      mt: 1,
                      fontWeight: 800,
                      lineHeight: 0.95,
                      letterSpacing: "-0.05em",
                      fontSize: { xs: "4.5rem", sm: "6rem", md: "7rem" },
                      color: "var(--font-primary)",
                    }}
                  >
                    <CountUp value={data.overallPerformanceScore} duration={1.6} />
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.45em",
                        fontWeight: 700,
                        color: "var(--font-secondary)",
                        ml: 0.5,
                        verticalAlign: "super",
                      }}
                    >
                      /100
                    </Box>
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={data.overallGrade}
                    icon={<IconWrapper icon="mdi:star-four-points" size={16} color="#ffffff" />}
                    sx={{
                      background: gradeGrad,
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      height: 32,
                      px: 0.5,
                      boxShadow: `0 6px 18px ${gradeColor}55`,
                      "& .MuiChip-icon": { color: "#ffffff" },
                    }}
                  />
                  {data.gradeCriteria && (
                    <Tooltip title={data.gradeCriteria} placement="top" arrow>
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          cursor: "help",
                          color: "var(--font-secondary)",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                        }}
                      >
                        <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                        How is this calculated?
                      </Box>
                    </Tooltip>
                  )}
                  {dailyScore != null && (
                    <Tooltip
                      title={
                        data.dailyProgressPercentage != null
                          ? `Today's content completion: ${Math.round(data.dailyProgressPercentage)}%`
                          : "Today's performance score"
                      }
                      placement="top"
                      arrow
                    >
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.75,
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 999,
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.32)",
                          cursor: "help",
                        }}
                      >
                        <IconWrapper icon="mdi:trending-up" size={14} color="#10b981" />
                        <Typography
                          sx={{
                            color: "#059669",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          Today {dailyScore}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.875rem",
                    maxWidth: 360,
                    lineHeight: 1.55,
                  }}
                >
                  Composite of completion velocity and active learning time. Updated
                  continuously as you progress.
                </Typography>
              </Box>
            </Box>

            {/* RIGHT: editorial 2x2 metric rail (full height) */}
            <Box
              component={motion.div}
              variants={fadeRise}
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: { md: 360 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 22,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${gradeColor} 0%, color-mix(in srgb, ${gradeColor} 60%, transparent) 100%)`,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Key Metrics
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  borderLeft: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <EditorialStat
                  accent="#0a66c2"
                  icon="mdi:clock-outline"
                  label="Total Time"
                  value={formatTimeSpent(data.totalTimeSpentSeconds)}
                  hint="Active learning time"
                />
                <EditorialStat
                  accent="#f59e0b"
                  icon="mdi:fire"
                  label="Active Streak"
                  value={
                    <>
                      <CountUp value={data.activeDaysStreak} />
                      <Box
                        component="span"
                        sx={{ ml: 0.5, fontSize: "0.4em", fontWeight: 700, color: "var(--font-secondary)" }}
                      >
                        days
                      </Box>
                    </>
                  }
                  hint={`${data.totalDaysActive ?? 0} total active days`}
                />
                <EditorialStat
                  accent="#10b981"
                  icon="mdi:progress-check"
                  label="Completion"
                  value={
                    <>
                      <CountUp value={data.completionPercentage} />
                      <Box
                        component="span"
                        sx={{ ml: 0.25, fontSize: "0.5em", fontWeight: 700, color: "var(--font-secondary)" }}
                      >
                        %
                      </Box>
                    </>
                  }
                  hint="Course progress"
                />
                <EditorialStat
                  accent={learningStateColor}
                  icon="mdi:school-outline"
                  label="Learning State"
                  value={learningStateLabel(data.statusBadge)}
                  valueAsText
                  hint={data.statusCriteria ?? learningStateTooltip(data.statusBadge)}
                />
              </Box>
            </Box>
          </Box>

          {/* Current week courses - minimal editorial cards */}
          <Box
            component={motion.div}
            variants={fadeRise}
            {...entrance}
            transition={{ delay: 0.15 }}
            sx={{
              mt: { xs: 4, md: 5 },
              pt: { xs: 3, md: 4 },
              borderTop: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}>
              <Box
                sx={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg, var(--accent-indigo) 0%, var(--accent-cyan) 100%)",
                }}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Where you are now
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "var(--font-primary)",
                    fontSize: "1.125rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Current week across enrolled courses
                </Typography>
              </Box>
            </Box>

            {data.courseProgress && data.courseProgress.length > 0 ? (
              <Box
                component={motion.div}
                variants={gridStagger}
                {...entrance}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {data.courseProgress.map((course) => {
                  const card = (
                    <Box
                      component={motion.div}
                      variants={ITEM_VARIANTS}
                      sx={{
                        position: "relative",
                        p: 2,
                        borderRadius: 2.5,
                        border: "1px solid color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
                        background:
                          "linear-gradient(180deg, color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg)) 0%, var(--card-bg) 100%)",
                        overflow: "hidden",
                        cursor: readOnly ? "default" : "pointer",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.25,
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                            color: "var(--accent-indigo)",
                          }}
                        >
                          <IconWrapper icon="mdi:book-open-variant" size={16} color="currentColor" />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--accent-indigo)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            lineHeight: 1.2,
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={course.courseName}
                        >
                          {course.courseName}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: "var(--font-primary)",
                          fontSize: "1.5rem",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.05,
                        }}
                      >
                        Week {course.currentWeek}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--font-secondary)",
                          fontSize: "0.8rem",
                          display: "block",
                          mt: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={course.currentModule}
                      >
                        {course.currentModule}
                      </Typography>
                      {!readOnly && (
                        <Box
                          aria-hidden
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            opacity: 0.55,
                          }}
                        >
                          <IconWrapper
                            icon="mdi:arrow-top-right"
                            size={18}
                            color="var(--accent-indigo)"
                          />
                        </Box>
                      )}
                    </Box>
                  );
                  return readOnly ? (
                    <Box key={course.courseId} sx={{ minWidth: 0 }}>
                      {card}
                    </Box>
                  ) : (
                    <Link
                      key={course.courseId}
                      href={`/courses/${course.courseId}`}
                      style={{ textDecoration: "none", minWidth: 0 }}
                    >
                      {card}
                    </Link>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: "1.75rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Week {data.currentWeek}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--font-secondary)", fontSize: "0.875rem" }}
                >
                  {data.currentModule}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Reveal>
  );
}

interface EditorialStatProps {
  accent: string;
  icon: string;
  label: string;
  value: React.ReactNode;
  hint: string;
  /** When true, render the value as text (string label) instead of large number. */
  valueAsText?: boolean;
}

/**
 * Magazine-style stat cell - accent rule on top, oversized number, tiny caption.
 * Sits in a 2x2 grid with hairline borders that form a clean editorial table.
 */
function EditorialStat({
  accent,
  icon,
  label,
  value,
  hint,
  valueAsText = false,
}: EditorialStatProps) {
  return (
    <Box
      component={motion.div}
      variants={ITEM_VARIANTS}
      sx={{
        position: "relative",
        p: { xs: 2.25, sm: 2.75 },
        minHeight: { xs: 150, md: 170 },
        borderRight: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        transition: "background-color 0.3s ease",
        backgroundImage: `linear-gradient(180deg, transparent 0%, color-mix(in srgb, ${accent} 3%, transparent) 100%)`,
        "&:hover": {
          backgroundColor: `color-mix(in srgb, ${accent} 7%, transparent)`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: 36,
          height: 2,
          background: accent,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }}
        >
          <IconWrapper icon={icon} size={14} color={accent} />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "var(--font-secondary)",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        component="div"
        sx={{
          fontWeight: 800,
          color: "var(--font-primary)",
          letterSpacing: "-0.025em",
          lineHeight: 1.02,
          fontSize: valueAsText
            ? { xs: "1.25rem", md: "1.4rem" }
            : { xs: "2.25rem", sm: "2.6rem", md: "2.8rem" },
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          fontSize: "0.75rem",
          mt: "auto",
          lineHeight: 1.4,
        }}
      >
        {hint}
      </Typography>
    </Box>
  );
}
