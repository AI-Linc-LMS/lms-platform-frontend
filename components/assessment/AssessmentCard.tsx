"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Assessment } from "@/lib/services/assessment.service";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  isPsychometricAssessment,
  getPsychometricTags,
} from "@/lib/utils/psychometric-utils";
import { stripHtmlTags } from "@/lib/utils/html-utils";
import { useTranslation } from "react-i18next";
import { isMobileOrTabletForAssessment } from "@/lib/utils/assessment-device.utils";
import { AssessmentDesktopOnlyDialog } from "@/components/assessment/AssessmentDesktopOnlyGate";
import {
  isLearnerAssessmentSubmissionComplete,
  normalizeLearnerAssessmentStatus,
} from "@/lib/utils/assessment-learner-status";

interface AssessmentCardProps {
  assessment: Assessment;
}

function parseDateTime(s: string | undefined | null): Date | null {
  if (!s || typeof s !== "string" || !s.trim()) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateTimeDisplay(d: Date): string {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatRemainingTime(
  startDate: Date,
  t: (key: string, opts?: Record<string, number | string>) => string
): string {
  const now = new Date();
  const diff = startDate.getTime() - now.getTime();

  if (diff <= 0) {
    return t("assessments.availableNow");
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return t("assessments.startsInDaysHours", { days, hours });
  }
  if (hours > 0) {
    return t("assessments.startsInHoursMinutes", { hours, minutes });
  }
  if (minutes > 0) {
    return t("assessments.startsInMinutesSeconds", { minutes, seconds });
  }
  return t("assessments.startsInSeconds", { seconds });
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
}) => {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isRtl = theme.direction === "rtl";
  const router = useRouter();
  const submissionComplete = isLearnerAssessmentSubmissionComplete(assessment);
  const normalizedStatus = normalizeLearnerAssessmentStatus(assessment);

  const showResults =
    submissionComplete &&
    assessment.show_result !== false &&
    (assessment.evaluation_mode !== "manual" ||
      assessment.review_status === "published");
  const isPsychometric = isPsychometricAssessment(assessment);
  const psychometricTags = isPsychometric ? getPsychometricTags(assessment) : [];
  const isManual =
    !isPsychometric && assessment.evaluation_mode === "manual";

  const ctaAppearance = useMemo(() => {
    if (isPsychometric) {
      return {
        idleBg: showResults
          ? "var(--assessment-catalog-psychometric-cta-solid)"
          : "var(--assessment-catalog-psychometric-cta-gradient)",
        hoverBg: "var(--assessment-catalog-psychometric-cta-hover)",
        idleShadow: showResults
          ? "var(--assessment-catalog-psychometric-shadow-cta)"
          : "var(--assessment-catalog-psychometric-shadow-cta)",
        hoverShadow: "var(--assessment-catalog-psychometric-shadow-cta-hover)",
      };
    }
    if (isManual) {
      if (showResults) {
        return {
          idleBg: "var(--assessment-catalog-cta-success-solid)",
          hoverBg: "var(--assessment-catalog-cta-success-hover)",
          idleShadow: "var(--assessment-catalog-cta-success-shadow)",
          hoverShadow: "var(--assessment-catalog-cta-success-shadow-hover)",
        };
      }
      return {
        idleBg: "var(--assessment-catalog-cta-manual-gradient)",
        hoverBg: "var(--assessment-catalog-cta-manual-hover)",
        idleShadow: "var(--assessment-catalog-cta-manual-shadow)",
        hoverShadow: "var(--assessment-catalog-cta-manual-shadow-hover)",
      };
    }
    if (showResults) {
      return {
        idleBg: "var(--assessment-catalog-cta-success-solid)",
        hoverBg: "var(--assessment-catalog-cta-success-hover)",
        idleShadow: "var(--assessment-catalog-cta-success-shadow)",
        hoverShadow: "var(--assessment-catalog-cta-success-shadow-hover)",
      };
    }
    return {
      idleBg: "var(--assessment-catalog-cta-auto-gradient)",
      hoverBg: "var(--assessment-catalog-cta-auto-hover)",
      idleShadow: "var(--assessment-catalog-cta-auto-shadow)",
      hoverShadow: "var(--assessment-catalog-cta-auto-shadow-hover)",
    };
  }, [isPsychometric, isManual, showResults]);

  const statIconColor = isManual
    ? "var(--assessment-catalog-stat-icon-manual)"
    : "var(--assessment-catalog-stat-icon-auto)";
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [desktopOnlyOpen, setDesktopOnlyOpen] = useState(false);
  
  // Calculate remaining time for hover tooltip
  const startDate = useMemo(() => parseDateTime(assessment.start_time), [assessment.start_time]);
  
  useEffect(() => {
    if (!startDate) {
      setRemainingTime("");
      return;
    }

    const updateRemainingTime = () => {
      setRemainingTime(formatRemainingTime(startDate, t));
    };

    // Update immediately
    updateRemainingTime();

    // Update every second if less than 1 hour remaining, otherwise every minute
    const now = new Date();
    const diff = startDate.getTime() - now.getTime();
    const interval = diff < 3600000 ? 1000 : 60000; // 1 second if < 1 hour, else 1 minute

    const intervalId = setInterval(updateRemainingTime, interval);

    return () => clearInterval(intervalId);
  }, [startDate, t]);

  const { canStartNow, availabilityLabel, isExpired } = useMemo(() => {
    const now = Date.now();
    const start = parseDateTime(assessment.start_time);
    const end = parseDateTime(assessment.end_time);
    const hasStart = start !== null;
    const hasEnd = end !== null;

    if (!hasStart && !hasEnd) {
      return { canStartNow: true, availabilityLabel: "", isExpired: false };
    }
    if (hasStart && now < start.getTime()) {
      return {
        canStartNow: false,
        availabilityLabel: `Starts ${formatDateTimeDisplay(start)}`,
        isExpired: false,
      };
    }
    if (hasEnd && now > end.getTime()) {
      return {
        canStartNow: false,
        availabilityLabel: "Ended",
        isExpired: true,
      };
    }
    return { canStartNow: true, availabilityLabel: "", isExpired: false };
  }, [assessment.start_time, assessment.end_time]);

  const { buttonLabel, isClickable } = useMemo(() => {
    if (submissionComplete && showResults) {
      return { buttonLabel: t("assessments.viewResults"), isClickable: true };
    }
    if (submissionComplete && !showResults) {
      return {
        buttonLabel: t("assessments.submittedPendingReview"),
        isClickable: true,
      };
    }
    if (normalizedStatus === "in_progress") {
      // If assessment is in progress but expired (end_time passed), show "Ended"
      if (isExpired) {
        return { buttonLabel: t("assessments.ended"), isClickable: false };
      }
      // If assessment is in progress but can't start now (e.g., before start_time), show availability
      if (!canStartNow) {
        return {
          buttonLabel: availabilityLabel || t("assessments.resume"),
          isClickable: false,
        };
      }
      // Assessment is in progress and can be resumed
      return {
        buttonLabel: t("assessments.resume"),
        isClickable: true,
      };
    }
    if (normalizedStatus === "not_started" || !normalizedStatus) {
      if (canStartNow) {
        return {
          buttonLabel: t("assessments.startAssessment"),
          isClickable: true,
        };
      }
      if (isExpired) {
        return {
          buttonLabel: t("assessments.startAssessment"),
          isClickable: false,
        };
      }
      return { buttonLabel: availabilityLabel, isClickable: false };
    }
    return {
      buttonLabel: canStartNow
        ? t("assessments.startAssessment")
        : availabilityLabel || t("assessments.startAssessment"),
      isClickable: canStartNow,
    };
  }, [
    submissionComplete,
    showResults,
    normalizedStatus,
    canStartNow,
    isExpired,
    availabilityLabel,
    t,
  ]);

  /** Gradients cannot interpolate to solid colors; do not transition `background` (avoids hover flash). */
  const ctaButtonSx = useMemo(
    () => ({
      flexDirection: isRtl ? "row-reverse" : "row",
      background: !isClickable
        ? "var(--assessment-catalog-cta-disabled)"
        : ctaAppearance.idleBg,
      color: "var(--font-light)",
      fontWeight: 600,
      py: 1,
      borderRadius: 2,
      textTransform: "none" as const,
      fontSize: "0.875rem",
      boxShadow: !isClickable ? "none" : ctaAppearance.idleShadow,
      WebkitTapHighlightColor: "transparent",
      transition: "box-shadow 0.22s ease, transform 0.2s ease",
      "& .MuiButton-endIcon": { color: "inherit" },
      ...(isClickable
        ? {
            "&&:hover": {
              background: ctaAppearance.hoverBg,
              color: "var(--font-light)",
              boxShadow: ctaAppearance.hoverShadow,
              transform: "translateY(-2px)",
            },
            "&&:active": {
              background: ctaAppearance.hoverBg,
              color: "var(--font-light)",
              boxShadow: ctaAppearance.hoverShadow,
              transform: "translateY(0)",
            },
          }
        : {}),
      "&.Mui-disabled": {
        background: "var(--assessment-catalog-cta-disabled)",
        color: "var(--font-light)",
      },
    }),
    [isRtl, isClickable, ctaAppearance]
  );

  const handleClick = () => {
    if (!isClickable) return;
    if (submissionComplete && showResults) {
      router.push(`/assessments/result/${assessment.slug}`);
      return;
    }
    if (submissionComplete && !showResults) {
      router.push(`/assessments/${assessment.slug}/submission-success`);
      return;
    }
    if (isMobileOrTabletForAssessment()) {
      setDesktopOnlyOpen(true);
      return;
    }
    router.push(`/assessments/${assessment.slug}`);
  };

  return (
    <>
    <AssessmentDesktopOnlyDialog
      open={desktopOnlyOpen}
      onClose={() => setDesktopOnlyOpen(false)}
    />
    <Card
      sx={{
        height: "100%",
        minHeight: isPsychometric ? 360 : isManual ? 336 : 320,
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderTop: isManual
          ? "3px solid var(--assessment-catalog-manual-stripe)"
          : undefined,
        borderColor: isPsychometric
          ? showResults
            ? "var(--assessment-catalog-psychometric-border-done)"
            : "var(--assessment-catalog-psychometric-border-active)"
          : isManual
            ? showResults
              ? "var(--assessment-catalog-manual-border-done)"
              : "var(--assessment-catalog-manual-border-active)"
            : showResults
              ? "var(--assessment-catalog-card-border-auto-done)"
              : "var(--assessment-catalog-card-border-neutral)",
        borderRadius: 3,
        overflow: "hidden",
        transition: "all 0.3s ease",
        position: "relative",
        cursor: isClickable ? "pointer" : "default",
        boxShadow: isPsychometric
          ? "var(--assessment-catalog-psychometric-shadow)"
          : isManual
            ? showResults
              ? "var(--assessment-catalog-manual-shadow-done)"
              : "var(--assessment-catalog-manual-shadow-active)"
            : "var(--assessment-catalog-card-shadow-neutral)",
        "&:hover": isClickable
          ? {
              boxShadow: isPsychometric
                ? "var(--assessment-catalog-psychometric-shadow-hover)"
                : isManual
                  ? showResults
                    ? "var(--assessment-catalog-manual-shadow-hover-done)"
                    : "var(--assessment-catalog-manual-shadow-hover-active)"
                  : "var(--assessment-catalog-card-shadow-hover-neutral)",
              transform: "translateY(-4px)",
              borderColor: isPsychometric
                ? showResults
                  ? "var(--assessment-catalog-psychometric-border-hover-done)"
                  : "var(--assessment-catalog-psychometric-border-hover-active)"
                : isManual
                  ? showResults
                    ? "var(--assessment-catalog-manual-border-hover-done)"
                    : "var(--assessment-catalog-manual-border-hover-active)"
                  : showResults
                    ? "var(--assessment-catalog-card-border-hover-done)"
                    : "var(--assessment-catalog-card-border-hover-auto)",
            }
          : {},
      }}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      aria-label={
        isClickable
          ? `${stripHtmlTags(assessment.title || "").trim() || assessment.title} - ${buttonLabel}`
          : undefined
      }
    >
      {/* Header Section - Title and tags in clear rows to avoid overlap */}
      <Box
        sx={{
          background: isPsychometric
            ? showResults
              ? "var(--assessment-catalog-psychometric-header-done)"
              : `url(/images/psychometric-test.png) center/cover no-repeat, var(--assessment-catalog-psychometric-overlay)`
            : isManual
              ? showResults
                ? "var(--assessment-catalog-manual-header-done)"
                : "var(--assessment-catalog-manual-header-active)"
              : showResults
                ? "var(--assessment-catalog-auto-header-done)"
                : "var(--assessment-catalog-auto-header-active)",
          p: 2,
          pb: 2.5,
          position: "relative",
          minHeight: isPsychometric ? 120 : isManual ? 102 : 90,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Overlay for psychometric image */}
        {isPsychometric && !showResults && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "var(--assessment-catalog-psychometric-overlay)",
              zIndex: 0,
            }}
          />
        )}

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {/* Title and tags on one row: title wraps before hitting tags */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isRtl ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                flex: 1,
                minWidth: 0,
                color: showResults ? "var(--font-primary)" : "var(--font-light)",
                fontWeight: 700,
                fontSize: "1.0625rem",
                lineHeight: 1.35,
                wordBreak: "break-word",
                overflowWrap: "break-word",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {stripHtmlTags(assessment.title || "").trim() || assessment.title || "\u00A0"}
            </Typography>
            {(assessment.proctoring_enabled || showResults || isManual) && (
              <Box
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: isRtl ? "row-reverse" : "row",
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                  justifyContent: isRtl ? "flex-end" : "flex-start",
                }}
              >
                {isManual && (
                  <Chip
                    icon={<IconWrapper icon="mdi:account-school-outline" size={14} />}
                    label={t("assessments.manualEvaluationBadge")}
                    size="small"
                    sx={{
                      backgroundColor: showResults
                        ? "var(--assessment-catalog-manual-chip-done-bg)"
                        : "color-mix(in srgb, var(--font-light) 22%, transparent)",
                      color: showResults
                        ? "var(--font-primary)"
                        : "var(--assessment-catalog-manual-chip-light-fg)",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 24,
                      flexDirection: isRtl ? "row-reverse" : "row",
                      border: showResults
                        ? "1px solid var(--assessment-catalog-manual-chip-done-border)"
                        : "1px solid var(--assessment-catalog-manual-chip-light-border)",
                      "& .MuiChip-icon": {
                        color: "inherit",
                        marginInlineStart: isRtl ? "4px" : 0,
                        marginInlineEnd: isRtl ? 0 : "4px",
                      },
                    }}
                  />
                )}
                {assessment.proctoring_enabled && (
                  <Chip
                    icon={<IconWrapper icon="mdi:shield-account" size={14} />}
                    label={t("assessments.proctored")}
                    size="small"
                    sx={{
                      backgroundColor: showResults
                        ? "color-mix(in srgb, var(--warning-500) 18%, transparent)"
                        : "color-mix(in srgb, var(--font-light) 25%, transparent)",
                      color: showResults ? "var(--font-primary)" : "var(--font-light)",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 24,
                      flexDirection: isRtl ? "row-reverse" : "row",
                      border: showResults
                        ? "1px solid color-mix(in srgb, var(--warning-500) 36%, transparent)"
                        : "1px solid color-mix(in srgb, var(--font-light) 42%, transparent)",
                      "& .MuiChip-icon": {
                        color: "inherit",
                        marginInlineStart: isRtl ? "4px" : 0,
                        marginInlineEnd: isRtl ? 0 : "4px",
                      },
                    }}
                  />
                )}
                {showResults && (
                  <Chip
                    icon={<IconWrapper icon="mdi:check-circle" size={14} />}
                    label={t("assessments.completed")}
                    size="small"
                    sx={{
                      backgroundColor: showResults
                        ? "color-mix(in srgb, var(--success-500) 18%, transparent)"
                        : "color-mix(in srgb, var(--font-light) 25%, transparent)",
                      color: showResults ? "var(--font-primary)" : "var(--font-light)",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 24,
                      flexDirection: isRtl ? "row-reverse" : "row",
                      border: showResults
                        ? "1px solid color-mix(in srgb, var(--success-500) 36%, transparent)"
                        : "1px solid color-mix(in srgb, var(--font-light) 42%, transparent)",
                      "& .MuiChip-icon": {
                        color: "inherit",
                        marginInlineStart: isRtl ? "4px" : 0,
                        marginInlineEnd: isRtl ? 0 : "4px",
                      },
                    }}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Subtitle / instructions */}
          <Typography
            variant="body2"
            sx={{
              color: showResults ? "var(--font-secondary)" : "color-mix(in srgb, var(--font-light) 90%, transparent)",
              fontSize: "0.8125rem",
              minHeight: 18,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {(stripHtmlTags(assessment.instructions || "").trim() || "\u00A0")}
          </Typography>

          {/* Psychometric tags */}
          {isPsychometric && psychometricTags.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 0.5,
              }}
            >
              {psychometricTags.slice(0, 3).map((tag, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    backgroundColor: showResults
                      ? `${tag.color}10`
                      : "color-mix(in srgb, var(--font-light) 20%, transparent)",
                    color: showResults ? tag.color : "var(--font-light)",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    border: showResults
                      ? `1.5px solid ${tag.color}30`
                      : "1.5px solid color-mix(in srgb, var(--font-light) 42%, transparent)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: showResults
                        ? `${tag.color}20`
                        : "color-mix(in srgb, var(--font-light) 30%, transparent)",
                      transform: "translateY(-1px)",
                      boxShadow: showResults
                        ? `0 2px 8px ${tag.color}25`
                        : "0 2px 8px color-mix(in srgb, var(--font-light) 22%, transparent)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: showResults ? tag.color : "var(--font-light)",
                      boxShadow: showResults
                        ? `0 0 4px ${tag.color}50`
                        : "0 0 4px color-mix(in srgb, var(--font-light) 52%, transparent)",
                    }}
                  />
                  <span>{tag.name}</span>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <CardContent
        sx={{
          flexGrow: 1,
          p: 2,
          pt: 1.5,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Description - Always same height */}
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-secondary)",
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            mb: 2,
            minHeight: 38,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {(stripHtmlTags(assessment.description || "").trim() || "\u00A0")}
        </Typography>

        {/* Stats Grid - RTL: column order flips (Duration right, Questions left) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1.5,
            mb: 2,
            minHeight: 60,
            ...(isRtl && { direction: "rtl" }),
          }}
        >
          {/* Duration - RTL: icon to the left of value */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isRtl ? "row-reverse" : "row",
              alignItems: "center",
              gap: 0.75,
              p: 1.25,
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-default)",
              ...(isManual && {
                borderColor: "var(--assessment-catalog-manual-stat-border)",
                backgroundColor: "var(--assessment-catalog-manual-stat-bg)",
              }),
              borderRadius: 1.5,
            }}
          >
            <IconWrapper icon="mdi:clock-outline" size={18} color={statIconColor} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-tertiary)",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                Duration
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "var(--font-primary)",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  lineHeight: 1.2,
                }}
              >
                {assessment.duration_minutes} min
              </Typography>
            </Box>
          </Box>

          {/* Questions - RTL: icon to the left of value */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isRtl ? "row-reverse" : "row",
              alignItems: "center",
              gap: 0.75,
              p: 1.25,
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-default)",
              ...(isManual && {
                borderColor: "var(--assessment-catalog-manual-stat-border)",
                backgroundColor: "var(--assessment-catalog-manual-stat-bg)",
              }),
              borderRadius: 1.5,
            }}
          >
            <IconWrapper
              icon="mdi:help-circle-outline"
              size={18}
              color={statIconColor}
            />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-tertiary)",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                {t("assessments.questions")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "var(--font-primary)",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  lineHeight: 1.2,
                }}
              >
                {assessment.number_of_questions}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* CTA Button */}
        <Box sx={{ mt: "1" }}>
          {!isClickable && startDate && remainingTime && !showResults ? (
            <Tooltip
              title={remainingTime}
              arrow
              placement="top"
              enterDelay={300}
              leaveDelay={0}
            >
              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={!isClickable}
                disableRipple
                endIcon={
                  <IconWrapper
                    icon={
                      submissionComplete && showResults
                        ? "mdi:eye-outline"
                        : submissionComplete && !showResults
                          ? "mdi:check-circle-outline"
                          : !isClickable
                            ? "mdi:clock-outline"
                            : "mdi:play-circle-outline"
                    }
                    size={18}
                    color="currentColor"
                  />
                }
                sx={ctaButtonSx}
              >
                {buttonLabel}
              </Button>
            </Tooltip>
          ) : (
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={!isClickable}
              disableRipple
              endIcon={
                <IconWrapper
                  icon={
                    submissionComplete && showResults
                      ? "mdi:eye-outline"
                      : submissionComplete && !showResults
                        ? "mdi:check-circle-outline"
                        : !isClickable
                          ? "mdi:clock-outline"
                          : "mdi:play-circle-outline"
                  }
                  size={18}
                  color="currentColor"
                />
              }
              sx={ctaButtonSx}
            >
              {buttonLabel}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
    </>
  );
};
