"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  assessmentService,
  AssessmentDetail,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentDesktopOnlyDialog } from "@/components/assessment/AssessmentDesktopOnlyGate";
import { LoadingButton } from "@/components/common/LoadingButton";
import { isCurrentDeviceAllowedForAssessment, allowedDeviceLabels } from "@/lib/utils/assessment-device";
import { AssessmentDeviceStatusPanel } from "@/components/assessment/AssessmentDeviceStatusPanel";
import { AssessmentReadinessPanel } from "@/components/assessment/AssessmentReadinessPanel";
import { StatusChip, StatStrip } from "@/components/admin/assessment/shared";
import { stripHtmlTags } from "@/lib/utils/html-utils";

function parseAssessmentStartTime(
  s: string | undefined | null
): Date | null {
  if (!s || typeof s !== "string" || !s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** One rule row on the "Rules for this attempt" card. */
interface AttemptRule {
  icon: string;
  title: string;
  description: string;
}

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = useTranslation("common");
  const { slug } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [desktopOnlyOpen, setDesktopOnlyOpen] = useState(false);
  const { showToast } = useToast();
  const [startTimeTick, setStartTimeTick] = useState(0);
  const [consented, setConsented] = useState(false);

  const assessmentStartAt = useMemo(
    () => parseAssessmentStartTime(assessment?.start_time),
    [assessment?.start_time]
  );

  const canStartAssessment = useMemo(() => {
    void startTimeTick;
    if (!assessmentStartAt) return true;
    return Date.now() >= assessmentStartAt.getTime();
  }, [assessmentStartAt, startTimeTick]);

  // Treat both 'submitted' and 'finalized' as "already submitted" — backend
  // normalizes finalized→submitted in most responses but not all, so guard both.
  const isAlreadySubmitted =
    assessment?.status === "submitted" || assessment?.status === "finalized";

  const assessmentEndAt = useMemo(
    () => parseAssessmentStartTime(assessment?.end_time),
    [assessment?.end_time],
  );

  // Expired = end_time is in the past AND the learner did not submit before
  // it closed. A submitted-then-expired assessment is "submitted", not expired.
  const isExpired = useMemo(() => {
    if (!assessmentEndAt) return false;
    if (isAlreadySubmitted) return false;
    return Date.now() > assessmentEndAt.getTime();
  }, [assessmentEndAt, isAlreadySubmitted]);

  const expiredOnLabel = useMemo(() => {
    if (!assessmentEndAt) return "";
    return assessmentEndAt.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [assessmentEndAt]);

  useEffect(() => {
    if (!assessmentStartAt) return;
    if (Date.now() >= assessmentStartAt.getTime()) return;

    const id = setInterval(() => {
      setStartTimeTick((n) => n + 1);
      if (Date.now() >= assessmentStartAt.getTime()) {
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [assessmentStartAt]);


  useEffect(() => {
    if (!slug) return;

    let isCancelled = false;

    const loadData = async () => {
      if (isCancelled) return;
      await loadAssessmentDetail();
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const loadAssessmentDetail = async () => {
    try {
      const data = await assessmentService.getAssessmentDetail(slug);

      setAssessment(data);
    } catch (error: any) {
      showToast(t("assessments.failedToLoadDetails"), "error");
    } finally {
      setLoading(false);
    }
  };

  const canReattempt = assessment?.can_reattempt === true;

  const handleStart = () => {
    if (!assessment) return;

    // SECURITY: never re-enter the take flow if this assessment is already
    // submitted/finalized — UNLESS an admin has granted this learner a
    // retake (can_reattempt). In that case fall through; the backend
    // start-assessment endpoint consumes the grant atomically when a new
    // submission is created.
    if (isAlreadySubmitted && !canReattempt) {
      showToast("This assessment has already been submitted", "warning");
      router.replace(`/assessments/${slug}/submission-success`);
      return;
    }

    if (!isCurrentDeviceAllowedForAssessment(assessment)) {
      const allowed = allowedDeviceLabels(assessment);
      const allowedList = allowed.map((d) => t(`assessmentDevice.classNames.${d}`, d)).join(", ");
      showToast(t("assessmentDevice.learnerAlertBody", { types: allowedList }), "warning");
      setDesktopOnlyOpen(true);
      return;
    }

    if (assessment.proctoring_enabled === false) {
      router.push(`/assessments/${slug}/take`);
    } else {
      router.push(`/assessments/${slug}/device-check`);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
            py: 8,
          }}
        >
          <CircularProgress size={40} sx={{ color: "var(--accent-indigo)" }} />
        </Box>
      </MainLayout>
    );
  }

  if (!assessment) {
    return (
      <MainLayout>
        <Container>
          <Typography>{t("assessments.failedToLoadDetails")}</Typography>
        </Container>
      </MainLayout>
    );
  }

  const deviceAllowed = isCurrentDeviceAllowedForAssessment(assessment);

  // ── Derived, display-only view data (no behavior change) ────────────────
  const proctored = assessment.proctoring_enabled === true;
  const eyebrow =
    assessment.course_title ||
    assessment.courseTitle ||
    assessment.certificate_course_name ||
    "";
  const sectionsCount =
    assessment.sections?.length || assessment.number_of_sections || 0;
  const instructionsText = stripHtmlTags(assessment.instructions || "").trim();
  const descriptionText = (assessment.description || "").trim();
  const passingPercent = assessment.pass_band_lower_min_percent ?? null;
  const closesOnLabel = assessmentEndAt
    ? assessmentEndAt.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const statItems = [
    { label: "Questions", value: assessment.number_of_questions ?? 0, icon: "mdi:help-circle-outline", tone: "var(--ai-violet)" },
    { label: "Duration", value: `${assessment.duration_minutes}m`, icon: "mdi:clock-outline", tone: "var(--accent-indigo)" },
    { label: "Sections", value: sectionsCount, icon: "mdi:view-dashboard-outline", tone: "var(--accent-blue-light)" },
    { label: "Attempts", value: canReattempt ? "1 / 2" : "1", icon: "mdi:replay", tone: "var(--ai-pink)" },
  ];

  // Rules built from the assessment's real settings.
  const rules: AttemptRule[] = [];
  if (proctored) {
    rules.push({
      icon: "mdi:webcam",
      title: "Webcam & periodic snapshots",
      description:
        "Your camera stays on for the attempt. We run a quick face check before you start and capture periodic snapshots as proof.",
    });
    rules.push({
      icon: "mdi:fullscreen",
      title: "Fullscreen required",
      description:
        "The attempt runs in fullscreen. Leaving fullscreen is recorded — you'll be prompted to return or submit.",
    });
  }
  if (assessment.tab_switch_limit_enabled || proctored) {
    rules.push({
      icon: "mdi:cursor-move",
      title: "No tab-switching or copy-paste",
      description:
        assessment.tab_switch_limit_enabled && assessment.tab_switch_limit_count
          ? `Switching tabs or windows is flagged (limit: ${assessment.tab_switch_limit_count}). Copy and paste are disabled during the attempt.`
          : "Switching tabs or windows is flagged. Copy and paste are disabled during the attempt.",
    });
  }
  if (assessment.allow_movement === false) {
    rules.push({
      icon: "mdi:routes",
      title: "Fixed section order",
      description:
        "Sections are locked to a set order — you can't jump freely between them once you move on.",
    });
  }
  rules.push({
    icon: "mdi:calculator-variant-outline",
    title: "On-screen calculator provided",
    description:
      "A calculator is available inside the attempt when you need it — no external tools required.",
  });
  rules.push({
    icon: "mdi:flag-outline",
    title: "Flag questions for review",
    description:
      "Mark any question to revisit later, then jump back to your flagged items before you submit.",
  });

  const ctaLabel = isExpired
    ? t("assessments.expired")
    : canReattempt && isAlreadySubmitted
    ? t("assessments.reattempt", { defaultValue: "Re-attempt" })
    : isAlreadySubmitted
    ? t("assessments.alreadySubmitted", { defaultValue: "Already submitted" })
    : "Continue to device check →";

  const ctaIcon = isExpired
    ? "mdi:clock-alert-outline"
    : canReattempt && isAlreadySubmitted
    ? "mdi:replay"
    : isAlreadySubmitted
    ? "mdi:check-circle-outline"
    : "mdi:play-circle-outline";

  const ctaDisabled =
    isExpired ||
    (isAlreadySubmitted && !canReattempt) ||
    !canStartAssessment ||
    (proctored && !consented);

  return (
    <MainLayout fullWidthContent>
      <AssessmentDesktopOnlyDialog
        open={desktopOnlyOpen}
        onClose={() => setDesktopOnlyOpen(false)}
        allowedTypes={allowedDeviceLabels(assessment)}
      />
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          maxWidth: "1400px",
          mx: "auto",
        }}
      >
        {/* Back link */}
        <LoadingButton
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/assessments")}
          sx={{
            mb: 2.5,
            color: "var(--font-secondary)",
            textTransform: "none",
            fontWeight: 600,
            px: 1,
            "&:hover": {
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
              color: "var(--accent-indigo)",
            },
          }}
        >
          Back to assessments
        </LoadingButton>

        {/* Banner header — assessment-management design language (dark gradient band) */}
        <Box
          sx={{
            mb: 3,
            position: "relative",
            overflow: "hidden",
            borderRadius: "22px",
            p: { xs: 3, md: 4 },
            color: "#fff",
            background:
              "linear-gradient(115deg, #2b1244 0%, #3d1663 45%, #6b1a52 82%, #7d2058 100%)",
            boxShadow: "0 28px 56px -28px rgba(61, 22, 99, 0.55)",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              mb: 1.75,
              background: "var(--gradient-ai)",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
            }}
          >
            <IconWrapper icon="mdi:clipboard-text-outline" size={14} color="#fff" />
            {eyebrow ? String(eyebrow).toUpperCase() : "ASSESSMENT"}
          </Box>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              lineHeight: 1.15,
              fontSize: { xs: "1.6rem", md: "2.15rem" },
            }}
          >
            {assessment.title}
          </Typography>
          {descriptionText && (
            <Typography
              sx={{
                mt: 1.25,
                color: "color-mix(in srgb, #fff 82%, transparent)",
                lineHeight: 1.6,
                maxWidth: 820,
                fontSize: "0.95rem",
              }}
            >
              {descriptionText}
            </Typography>
          )}
        </Box>

        {/* Attribute chips + metric strip on the canvas */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
          {proctored && (
            <StatusChip label="Proctored" tone="proctored" icon="mdi:shield-check" />
          )}
          <StatusChip label="Non-adaptive · same for all" tone="neutral" />
        </Box>
        <Box sx={{ mb: 3 }}>
          <StatStrip items={statItems} />
        </Box>

        {/* Two-column: main + sidebar */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 352px" },
            gap: { xs: 2.5, md: 3 },
            alignItems: "start",
          }}
        >
          {/* MAIN column */}
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Rules for this attempt */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border-default)",
                bgcolor: "var(--card-bg)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--gradient-ai-soft)",
                    color: "var(--ai-violet)",
                  }}
                >
                  <IconWrapper icon="mdi:shield-check" size={22} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--font-primary)" }}>
                    Rules for this attempt
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)" }}>
                    Read these before you start — some are enforced automatically.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {rules.map((rule, i) => (
                  <Box
                    key={rule.title}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.75,
                      borderTop: i === 0 ? "none" : "1px solid var(--border-default)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1.5,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface))",
                        color: "var(--accent-indigo)",
                      }}
                    >
                      <IconWrapper icon={rule.icon} size={18} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", fontSize: "0.925rem" }}>
                        {rule.title}
                      </Typography>
                      <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", lineHeight: 1.55, mt: 0.25 }}>
                        {rule.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* What you'll cover */}
            {(instructionsText || (assessment.sections && assessment.sections.length > 0)) && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: "var(--radius-card)",
                  border: "1px solid var(--border-default)",
                  bgcolor: "var(--card-bg)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <IconWrapper icon="mdi:book-open-page-variant-outline" size={22} color="var(--ai-violet)" />
                  <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--font-primary)" }}>
                    What you&apos;ll cover
                  </Typography>
                </Box>

                {instructionsText && (
                  <Typography
                    sx={{
                      color: "var(--font-secondary)",
                      lineHeight: 1.7,
                      mb: assessment.sections && assessment.sections.length > 0 ? 2.5 : 0,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {instructionsText}
                  </Typography>
                )}

                {assessment.sections && assessment.sections.length > 0 && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {assessment.sections.map((section: any, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "var(--surface)",
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              flexShrink: 0,
                              display: "grid",
                              placeItems: "center",
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              bgcolor: "color-mix(in srgb, var(--ai-violet) 14%, var(--surface))",
                              color: "var(--ai-violet)",
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                            {section.title || `Section ${index + 1}`}
                          </Typography>
                        </Box>
                        {section.description && (
                          <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mt: 0.75, lineHeight: 1.55 }}>
                            {section.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            )}

            {/* Expired / re-attempt alerts (preserved) */}
            {isExpired && (
              <Alert
                severity="error"
                icon={<IconWrapper icon="mdi:clock-alert-outline" size={22} />}
                sx={{ borderRadius: "var(--radius-card)", fontWeight: 500 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {t("assessments.expiredHeading", {
                    defaultValue: "This assessment has expired",
                  })}
                </Typography>
                <Typography variant="body2">
                  {expiredOnLabel
                    ? t("assessments.expiredOn", {
                        defaultValue: "The submission window closed on {{date}}.",
                        date: expiredOnLabel,
                      })
                    : t("assessments.expiredGeneric", {
                        defaultValue: "The submission window for this assessment has closed.",
                      })}
                </Typography>
              </Alert>
            )}

            {canReattempt && isAlreadySubmitted && !isExpired && (
              <Alert
                severity="info"
                icon={<IconWrapper icon="mdi:replay" size={22} />}
                sx={{ borderRadius: "var(--radius-card)" }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {t("assessments.reattemptHeading", {
                    defaultValue: "Re-attempt available",
                  })}
                </Typography>
                <Typography variant="body2">
                  {t("assessments.reattemptHelp", {
                    defaultValue:
                      "An admin has granted you a re-attempt for this assessment. Starting again will replace your previous score with the new attempt's score.",
                  })}
                </Typography>
              </Alert>
            )}
          </Box>

          {/* RIGHT sidebar */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              position: { md: "sticky" },
              top: { md: 16 },
              alignSelf: "start",
            }}
          >
            {/* AI Readiness Check */}
            <AssessmentReadinessPanel slug={slug} />

            {/* Scoring & policy */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border-default)",
                bgcolor: "var(--card-bg)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.75 }}>
                <IconWrapper icon="mdi:scale-balance" size={20} color="var(--accent-indigo)" />
                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "var(--font-primary)" }}>
                  Scoring & policy
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                  <IconWrapper icon="mdi:equalizer-outline" size={17} color="var(--font-tertiary)" />
                  <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", lineHeight: 1.55 }}>
                    Questions are fixed and non-adaptive — everyone gets the same set. Your score is the total of marks earned.
                  </Typography>
                </Box>

                {passingPercent != null && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                    <IconWrapper icon="mdi:trophy-outline" size={17} color="var(--font-tertiary)" />
                    <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", lineHeight: 1.55 }}>
                      Passing score:{" "}
                      <Box component="span" sx={{ fontWeight: 700, color: "var(--font-primary)", fontFamily: "var(--font-mono)" }}>
                        {passingPercent}%
                      </Box>
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                  <IconWrapper icon="mdi:calendar-clock" size={17} color="var(--font-tertiary)" />
                  <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", lineHeight: 1.55 }}>
                    {closesOnLabel
                      ? `Submissions close on ${closesOnLabel}. Anything submitted after the window is not accepted — there's no late-submission grace.`
                      : "Once you start, the timer runs continuously and can't be paused. Submit before it reaches zero."}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Device readiness (preserved) */}
            <AssessmentDeviceStatusPanel assessment={assessment} sx={{ mb: 0 }} />
          </Box>
        </Box>

        {/* Consent + CTA — full-width action bar below the two columns */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: { xs: 2.5, sm: 3 },
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            boxShadow: "0 2px 10px color-mix(in srgb, var(--font-primary) 7%, transparent)",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { md: "center" },
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {proctored && (
              <FormControlLabel
                sx={{
                  alignItems: "flex-start",
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.9rem",
                    color: "var(--font-secondary)",
                    lineHeight: 1.55,
                    mt: 0.25,
                  },
                }}
                control={
                  <Checkbox
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    sx={{
                      p: 0.5,
                      mr: 1,
                      color: "var(--border-strong, var(--font-tertiary))",
                      "&.Mui-checked": { color: "var(--ai-violet)" },
                    }}
                  />
                }
                label="I understand this attempt is proctored and timed, and that leaving fullscreen or switching tabs may be flagged."
              />
            )}
            {!deviceAllowed && (
              <Typography
                sx={{
                  mt: proctored ? 1.25 : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "0.8rem",
                  color: "var(--warning-500)",
                  fontWeight: 600,
                }}
              >
                <IconWrapper icon="mdi:alert-outline" size={15} color="var(--warning-500)" />
                This device type isn&apos;t allowed — you&apos;ll be prompted when you continue.
              </Typography>
            )}
            {!canStartAssessment && !isExpired && (
              <Typography
                sx={{
                  mt: proctored ? 1.25 : 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "0.8rem",
                  color: "var(--font-tertiary)",
                  fontWeight: 500,
                }}
              >
                <IconWrapper icon="mdi:clock-outline" size={15} color="var(--font-tertiary)" />
                This assessment hasn&apos;t opened yet — the button unlocks at the start time.
              </Typography>
            )}
          </Box>

          <LoadingButton
            variant="contained"
            size="large"
            startIcon={<IconWrapper icon={ctaIcon} size={24} />}
            onClick={handleStart}
            disabled={ctaDisabled}
            sx={{
              flexShrink: 0,
              width: { xs: "100%", md: "auto" },
              minWidth: { md: 300 },
              background: "var(--gradient-ai)",
              color: "#fff",
              fontWeight: 800,
              py: 1.5,
              px: 4,
              borderRadius: 2.5,
              textTransform: "none",
              fontSize: "1.05rem",
              fontFamily: "var(--font-jakarta)",
              boxShadow: "0 14px 30px -14px color-mix(in srgb, var(--ai-pink) 70%, transparent)",
              "&:hover": {
                background: "var(--gradient-ai)",
                filter: "brightness(1.05)",
              },
              "&.Mui-disabled": {
                background: "var(--surface)",
                color: "var(--font-tertiary)",
                boxShadow: "none",
              },
            }}
          >
            {ctaLabel}
          </LoadingButton>
        </Paper>
      </Box>
    </MainLayout>
  );
}
