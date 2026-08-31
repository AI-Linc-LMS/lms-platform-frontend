"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { displayAnswer, type AnswerMap, type JobQuestion } from "@/lib/jobs-v2/questions";
import { J, R, TYPE, JCard, JButton, SectionHeader } from "@/components/jobs-v2/ui";

export interface StepReviewProps {
  jobTitle: string;
  companyName: string;
  resumeName: string;
  canPreview: boolean;
  onPreview: () => void;
  questions: JobQuestion[];
  answers: AnswerMap;
  /** Jump back to a step to change something, rather than pressing Back twice. */
  onEditResume: () => void;
  onEditQuestions?: () => void;
}

/**
 * Step 2 — review.
 *
 * The indigo-to-purple gradient banner (the module's fourth header treatment, and the one that
 * cannot render legibly in dark) is a `SectionHeader` plus a `JCard`.
 *
 * **Unanswered optional questions render as "— not answered".** The shipped recap dropped them
 * with `if (!text) return null`, so a learner reviewing five questions saw three and had no way
 * to know the other two were going out blank.
 */
export function StepReview({
  jobTitle,
  companyName,
  resumeName,
  canPreview,
  onPreview,
  questions,
  answers,
  onEditResume,
  onEditQuestions,
}: StepReviewProps) {
  const { t } = useTranslation("common");

  return (
    <Box>
      <SectionHeader
        icon="mdi:clipboard-check-outline"
        title={t("jobsV2.apply.reviewTitle", { defaultValue: "Review your application" })}
        description={t("jobsV2.apply.reviewHint", {
          defaultValue: "This is exactly what {{company}} receives for {{title}}.",
          company: companyName,
          title: jobTitle,
        })}
      />

      <JCard>
        {/* ---- the resume ---------------------------------------------- */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            pb: 2,
            borderBottom: `1px solid ${J.hairlineSoft}`,
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: R.ctl,
              display: "grid",
              placeItems: "center",
              bgcolor: J.surface2,
              border: `1px solid ${J.hairline}`,
              color: J.ink3,
            }}
          >
            <IconWrapper icon="mdi:file-document-outline" size={22} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...TYPE.label, mb: 0.25 }}>
              {t("jobsV2.apply.resumeTitle", { defaultValue: "Your resume" })}
            </Typography>
            <Typography sx={TYPE.bodyStrong} title={resumeName}>
              {resumeName}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.75 }}>
            <JButton
              variant="secondary"
              size="sm"
              startIcon="mdi:eye-outline"
              onClick={onPreview}
              disabledReason={
                canPreview
                  ? undefined
                  : t("jobsV2.apply.previewDisabled", { defaultValue: "Choose a resume to preview it" })
              }
            >
              {t("jobsV2.apply.preview", { defaultValue: "Preview" })}
            </JButton>
            <JButton variant="quiet" size="sm" onClick={onEditResume}>
              {t("jobsV2.apply.change", { defaultValue: "Change" })}
            </JButton>
          </Box>
        </Box>

        {/* ---- the answers --------------------------------------------- */}
        {questions.length > 0 && (
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Typography sx={{ ...TYPE.label, flex: 1 }}>
                {t("jobsV2.apply.yourAnswers", { defaultValue: "Your answers" })}
              </Typography>
              {onEditQuestions && (
                <JButton variant="quiet" size="sm" onClick={onEditQuestions}>
                  {t("jobsV2.apply.change", { defaultValue: "Change" })}
                </JButton>
              )}
            </Box>
            <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {questions.map((question, index) => {
                const answer = displayAnswer(question, answers[question.id]);
                return (
                  <Box
                    key={question.id}
                    sx={{
                      p: 1.75,
                      borderRadius: R.inner,
                      bgcolor: J.surface2,
                      border: `1px solid ${J.hairline}`,
                      borderInlineStart: `3px solid ${answer ? J.azureBorder : J.hairlineStrong}`,
                    }}
                  >
                    <Typography component="dt" sx={{ ...TYPE.small, mb: 0.5 }}>
                      {t("jobsV2.apply.questionNumber", { defaultValue: "Q{{n}}", n: index + 1 })}
                      {". "}
                      {question.question_text}
                    </Typography>
                    <Typography
                      component="dd"
                      sx={{
                        ...TYPE.bodyStrong,
                        m: 0,
                        // An unanswered OPTIONAL question is stated, not silently dropped.
                        color: answer ? J.ink : J.ink4,
                        fontStyle: answer ? "normal" : "italic",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {answer ?? t("jobsV2.form.notAnswered")}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </JCard>
    </Box>
  );
}
