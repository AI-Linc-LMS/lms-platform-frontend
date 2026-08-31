"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { ResumeViewerModal } from "@/components/profile/ResumeViewerModal";
import { config } from "@/lib/config";
import { resumeService, type SavedResume } from "@/lib/services/resume.service";
import {
  serializeAnswers,
  sortQuestions,
  validateAnswers,
  type AnswerErrors,
  type AnswerMap,
  type AnswerValue,
  type JobQuestion,
} from "@/lib/jobs-v2/questions";
import {
  J,
  R,
  TYPE,
  JButton,
  JConfirm,
  JStepper,
  focusFirstError,
  type Step,
} from "@/components/jobs-v2/ui";
import { StepResume, resumeLabel, type ResumeMode, type UploadedResume } from "./StepResume";
import { StepQuestions } from "./StepQuestions";
import { StepReview } from "./StepReview";

export interface ApplySubmitPayload {
  resume_url?: string;
  saved_resume_id?: number;
  responses?: Array<{ question_id: number; response_text: string }>;
}

export interface ApplySubmitResult {
  resumeName: string | null;
  answeredCount: number;
}

export interface ApplyFlowProps {
  jobId: number;
  jobTitle: string;
  companyName: string;
  questions?: JobQuestion[];
  /**
   * Resolves once the application is recorded. **`ApplyFlow` does not navigate** — the route
   * owns navigation, which is what stops the shipped double push (`handleApply` pushed the
   * route AND the form then called `onCancel()`, which pushed it again).
   */
  onSubmit: (payload: ApplySubmitPayload, result: ApplySubmitResult) => Promise<void>;
  onCancel: () => void;
}

type StepKey = "resume" | "questions" | "review";

interface Draft {
  v: 1;
  mode: ResumeMode;
  savedResumeId: number | null;
  uploaded: UploadedResume | null;
  answers: AnswerMap;
}

const DRAFT_VERSION = 1;
const draftKey = (jobId: number) => `jobs-v2:apply:${jobId}`;

function readDraft(jobId: number): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey(jobId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    return parsed?.v === DRAFT_VERSION ? parsed : null;
  } catch {
    // Private mode, a full quota, a corrupted value: a draft is a convenience, never a
    // prerequisite. Losing it must not stop someone applying.
    return null;
  }
}

/**
 * The apply stepper.
 *
 * What changes, beyond the paint:
 *
 * - **Progress is stated once.** The header card's "Step 1 of 3 · Your Resume" line and the
 *   separate `Stepper` card — together roughly 300px of chrome above the first control on a
 *   phone — are one `JStepper`, which is a horizontal track at `md+` and a progress bar plus one
 *   line below it. Orientation is CSS, so it no longer snaps on hydration.
 * - **Steps are clickable.** Review was reachable only by pressing Next twice and leaving only
 *   by pressing Back twice.
 * - **Cancel warns.** It discarded every typed answer instantly, with no confirmation.
 * - **The draft survives.** Answers and the resume choice autosave to `sessionStorage`, and a
 *   `beforeunload` guard catches the accidental refresh.
 * - **Back and Cancel are adjacent** on the leading edge, instead of living at opposite ends of
 *   the bar; Next / Apply is on the trailing edge. The bar is `position: fixed` below `md`,
 *   because `MainLayout` gives its ancestors `overflow: auto` and a sticky bar in that subtree
 *   very likely never pins at all.
 */
export function ApplyFlow({ jobId, jobTitle, companyName, questions, onSubmit, onCancel }: ApplyFlowProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const formRef = useRef<HTMLDivElement | null>(null);

  const orderedQuestions = useMemo(() => sortQuestions(questions ?? []), [questions]);
  const hasQuestions = orderedQuestions.length > 0;

  const stepKeys = useMemo<StepKey[]>(
    () => (hasQuestions ? ["resume", "questions", "review"] : ["resume", "review"]),
    [hasQuestions],
  );

  const [active, setActive] = useState(0);
  const [furthest, setFurthest] = useState(0);

  /* ---- resume ---------------------------------------------------------- */
  const [mode, setMode] = useState<ResumeMode>("saved");
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(true);
  const [resumesError, setResumesError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState<UploadedResume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  /* ---- answers --------------------------------------------------------- */
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [errors, setErrors] = useState<AnswerErrors>({});

  /* ---- draft ----------------------------------------------------------- */
  const [restored, setRestored] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [touched, setTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  /* ---- load the saved resumes ------------------------------------------ */
  const loadResumes = useCallback(async () => {
    setResumesLoading(true);
    setResumesError(null);
    try {
      resumeService.invalidateResumesCache();
      const list = await resumeService.getSavedResumes();
      setResumes(list);
      // Preserve the shipped convenience: preselect the first saved resume.
      setSelectedResumeId((current) => current ?? (list.length > 0 ? list[0].id : null));
    } catch (err) {
      // NEVER `setResumes([])` here — that renders "no saved resume" over a server fault and
      // pushes the learner into re-uploading a resume they already have (section 10.8).
      setResumesError(
        (err as Error)?.message ??
          t("jobsV2.apply.resumesErrorTitle", { defaultValue: "We could not load your resumes" }),
      );
    } finally {
      setResumesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  /* ---- restore the draft once ------------------------------------------ */
  useEffect(() => {
    const draft = readDraft(jobId);
    if (draft) {
      setMode(draft.mode);
      setAnswers(draft.answers ?? {});
      setUploaded(draft.uploaded ?? null);
      if (draft.savedResumeId != null) setSelectedResumeId(draft.savedResumeId);
      const hasContent =
        Object.keys(draft.answers ?? {}).length > 0 || draft.uploaded != null || draft.savedResumeId != null;
      if (hasContent) setRestored(true);
    }
    setDraftLoaded(true);
  }, [jobId]);

  /* ---- autosave --------------------------------------------------------- */
  useEffect(() => {
    if (!draftLoaded || !touched || typeof window === "undefined") return;
    try {
      const draft: Draft = { v: DRAFT_VERSION, mode, savedResumeId: selectedResumeId, uploaded, answers };
      window.sessionStorage.setItem(draftKey(jobId), JSON.stringify(draft));
    } catch {
      // Out of quota or a locked-down browser. Silent by design: an autosave that cannot run
      // is not something to interrupt an application for.
    }
  }, [draftLoaded, touched, mode, selectedResumeId, uploaded, answers, jobId]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(draftKey(jobId));
    } catch {
      /* nothing to do */
    }
  }, [jobId]);

  /* ---- the unsaved-work guard ------------------------------------------ */
  const dirty = touched && !submitting;
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  /* ---- handlers --------------------------------------------------------- */
  const handleModeChange = useCallback((next: ResumeMode) => {
    setMode(next);
    setTouched(true);
  }, []);

  const handleSelectResume = useCallback((id: number | null) => {
    setSelectedResumeId(id);
    setTouched(true);
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        const saved = await resumeService.uploadResume(file, file.name);
        setUploaded({ id: saved.id, url: saved.file_url, name: saved.display_name || file.name, size: file.size });
        setMode("upload");
        setTouched(true);
        // The success border on the drop zone is the confirmation; the toast is a courtesy.
        showToast(t("jobsV2.apply.uploaded", { defaultValue: "Resume uploaded" }), "success");
      } catch (err) {
        // A visible field error, not a toast that fades before the learner looks up.
        setUploadError(
          (err as Error)?.message ??
            t("jobsV2.apply.uploadFailed", { defaultValue: "We could not upload that file. Try again." }),
        );
      } finally {
        setUploading(false);
      }
    },
    [showToast, t],
  );

  const handleClearUpload = useCallback(() => {
    setUploaded(null);
    setUploadError(null);
    setTouched(true);
  }, []);

  const handleAnswer = useCallback((questionId: number, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setTouched(true);
  }, []);

  const startOver = useCallback(() => {
    clearDraft();
    setAnswers({});
    setErrors({});
    setUploaded(null);
    setMode("saved");
    setSelectedResumeId(resumes.length > 0 ? resumes[0].id : null);
    setRestored(false);
    setTouched(false);
    setActive(0);
    setFurthest(0);
  }, [clearDraft, resumes]);

  /* ---- gates ------------------------------------------------------------ */
  const resumeChosen = mode === "saved" ? selectedResumeId != null : uploaded != null;
  const answersValid = useMemo(
    () => (hasQuestions ? Object.keys(validateAnswers(orderedQuestions, answers)).length === 0 : true),
    [hasQuestions, orderedQuestions, answers],
  );

  const stepEnabled = useCallback(
    (key: StepKey) => {
      if (key === "resume") return true;
      if (key === "questions") return resumeChosen;
      return resumeChosen && answersValid;
    },
    [resumeChosen, answersValid],
  );

  const stepLabel = (key: StepKey) =>
    key === "resume"
      ? t("jobsV2.apply.stepResume", { defaultValue: "Your resume" })
      : key === "questions"
        ? t("jobsV2.apply.stepQuestions", { defaultValue: "Questions" })
        : t("jobsV2.apply.stepReview", { defaultValue: "Review and send" });

  const steps: Step[] = stepKeys.map((key, index) => {
    const hasError = key === "questions" && Object.keys(errors).length > 0;
    return {
      key,
      label: stepLabel(key),
      status: hasError ? "error" : index < active ? "done" : index === active ? "active" : "todo",
      // Every step already passed, plus any step whose gate is satisfied.
      enabled: index <= furthest || stepEnabled(key),
    };
  });

  const currentKey = stepKeys[active];
  const isLast = active === stepKeys.length - 1;

  const goTo = useCallback(
    (index: number) => {
      setActive(index);
      setFurthest((f) => Math.max(f, index));
    },
    [],
  );

  const validateQuestions = useCallback(() => {
    const found = validateAnswers(orderedQuestions, answers);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // The offending control turns red, announces itself, and takes focus.
      requestAnimationFrame(() => focusFirstError(formRef.current));
      return false;
    }
    return true;
  }, [orderedQuestions, answers]);

  const handleNext = useCallback(() => {
    if (currentKey === "questions" && !validateQuestions()) return;
    goTo(Math.min(active + 1, stepKeys.length - 1));
  }, [currentKey, validateQuestions, goTo, active, stepKeys.length]);

  const handleBack = useCallback(() => setActive((prev) => Math.max(prev - 1, 0)), []);

  const handleCancel = useCallback(() => {
    if (dirty) {
      setCancelOpen(true);
      return;
    }
    onCancel();
  }, [dirty, onCancel]);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null;
  const resumeDisplayName =
    mode === "saved"
      ? (selectedResume ? resumeLabel(selectedResume) : t("jobsV2.apply.noResumeChosen", { defaultValue: "No resume chosen" }))
      : (uploaded?.name ?? t("jobsV2.apply.uploadedResume", { defaultValue: "Uploaded resume" }));
  const previewResumeId = mode === "saved" ? selectedResumeId : (uploaded?.id ?? null);

  const handleSubmit = useCallback(async () => {
    if (hasQuestions && !validateQuestions()) {
      // Jump to the step carrying the problem so the learner can see it.
      goTo(stepKeys.indexOf("questions"));
      return;
    }
    const responses = serializeAnswers(orderedQuestions, answers);
    const answeredCount = responses.length;

    let payload: ApplySubmitPayload;
    if (mode === "saved") {
      if (selectedResumeId == null) {
        goTo(0);
        return;
      }
      payload = { saved_resume_id: Number(selectedResumeId), responses: answeredCount ? responses : undefined };
    } else {
      if (!uploaded) {
        goTo(0);
        return;
      }
      // Preserved verbatim: the upload endpoint may hand back a relative path.
      const fullUrl = uploaded.url.startsWith("http")
        ? uploaded.url
        : `${config.apiBaseUrl.replace(/\/$/, "")}${uploaded.url.startsWith("/") ? "" : "/"}${uploaded.url}`;
      payload = { resume_url: fullUrl, responses: answeredCount ? responses : undefined };
    }

    setSubmitting(true);
    try {
      await onSubmit(payload, { resumeName: resumeDisplayName, answeredCount });
      clearDraft();
    } catch (err) {
      showToast(
        (err as Error)?.message ?? t("jobsV2.apply.failed", { defaultValue: "Failed to apply" }),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    hasQuestions,
    validateQuestions,
    goTo,
    stepKeys,
    orderedQuestions,
    answers,
    mode,
    selectedResumeId,
    uploaded,
    onSubmit,
    resumeDisplayName,
    clearDraft,
    showToast,
    t,
  ]);

  const nextDisabledReason =
    currentKey === "resume" && !resumeChosen
      ? t("jobsV2.apply.selectResumeToContinue", { defaultValue: "Select a resume to continue" })
      : undefined;

  return (
    <Box ref={formRef}>
      <JStepper
        steps={steps}
        active={active}
        onStepChange={goTo}
        completedThrough={furthest}
        ariaLabel={t("jobsV2.apply.stepsLabel", { defaultValue: "Application steps" })}
        sx={{ mb: 3 }}
      />

      {restored && (
        <Box
          role="status"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            p: 1.5,
            mb: 2.5,
            maxWidth: 820,
            mx: "auto",
            borderRadius: R.inner,
            border: `1px solid ${J.azureBorder}`,
            bgcolor: J.azureSoft,
          }}
        >
          <Box aria-hidden sx={{ color: J.azureDeep, display: "inline-flex", mt: "1px" }}>
            <IconWrapper icon="mdi:content-save-check-outline" size={18} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...TYPE.small, color: J.azureDeep }}>
              {t("jobsV2.apply.draftRestored", {
                defaultValue: "We restored the draft you started earlier on this device.",
              })}
            </Typography>
          </Box>
          <JButton variant="quiet" size="sm" onClick={startOver}>
            {t("jobsV2.apply.startOver", { defaultValue: "Start over" })}
          </JButton>
        </Box>
      )}

      <Box
        sx={{
          maxWidth: 820,
          mx: "auto",
          // Clearance for the fixed action bar below md. MainLayout already reserves the 72px
          // the bottom navigation occupies.
          pb: { xs: 10, md: 0 },
        }}
      >
        {currentKey === "resume" && (
          <StepResume
            mode={mode}
            onModeChange={handleModeChange}
            resumes={resumes}
            resumesLoading={resumesLoading}
            resumesError={resumesError}
            onReloadResumes={loadResumes}
            selectedResumeId={selectedResumeId}
            onSelectResume={handleSelectResume}
            uploaded={uploaded}
            uploading={uploading}
            uploadError={uploadError}
            onUpload={handleUpload}
            onClearUpload={handleClearUpload}
            onPreview={() => setPreviewOpen(true)}
            canPreview={previewResumeId != null}
          />
        )}

        {currentKey === "questions" && (
          <StepQuestions
            questions={orderedQuestions}
            answers={answers}
            errors={errors}
            onChange={handleAnswer}
          />
        )}

        {currentKey === "review" && (
          <StepReview
            jobTitle={jobTitle}
            companyName={companyName}
            resumeName={resumeDisplayName}
            canPreview={previewResumeId != null}
            onPreview={() => setPreviewOpen(true)}
            questions={orderedQuestions}
            answers={answers}
            onEditResume={() => goTo(0)}
            onEditQuestions={hasQuestions ? () => goTo(stepKeys.indexOf("questions")) : undefined}
          />
        )}
      </Box>

      {/* ---- one action bar --------------------------------------------- */}
      <Box
        sx={{
          position: { xs: "fixed", md: "static" },
          insetInline: { xs: 0, md: "auto" },
          // ABOVE the app's mobile bottom navigation (fixed, 72px, zIndex 1000).
          bottom: { xs: "calc(72px + env(safe-area-inset-bottom))", md: "auto" },
          zIndex: 5,
          mt: { md: 3 },
          maxWidth: { md: 820 },
          mx: { md: "auto" },
          px: { xs: 2, md: 0 },
          py: { xs: 1.5, md: 0 },
          bgcolor: { xs: J.surface, md: "transparent" },
          borderTop: { xs: `1px solid ${J.hairline}`, md: "none" },
          boxShadow: { xs: "var(--j-shadow-sticky)", md: "none" },
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {/* Back and Cancel are adjacent, on the leading edge. */}
        <JButton variant="ghost" onClick={handleBack} disabled={active === 0} startIcon="mdi:chevron-left">
          {t("jobsV2.stepper.back")}
        </JButton>
        <JButton variant="quiet" onClick={handleCancel}>
          {t("jobsV2.modal.cancel")}
        </JButton>

        <Box sx={{ flex: 1 }} />

        {isLast ? (
          <JButton
            variant="primary"
            tone="azure"
            startIcon="mdi:send"
            loading={submitting}
            onClick={handleSubmit}
            disabledReason={
              resumeChosen
                ? undefined
                : t("jobsV2.apply.selectResumeToContinue", { defaultValue: "Select a resume to continue" })
            }
          >
            {t("jobsV2.stepper.submit")}
          </JButton>
        ) : (
          <JButton
            variant="primary"
            tone="azure"
            endIcon="mdi:chevron-right"
            onClick={handleNext}
            disabledReason={nextDisabledReason}
          >
            {t("jobsV2.stepper.next")}
          </JButton>
        )}
      </Box>

      <JConfirm
        open={cancelOpen}
        tone="danger"
        title={t("jobsV2.apply.cancelTitle", { defaultValue: "Leave without applying?" })}
        body={t("jobsV2.apply.cancelBody", {
          defaultValue: "Your answers stay on this device for a while, but nothing is sent to the employer.",
        })}
        confirmLabel={t("jobsV2.apply.cancelConfirm", { defaultValue: "Leave" })}
        cancelLabel={t("jobsV2.apply.cancelKeep", { defaultValue: "Keep applying" })}
        onConfirm={() => {
          setCancelOpen(false);
          onCancel();
        }}
        onCancel={() => setCancelOpen(false)}
      />

      <ResumeViewerModal
        open={previewOpen && previewResumeId != null}
        onClose={() => setPreviewOpen(false)}
        resumeId={previewResumeId}
        resumeName={resumeDisplayName}
        fullWidth
        context={isLast ? "review" : "resume"}
      />
    </Box>
  );
}
