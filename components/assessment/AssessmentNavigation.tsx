"use client";

import { Box, Paper, Typography, Button, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatMmSs } from "@/lib/utils/formatMmSs";
import { getSectionTimeCapTotalSeconds } from "@/utils/assessment.utils";

interface AssessmentNavigationProps {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  sections: Array<{
    title?: string;
    section_type?: string;
    questions?: Array<any>;
    time_limit_minutes?: number;
  }>;
  currentSectionQuestionCount: number;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSectionChange?: (sectionIndex: number) => void;
  /** When false, section chips are read-only; only Next at end of section changes section. Default true. */
  allowMovementAcrossSections?: boolean;
  /** Client countdown for current section when API sent `time_limit_minutes` (>0). */
  sectionTimeRemainingSeconds?: number | null;
  /** With fixed section order: show escape hatch before last question of section. */
  showAdvanceToNextSection?: boolean;
  onAdvanceToNextSection?: () => void;
  /** Bumps when timed-section completion set changes so tabs and Previous re-render. */
  timedSectionLockRevision?: number;
  /** True for a section index that has a per-section timer and is already finished (no re-entry). */
  isTimedSectionClosed?: (sectionIndex: number) => boolean;
  /** Block Previous at first question when the previous timed section is closed. */
  blockCrossSectionPrevious?: boolean;
}

export const AssessmentNavigation = memo(function AssessmentNavigation({
  currentSectionIndex,
  currentQuestionIndex,
  totalQuestions,
  sections,
  isLastQuestion,
  onPrevious,
  onNext,
  onSectionChange,
  allowMovementAcrossSections = true,
  sectionTimeRemainingSeconds = null,
  showAdvanceToNextSection = false,
  onAdvanceToNextSection,
  timedSectionLockRevision = 0,
  isTimedSectionClosed,
  blockCrossSectionPrevious = false,
}: AssessmentNavigationProps) {
  const { t } = useTranslation("common");
  void timedSectionLockRevision;
  const sectionTabsInteractive = allowMovementAcrossSections && Boolean(onSectionChange);

  // Memoize question number calculation
  const questionNum = useMemo(() => {
    let num = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      num += sections[i]?.questions?.length || 0;
    }
    return num + currentQuestionIndex + 1;
  }, [currentSectionIndex, currentQuestionIndex, sections]);

  const previousDisabled =
    (currentQuestionIndex === 0 && currentSectionIndex === 0) ||
    (!allowMovementAcrossSections &&
      currentQuestionIndex === 0 &&
      currentSectionIndex > 0) ||
    blockCrossSectionPrevious;

  const previousTooltip = useMemo(() => {
    if (!previousDisabled) return "";
    if (blockCrossSectionPrevious) {
      return t("assessments.take.timedSectionCannotGoBack");
    }
    if (
      !allowMovementAcrossSections &&
      currentQuestionIndex === 0 &&
      currentSectionIndex > 0
    ) {
      return t("assessments.take.previousLockedSectionBoundary");
    }
    return t("assessments.take.previousDisabledFirst");
  }, [
    previousDisabled,
    blockCrossSectionPrevious,
    allowMovementAcrossSections,
    currentQuestionIndex,
    currentSectionIndex,
    t,
  ]);

  const nextTooltipWhenDisabled = useMemo(
    () => (isLastQuestion ? t("assessments.take.nextDisabledUseSubmit") : ""),
    [isLastQuestion, t]
  );

  const previousHoverTitle = previousDisabled
    ? previousTooltip
    : t("assessments.take.previousTooltipEnabled");

  const nextHoverTitle = isLastQuestion
    ? nextTooltipWhenDisabled
    : t("assessments.take.nextTooltipEnabled");

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        top: 90,
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: 1200,
        px: { xs: 2, md: 3 },
        py: 1.5,
        borderBottom: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: { xs: 1.5, md: 3 },
      }}
    >
      {/* Left: Question Counter & Section Tabs */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "var(--font-muted)",
            fontSize: "0.875rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Question {questionNum} of {totalQuestions}
        </Typography>

        {/* Section Tabs - Scroll when more than 6 sections instead of wrapping to 2 lines */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: sections.length > 6 ? "nowrap" : "wrap",
            overflowX: sections.length > 6 ? "auto" : "visible",
            overflowY: "hidden",
            maxHeight: sections.length > 6 ? "48px" : "none",
            "&::-webkit-scrollbar": {
              height: "4px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--border-light)",
              borderRadius: "2px",
            },
          }}
        >
          {sections.map((section, index) => {
            const questionsCount = section.questions?.length || 0;
            const isActive = index === currentSectionIndex;
            const sectionType = section.section_type || "quiz";
            const isCoding = sectionType === "coding";
            const isSubjective = sectionType === "subjective";

            const activeBorder = isCoding
              ? "var(--accent-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-accent)"
                : "var(--accent-purple)";
            const activeBg = isCoding
              ? "var(--surface-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-surface-active)"
                : "var(--surface-indigo-light)";
            const activeBgHover = isCoding
              ? "var(--primary-50)"
              : isSubjective
                ? "var(--assessment-subjective-surface-hover)"
                : "var(--primary-50)";
            const activeText = isCoding
              ? "var(--accent-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-fg)"
                : "var(--accent-purple)";
            const activeShadow = isCoding
              ? "0 2px 6px 0 color-mix(in srgb, var(--accent-blue-light) 18%, transparent)"
              : isSubjective
                ? "0 2px 6px 0 var(--assessment-subjective-shadow)"
                : "0 2px 6px 0 color-mix(in srgb, var(--accent-purple) 18%, transparent)";
            const activeShadowHover = isCoding
              ? "0 3px 8px 0 color-mix(in srgb, var(--accent-blue-light) 26%, transparent)"
              : isSubjective
                ? "0 3px 8px 0 var(--assessment-subjective-shadow-lg)"
                : "0 3px 8px 0 color-mix(in srgb, var(--accent-purple) 26%, transparent)";
            const borderHover = isCoding
              ? "var(--accent-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-accent-hover)"
                : "var(--accent-purple)";
            const iconName = isCoding
              ? "mdi:code-braces"
              : isSubjective
                ? "mdi:text-box-outline"
                : "mdi:clipboard-text";
            const defaultTitle =
              sectionType === "coding"
                ? "Coding"
                : sectionType === "subjective"
                  ? "Subjective"
                  : "Quiz";

            const sectionCapSec = getSectionTimeCapTotalSeconds(section);
            const hasPerSectionTimeCap =
              sectionCapSec != null && sectionCapSec > 0;

            const showSectionCountdown =
              isActive &&
              hasPerSectionTimeCap &&
              sectionTimeRemainingSeconds != null &&
              sectionTimeRemainingSeconds >= 0;

            const showNoSectionLimitHint =
              isActive && !hasPerSectionTimeCap;

            const tabClosedByTimer =
              Boolean(isTimedSectionClosed?.(index)) &&
              !isActive;
            const tabClickable =
              sectionTabsInteractive && !tabClosedByTimer;

            const tab = (
              <Box
                onClick={() => {
                  if (!tabClickable) return;
                  onSectionChange?.(index);
                }}
                sx={{
                  position: "relative",
                  display: "flex",
                  flexDirection:
                    showSectionCountdown || showNoSectionLimitHint
                      ? "column"
                      : "row",
                  alignItems: "center",
                  gap:
                    showSectionCountdown || showNoSectionLimitHint
                      ? 0.25
                      : 0.75,
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 0.75, md: 1 },
                  backgroundColor: isActive ? activeBg : "var(--card-bg)",
                  border: `2px solid ${
                    isActive ? activeBorder : "var(--border-default)"
                  }`,
                  borderRadius: 1.5,
                  cursor: tabClickable ? "pointer" : "not-allowed",
                  transition: "all 0.15s ease-out",
                  boxShadow: isActive
                    ? activeShadow
                    : "0 1px 2px 0 var(--surface-subtle)",
                  whiteSpace: "nowrap",
                  pointerEvents: "auto",
                  opacity: tabClosedByTimer ? 0.55 : 1,
                  "&:hover": tabClickable
                    ? {
                        borderColor: borderHover,
                        backgroundColor: isActive ? activeBgHover : "var(--surface)",
                        transform: "translateY(-1px)",
                        boxShadow: activeShadowHover,
                      }
                    : {
                        "& .section-tab-blocked-overlay": {
                          opacity: 1,
                        },
                      },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <IconWrapper
                    icon={iconName}
                    size={14}
                    color={isActive ? activeText : "var(--font-secondary)"}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: isActive ? activeText : "var(--font-secondary)",
                      fontSize: { xs: "0.7rem", md: "0.75rem" },
                      fontWeight: isActive ? 700 : 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {section.title || defaultTitle}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isActive
                        ? isCoding
                          ? "var(--accent-blue-light)"
                          : isSubjective
                            ? "var(--assessment-subjective-count)"
                            : "var(--accent-purple)"
                        : "var(--font-tertiary)",
                      fontSize: { xs: "0.65rem", md: "0.7rem" },
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    ({questionsCount})
                  </Typography>
                </Box>
                {showSectionCountdown && (
                  <Typography
                    variant="caption"
                    component="span"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.35,
                      color:
                        sectionTimeRemainingSeconds === 0
                          ? "error.main"
                          : isActive
                            ? activeText
                            : "var(--font-tertiary)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                  >
                    <IconWrapper icon="mdi:timer-sand" size={12} />
                    {sectionTimeRemainingSeconds === 0
                      ? t("assessments.take.sectionTimeExpired")
                      : formatMmSs(sectionTimeRemainingSeconds)}
                  </Typography>
                )}
                                                                                          
                {(!sectionTabsInteractive || tabClosedByTimer) && (
                  <Box
                    className="section-tab-blocked-overlay"
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.15s ease-out",
                      pointerEvents: "none",
                      borderRadius: "inherit",
                      backgroundColor: "color-mix(in srgb, var(--surface) 74%, transparent)",
                    }}
                  >
                    <IconWrapper icon="mdi:cancel" size={22} color="var(--error-600)" />
                  </Box>
                )}
              </Box>
            );

            if (!sectionTabsInteractive) {
              return (
                <Tooltip
                  key={index}
                  title={t("assessments.take.sectionTabsLocked")}
                  arrow
                >
                  <Box sx={{ display: "inline-flex" }}>{tab}</Box>
                </Tooltip>
              );
            }

            if (tabClosedByTimer) {
              return (
                <Tooltip
                  key={index}
                  title={t("assessments.take.timedSectionTabLocked")}
                  arrow
                >
                  <Box sx={{ display: "inline-flex" }}>{tab}</Box>
                </Tooltip>
              );
            }

            return (
              <Tooltip
                key={index}
                title={t("assessments.take.sectionChipGoTo")}
                arrow
              >
                <Box sx={{ display: "inline-flex" }}>{tab}</Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Current Question in Section Badge */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.5,
            backgroundColor: "var(--neutral-100)",
            borderRadius: 0.75,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {currentQuestionIndex + 1}/
            {sections[currentSectionIndex]?.questions?.length || 0}
          </Typography>
        </Box>
      </Box>

      {/* Right: Navigation Buttons */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexShrink: 0,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <Tooltip title={previousHoverTitle} arrow>
          <span
            style={{
              display: "inline-block",
            }}
          >
            <Button
              variant="outlined"
              onClick={onPrevious}
              disabled={previousDisabled}
              startIcon={<IconWrapper icon="mdi:chevron-left" size={18} />}
              sx={{
                borderColor: "var(--accent-indigo)",
                color: "var(--accent-indigo)",
                borderRadius: 1.5,
                px: 2.5,
                py: 1,
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "none",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: "var(--accent-indigo-dark)",
                  backgroundColor: "var(--surface-indigo-light)",
                  transform: "translateX(-2px)",
                },
                "&:disabled": {
                  borderColor: "var(--border-default)",
                  color: "var(--font-tertiary)",
                  transform: "none",
                  cursor: "not-allowed",
                  pointerEvents: "auto",
                },
              }}
            >
              {t("assessments.previous")}
            </Button>
          </span>
        </Tooltip>
        {showAdvanceToNextSection && onAdvanceToNextSection && (
          <Tooltip title={t("assessments.take.nextSectionButtonTooltip")} arrow>
            <span style={{ display: "inline-block" }}>
              <Button
                variant="outlined"
                color="warning"
                onClick={onAdvanceToNextSection}
                startIcon={<IconWrapper icon="mdi:arrow-right-bold-outline" size={18} />}
                sx={{
                  borderRadius: 1.5,
                  px: 2,
                  py: 1,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                {t("assessments.take.nextSection")}
              </Button>
            </span>
          </Tooltip>
        )}
        <Tooltip title={nextHoverTitle} arrow>
          <span style={{ display: "inline-block" }}>
            <Button
              variant="contained"
              onClick={onNext}
              disabled={isLastQuestion}
              endIcon={<IconWrapper icon="mdi:chevron-right" size={18} />}
              sx={{
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                borderRadius: 1.5,
                px: 3,
                py: 1,
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "none",
                boxShadow:
                  "0 2px 8px 0 color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                  boxShadow:
                    "0 4px 12px 0 color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
                  transform: "translateX(2px)",
                },
                "&:disabled": {
                  backgroundColor: "var(--border-default)",
                  color: "var(--font-tertiary)",
                  boxShadow: "none",
                  transform: "none",
                  cursor: "not-allowed",
                  pointerEvents: "auto",
                },
              }}
            >
              {t("assessments.next")}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  );
});
