"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Assessment } from "@/lib/services/assessment.service";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import {
  isPsychometricAssessment,
  getPsychometricTags,
} from "@/lib/utils/psychometric-utils";
import { stripHtmlTags } from "@/lib/utils/html-utils";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/common/Toast";
import { isMobileOrTabletForAssessment } from "@/lib/utils/assessment-device.utils";
import { isCurrentDeviceAllowedForAssessment, allowedDeviceLabels } from "@/lib/utils/assessment-device";
import { AssessmentDesktopOnlyDialog } from "@/components/assessment/AssessmentDesktopOnlyGate";
import {
  isLearnerAssessmentSubmissionComplete,
  normalizeLearnerAssessmentStatus,
} from "@/lib/utils/assessment-learner-status";
import { StatusChip, type ChipTone } from "@/components/admin/assessment/shared";

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
  const { showToast } = useToast();
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
  /** Which CTA is mid-navigation. Component unmounts on route change, so we
      never need to reset this back to null. */
  const [loadingAction, setLoadingAction] = useState<"primary" | "reattempt" | null>(null);
  
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
        isClickable: false,
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
    if (!isClickable || loadingAction) return;
    if (submissionComplete && showResults) {
      setLoadingAction("primary");
      router.push(`/assessments/result/${assessment.slug}`);
      return;
    }
    if (!isCurrentDeviceAllowedForAssessment(assessment)) {
      const allowed = allowedDeviceLabels(assessment);
      const allowedList = allowed.map((d) => t(`assessmentDevice.classNames.${d}`, d)).join(", ");
      showToast(t("assessmentDevice.learnerAlertBody", { types: allowedList }), "warning");
      setDesktopOnlyOpen(true);
      return;
    }
    setLoadingAction("primary");
    router.push(`/assessments/${assessment.slug}`);
  };

  return (
    <>
      <AssessmentDesktopOnlyDialog
        open={desktopOnlyOpen}
        onClose={() => setDesktopOnlyOpen(false)}
        allowedTypes={allowedDeviceLabels(assessment)}
      />
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          p: 2.5,
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-card)",
          boxShadow: "none",
          overflow: "hidden",
          cursor: isClickable ? "pointer" : "default",
          transition: "box-shadow .2s, transform .2s, border-color .2s",
          ...(isClickable && {
            "&:hover": {
              borderColor:
                "color-mix(in srgb, var(--ai-violet) 30%, var(--border-default))",
            },
          }),
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
        {/* Row 1 - status pill (left) + attribute chips (right) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isRtl ? "row-reverse" : "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {(() => {
            let label = "Available";
            let tone: ChipTone = "success";
            const now = Date.now();
            const end = parseDateTime(assessment.end_time);
            if (submissionComplete && showResults) {
              label = "Completed";
              tone = "success";
            } else if (submissionComplete && !showResults) {
              label = "Under review";
              tone = "warning";
            } else if (isExpired) {
              label = "Expired";
              tone = "error";
            } else if (!canStartNow) {
              label = "Scheduled";
              tone = "info";
            } else if (normalizedStatus === "in_progress") {
              label = "In progress";
              tone = "warning";
            } else if (end && end.getTime() - now <= 3 * 86400000) {
              label = "Due soon";
              tone = "warning";
            }
            return <StatusChip label={label} tone={tone} />;
          })()}

          <Box
            sx={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              justifyContent: isRtl ? "flex-start" : "flex-end",
            }}
          >
            {assessment.proctoring_enabled && (
              <StatusChip
                label="Proctored"
                tone="proctored"
                icon="mdi:shield-check"
              />
            )}
            {isManual && <StatusChip label="Manual eval" tone="info" />}
            {isPsychometric && <StatusChip label="Psychometric" tone="ai" />}
            {assessment.is_paid && <StatusChip label="Paid" tone="neutral" />}
          </Box>
        </Box>

        {/* Title + subtitle */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.0625rem",
              lineHeight: 1.35,
              color: "var(--font-primary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {stripHtmlTags(assessment.title || "").trim() ||
              assessment.title ||
              " "}
          </Typography>

          {(() => {
            const subtitle =
              isPsychometric && psychometricTags.length > 0
                ? psychometricTags
                    .slice(0, 3)
                    .map((tag) => tag.name)
                    .join(" · ")
                : stripHtmlTags(assessment.description || "").trim();
            if (!subtitle) return null;
            return (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexDirection: isRtl ? "row-reverse" : "row",
                  minWidth: 0,
                }}
              >
                <Box
                  component="span"
                  sx={{ display: "inline-flex", flexShrink: 0 }}
                >
                  <IconWrapper
                    icon="mdi:book-outline"
                    size={14}
                    color="var(--font-secondary)"
                  />
                </Box>
                <Typography
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.8125rem",
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>
            );
          })()}
        </Box>

        {/* Mini-stats strip */}
        {(() => {
          const cells: Array<{ value: string | number; label: string }> = [
            { value: assessment.number_of_questions, label: "Questions" },
            { value: `${assessment.duration_minutes}m`, label: "Duration" },
          ];
          if (assessment.number_of_sections != null) {
            cells.push({
              value: assessment.number_of_sections,
              label: "Sections",
            });
          }
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "12px",
                p: 1.25,
              }}
            >
              {cells.map((cell, i) => (
                <Box
                  key={cell.label}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: "center",
                    px: 1,
                    ...(i > 0 && {
                      borderInlineStart: "1px solid var(--border-default)",
                    }),
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      lineHeight: 1.2,
                      color: "var(--font-primary)",
                    }}
                  >
                    {cell.value}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.25,
                      fontSize: "0.68rem",
                      letterSpacing: "0.02em",
                      color: "var(--font-tertiary)",
                    }}
                  >
                    {cell.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        })()}

        {/* Due / availability */}
        {(() => {
          const now = Date.now();
          const start = parseDateTime(assessment.start_time);
          const end = parseDateTime(assessment.end_time);
          const futureStart =
            !canStartNow && start !== null && start.getTime() > now;

          let mainText: string;
          let daysLeft: number | null = null;
          if (futureStart) {
            mainText = availabilityLabel;
          } else if (isExpired) {
            mainText = "Ended";
          } else if (end) {
            daysLeft = Math.ceil((end.getTime() - now) / 86400000);
            mainText = `Due ${end.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })} · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
          } else {
            mainText = "No deadline";
          }

          const dueSoon = daysLeft !== null && daysLeft <= 2 && !isExpired;
          const lineColor = dueSoon
            ? "var(--error-500)"
            : "var(--font-secondary)";

          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexDirection: isRtl ? "row-reverse" : "row",
                }}
              >
                <Box
                  component="span"
                  sx={{ display: "inline-flex", flexShrink: 0 }}
                >
                  <IconWrapper
                    icon="mdi:calendar-outline"
                    size={16}
                    color={lineColor}
                  />
                </Box>
                <Typography
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: dueSoon ? 600 : 500,
                    color: lineColor,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mainText}
                </Typography>
              </Box>
              {dueSoon ? (
                <Typography
                  sx={{
                    ...(isRtl ? { pr: 3 } : { pl: 3 }),
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--error-500)",
                  }}
                >
                  · due soon
                </Typography>
              ) : end ? (
                <Typography
                  sx={{
                    ...(isRtl ? { pr: 3 } : { pl: 3 }),
                    fontSize: "0.7rem",
                    color: "var(--font-tertiary)",
                  }}
                >
                  ✱ On track
                </Typography>
              ) : null}
            </Box>
          );
        })()}

        {/* Spacer pins the CTAs to the bottom */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {submissionComplete && assessment.can_reattempt && (
            <LoadingButton
              fullWidth
              variant="outlined"
              size="large"
              disableRipple
              loading={loadingAction === "reattempt"}
              disabled={loadingAction !== null && loadingAction !== "reattempt"}
              onClick={(e) => {
                e.stopPropagation();
                if (loadingAction) return;
                setLoadingAction("reattempt");
                router.push(`/assessments/${assessment.slug}`);
              }}
              endIcon={
                loadingAction === "reattempt" ? undefined : (
                  <IconWrapper icon="mdi:replay" size={18} color="currentColor" />
                )
              }
              sx={{
                flexDirection: isRtl ? "row-reverse" : "row",
                width: "100%",
                py: 1.1,
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.9rem",
                textTransform: "none",
                background: "var(--assessment-catalog-reattempt-cta-gradient)",
                color: "var(--font-light)",
                border: "none",
                boxShadow: "var(--assessment-catalog-reattempt-cta-shadow)",
                WebkitTapHighlightColor: "transparent",
                transition: "box-shadow .2s ease, transform .2s ease",
                "& .MuiButton-endIcon": { color: "inherit" },
                "&&:hover": {
                  background:
                    "var(--assessment-catalog-reattempt-cta-hover-gradient)",
                  color: "var(--font-light)",
                  border: "none",
                },
                "&&:active": {
                  transform: "translateY(0)",
                  background:
                    "var(--assessment-catalog-reattempt-cta-hover-gradient)",
                },
              }}
            >
              {t("assessments.reattempt", { defaultValue: "Re-attempt" })}
            </LoadingButton>
          )}

          {(() => {
            const disabledLook =
              (submissionComplete && !showResults) || !isClickable;
            const bg = showResults
              ? "var(--success-500)"
              : disabledLook
                ? "var(--surface)"
                : "var(--gradient-ai)";
            const textColor = disabledLook
              ? "var(--font-tertiary)"
              : "var(--font-light)";
            const idleShadow =
              !showResults && !disabledLook
                ? "0 10px 24px -10px color-mix(in srgb, var(--ai-violet) 45%, transparent)"
                : "none";
            const hoverShadow = showResults
              ? "0 12px 26px -10px color-mix(in srgb, var(--success-500) 50%, transparent)"
              : "0 14px 30px -10px color-mix(in srgb, var(--ai-violet) 60%, transparent)";

            const primaryButton = (
              <LoadingButton
                fullWidth
                variant="contained"
                size="large"
                disableRipple
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                loading={loadingAction === "primary"}
                disabled={
                  !isClickable ||
                  (loadingAction !== null && loadingAction !== "primary")
                }
                endIcon={
                  isClickable ? (
                    <IconWrapper
                      icon="mdi:arrow-right"
                      size={18}
                      color="currentColor"
                    />
                  ) : undefined
                }
                sx={{
                  flexDirection: isRtl ? "row-reverse" : "row",
                  width: "100%",
                  py: 1.1,
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  textTransform: "none",
                  color: textColor,
                  background: bg,
                  boxShadow: idleShadow,
                  WebkitTapHighlightColor: "transparent",
                  transition: "box-shadow .2s ease, transform .2s ease",
                  "& .MuiButton-endIcon": { color: "inherit" },
                  ...(isClickable && {
                    "&&:hover": {
                      background: bg,
                      color: textColor,
                    },
                    "&&:active": { transform: "translateY(0)" },
                  }),
                  "&.Mui-disabled": {
                    background: "var(--surface)",
                    color: "var(--font-tertiary)",
                    boxShadow: "none",
                  },
                }}
              >
                {buttonLabel}
              </LoadingButton>
            );

            if (!isClickable && startDate && remainingTime && !showResults) {
              return (
                <Tooltip
                  title={remainingTime}
                  arrow
                  placement="top"
                  enterDelay={300}
                  leaveDelay={0}
                >
                  {primaryButton}
                </Tooltip>
              );
            }
            return primaryButton;
          })()}
        </Box>
      </Card>
    </>
  );
};
