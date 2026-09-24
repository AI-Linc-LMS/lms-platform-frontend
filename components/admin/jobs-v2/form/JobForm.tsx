"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { PHONE } from "@/components/common/mobile/phone";
import { useTranslation } from "react-i18next";
import {
  adminJobsV2Service,
  type JobCreateUpdatePayload,
  type JobQuestionV2,
  type JobQuestionUsage,
} from "@/lib/services/admin/admin-jobs-v2.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import {
  J,
  JButton,
  JConfirm,
  JStepper,
  MicroRuleList,
  Notice,
  R,
  SHADOW,
  focusFirstError,
  type Step,
} from "@/components/jobs-v2/ui";
import { ApplicationQuestionsModal } from "../ApplicationQuestionsModal";
import { SelectStudentsDialog } from "../SelectStudentsDialog";
import { useAudienceDescription } from "./AudienceSummary";
import { STEP_COUNT, useJobForm } from "./useJobForm";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { StepRole } from "./steps/StepRole";
import { StepDescription } from "./steps/StepDescription";
import { StepEligibility } from "./steps/StepEligibility";
import { StepAudience, type CourseOption } from "./steps/StepAudience";

export interface JobFormSubmitOptions {
  jdFile?: File;
}

export interface JobFormProps {
  mode: "create" | "edit";
  /**
   * A STABLE identity string for the record. The hydration effect keys on this, never on
   * `initialData`'s object identity — which is what let a late course fetch wipe typed input.
   */
  initialKey: string;
  initialData?: Partial<JobV2> | null;
  /** sessionStorage draft slot: `jobs-v2:jobform:{draftId}`. */
  draftId: string;

  /** Retired legacy course tags the job still carries; shown, never edited. */
  retiredCourseTitles?: string[];

  /** Field -> the source name that prefilled it (the scraped-import provenance markers). */
  provenance?: Record<string, string>;
  /** What the prefill could NOT map, stated instead of silently blanked. */
  prefillNotices?: string[];

  onSubmit: (
    payload: JobCreateUpdatePayload,
    options?: JobFormSubmitOptions,
  ) => Promise<void>;
  /** Leaving the form. The ROUTE owns navigation; the form never navigates after a save. */
  onCancel: () => void;
  saveLabel: string;
}

export function JobForm({
  mode,
  initialKey,
  initialData,
  draftId,
  retiredCourseTitles = [],
  provenance,
  prefillNotices,
  onSubmit,
  onCancel,
  saveLabel,
}: JobFormProps) {
  const { t } = useTranslation("common");

  const messages = useMemo(
    () => ({
      required: t("jobsV2.form.errorRequired", "This field is required"),
      invalidUrl: t("jobsV2.form.errorUrl", "Enter a full link starting with http:// or https://"),
      minOpenings: t("jobsV2.form.errorOpenings", "Enter a whole number of 1 or more"),
      logoUnreachable: t("jobsV2.form.errorLogo", "That URL did not load an image"),
    }),
    [t],
  );

  const form = useJobForm({ initialKey, initialData, draftId, messages });
  const guard = useUnsavedChanges(form.dirty);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);

  /* ---- adaptive courses ------------------------------------------------- */
  const [adaptiveCourses, setAdaptiveCourses] = useState<CourseOption[]>([]);
  const [adaptiveLoading, setAdaptiveLoading] = useState(true);
  const [adaptiveError, setAdaptiveError] = useState<string | null>(null);

  const loadAdaptive = useCallback(async () => {
    setAdaptiveLoading(true);
    setAdaptiveError(null);
    try {
      const list = await adminAdaptiveCourseService.listCourses();
      setAdaptiveCourses(
        list.filter((c) => c.is_published).map((c) => ({ id: c.id, title: c.title })),
      );
    } catch (err) {
      // Never `.catch(() => {})`: a swallowed failure renders a picker that looks simply empty.
      setAdaptiveError((err as Error)?.message ?? t("jobsV2.error.body"));
    } finally {
      setAdaptiveLoading(false);
    }
  }, [t]);

  /* ---- question bank ---------------------------------------------------- */
  const [questionBank, setQuestionBank] = useState<JobQuestionV2[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  /**
   * The job this form edits, or undefined on the create page. The bank endpoint needs it: a
   * question retired while ANOTHER job still asked it stays on that job, and the row has to
   * keep appearing here or the "N selected" chip would count something not in the list.
   */
  const jobId = useMemo(() => {
    const raw = mode === "edit" ? initialData?.id : undefined;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
  }, [initialData?.id, mode]);

  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      setQuestionBank(await adminJobsV2Service.getQuestions(undefined, jobId));
    } catch (err) {
      setQuestionsError((err as Error)?.message ?? t("jobsV2.error.body"));
    } finally {
      setQuestionsLoading(false);
    }
  }, [jobId, t]);

  useEffect(() => {
    void loadAdaptive();
  }, [loadAdaptive]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  /* ---- modals ----------------------------------------------------------- */
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const serverAssignedIds = useMemo(
    () => (initialData?.assigned_students ?? []).map((s) => s.id),
    [initialData],
  );

  const addNewQuestion = useCallback(
    async (payload: {
      question_text: string;
      question_type: string;
      is_required: boolean;
      order: number;
      options?: string[];
    }) => {
      const created = await adminJobsV2Service.createQuestion(payload, undefined);
      setQuestionBank((prev) => [...prev, created]);
      form.selectQuestion(created.id);
    },
    [form],
  );

  /* ---- removing a question ---------------------------------------------- */
  const [removeTarget, setRemoveTarget] = useState<JobQuestionV2 | null>(null);
  const [removeUsage, setRemoveUsage] = useState<JobQuestionUsage | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const requestRemoveQuestion = useCallback(
    (question: JobQuestionV2) => {
      setRemoveTarget(question);
      setRemoveUsage(null);
      setRemoveError(null);
      // Counted server-side at the moment of the confirmation, never guessed from the form:
      // the number of applicants who already answered is the whole reason for the dialog.
      void adminJobsV2Service
        .getQuestionUsage(question.id, jobId)
        .then(setRemoveUsage)
        .catch((err: Error) => setRemoveError(err?.message ?? t("jobsV2.error.body")));
    },
    [jobId, t],
  );

  const confirmRemoveQuestion = useCallback(async () => {
    if (!removeTarget) return;
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      await adminJobsV2Service.removeQuestion(removeTarget.id, jobId);
      // The list and the count move together, in one commit. `deselectQuestion`, never
      // `toggleQuestion`: toggling an UNSELECTED row would have selected it on the way out.
      setQuestionBank((prev) => prev.filter((q) => q.id !== removeTarget.id));
      form.deselectQuestion(removeTarget.id);
      setRemoveTarget(null);
      setRemoveUsage(null);
    } catch (err) {
      setRemoveError((err as Error)?.message ?? t("jobsV2.error.body"));
    } finally {
      setRemoveBusy(false);
    }
  }, [form, jobId, removeTarget, t]);

  /** Exactly what the confirmation promises will happen. Empty until the counts land. */
  const removeConsequences = useMemo(() => {
    if (!removeUsage) return [];
    const lines: string[] = [];
    if (removeUsage.on_this_job) {
      lines.push(
        t("jobsV2.questionBank.thisJob", "This job stops asking it on the application form"),
      );
    }
    if (removeUsage.other_jobs > 0) {
      lines.push(
        t("jobsV2.questionBank.otherJobs", "{{count}} other job(s) keep asking it, unchanged", {
          count: removeUsage.other_jobs,
        }),
      );
    }
    if (removeUsage.answers > 0) {
      lines.push(
        t(
          "jobsV2.questionBank.answersKept",
          "{{answers}} answer(s) from {{applications}} application(s) are kept and stay readable",
          { answers: removeUsage.answers, applications: removeUsage.applications },
        ),
      );
    } else {
      lines.push(
        t("jobsV2.questionBank.noAnswers", "Nobody has answered it, so no answer is affected"),
      );
    }
    lines.push(
      t(
        "jobsV2.questionBank.bankLine",
        "It leaves the shared question bank and cannot be added to another job",
      ),
    );
    return lines;
  }, [removeUsage, t]);

  /* ---- steps ------------------------------------------------------------ */
  const stepLabels = useMemo(
    () => [
      t("jobsV2.form.stepRole", "The role"),
      t("jobsV2.form.stepDescription", "The description"),
      t("jobsV2.form.stepEligibility", "Who can apply"),
      t("jobsV2.form.stepAudience", "Audience and publish"),
    ],
    [t],
  );

  const steps = useMemo<Step[]>(
    () =>
      stepLabels.map((label, index) => ({
        key: `step-${index}`,
        label,
        status: form.stepHasError(index)
          ? form.showErrors
            ? "error"
            : "todo"
          : index === form.activeStep
            ? "active"
            : index < form.activeStep
              ? "done"
              : "todo",
        // Every step is reachable at any time: editing a closing date must not cost three
        // Next clicks, and Save must be reachable without traversing all four.
        enabled: true,
      })),
    [form, stepLabels],
  );

  /* ---- audience consequences for the publish confirm --------------------- */
  const selectedAdaptiveTitles = useMemo(
    () =>
      (form.data.adaptive_course_ids ?? [])
        .map((id) => adaptiveCourses.find((c) => Number(c.id) === Number(id)))
        .filter(Boolean)
        .map((c) => (c as CourseOption).title ?? ""),
    [adaptiveCourses, form.data.adaptive_course_ids],
  );
  const newStudentCount = useMemo(() => {
    const known = new Set(serverAssignedIds);
    return form.assignedStudents.filter((s) => !known.has(s.id)).length;
  }, [form.assignedStudents, serverAssignedIds]);

  const audience = useAudienceDescription({
    courseTitles: selectedAdaptiveTitles,
    retiredCourseTitles,
    studentCount: form.assignedStudents.length,
    collegeNames: (form.data.college_mappings ?? []).map((m) => m.college_name),
    newStudentCount,
    published: Boolean(form.data.is_published),
  });

  const publishConsequences = useMemo(() => {
    const list = [audience.sentence];
    if (newStudentCount > 0) {
      list.push(
        t(
          "jobsV2.form.consequenceEmail",
          "{{count}} newly assigned student(s) receive an email. Re-saving never re-sends to someone already assigned.",
          { count: newStudentCount },
        ),
      );
    }
    list.push(
      t("jobsV2.form.consequenceStatus", "The job is saved with status {{status}}.", {
        status: t(`jobsV2.jobStatus.${form.data.status ?? "active"}`),
      }),
    );
    return list;
  }, [audience.sentence, form.data.status, newStudentCount, t]);

  /* ---- submit ----------------------------------------------------------- */
  const doSubmit = useCallback(async () => {
    setPublishConfirm(false);
    setSubmitting(true);
    try {
      await onSubmit(form.buildPayload(), { jdFile: form.jdFile ?? undefined });
      // markSaved clears the draft and re-baselines dirt, so the beforeunload guard and the
      // Cancel confirmation both stand down. The ROUTE owns navigation from here.
      form.markSaved();
    } catch {
      // The route surfaces the failure; the form keeps every typed value.
    } finally {
      setSubmitting(false);
    }
  }, [form, onSubmit]);

  const requestSave = useCallback(() => {
    if (!form.validateAll()) {
      if (form.firstInvalidStep !== null) form.goToStep(form.firstInvalidStep);
      // The first offending field is focused, not announced by a toast that names nothing.
      requestAnimationFrame(() => focusFirstError(contentRef.current));
      return;
    }
    if (form.data.is_published || newStudentCount > 0) {
      setPublishConfirm(true);
      return;
    }
    void doSubmit();
  }, [doSubmit, form, newStudentCount]);

  const isLastStep = form.activeStep === STEP_COUNT - 1;
  const nextDisabledReason = form.stepHasError(form.activeStep)
    ? t("jobsV2.form.fixStepFirst", "Fix the highlighted fields on this step to continue")
    : undefined;

  return (
    <Box>
      {form.draftRestored && (
        <Notice
          tone="azure"
          icon="mdi:content-save-outline"
          title={t("jobsV2.form.draftRestoredTitle", "Draft restored")}
          body={t(
            "jobsV2.form.draftRestoredBody",
            "We kept what you typed the last time this form was open in this tab.",
          )}
          action={
            <>
              <JButton variant="quiet" size="sm" onClick={form.startOver}>
                {t("jobsV2.form.startOver", "Start over")}
              </JButton>
              <JButton variant="quiet" size="sm" onClick={form.dismissDraftNotice}>
                {t("jobsV2.bulk.dismiss")}
              </JButton>
            </>
          }
        />
      )}

      {prefillNotices && prefillNotices.length > 0 && (
        <Notice
          tone="warn"
          icon="mdi:radar"
          title={t("jobsV2.form.prefillGapsTitle", "Some scraped values could not be mapped")}
          body={t(
            "jobsV2.form.prefillGapsBody",
            "They were left empty rather than guessed. Fill them in before publishing.",
          )}
        >
          <MicroRuleList items={prefillNotices} tone={J.warnFg} />
        </Notice>
      )}

      <JStepper
        steps={steps}
        active={form.activeStep}
        onStepChange={form.goToStep}
        completedThrough={form.activeStep}
        ariaLabel={t("jobsV2.form.stepperLabel", "Job form steps")}
        sx={{ mb: 3 }}
      />

      <Box
        ref={contentRef}
        role="tabpanel"
        aria-label={stepLabels[form.activeStep]}
        sx={{ maxWidth: { xs: "100%", md: 860, lg: 1100 }, mx: "auto" }}
      >
        {form.activeStep === 0 && <StepRole form={form} provenance={provenance} />}
        {form.activeStep === 1 && <StepDescription form={form} provenance={provenance} />}
        {form.activeStep === 2 && <StepEligibility form={form} provenance={provenance} />}
        {form.activeStep === 3 && (
          <StepAudience
            form={form}
            provenance={provenance}
            retiredCourseTitles={retiredCourseTitles}
            adaptiveCourses={adaptiveCourses}
            adaptiveLoading={adaptiveLoading}
            adaptiveError={adaptiveError}
            onRetryAdaptive={() => void loadAdaptive()}
            questionBank={questionBank}
            questionsLoading={questionsLoading}
            questionsError={questionsError}
            onRetryQuestions={() => void loadQuestions()}
            onAddQuestion={() => setQuestionModalOpen(true)}
            onDeleteQuestion={requestRemoveQuestion}
            onOpenStudentPicker={() => setStudentPickerOpen(true)}
            serverAssignedIds={serverAssignedIds}
          />
        )}
      </Box>

      {/* Spacer for the fixed bar below md, so the last control is never under it. */}
      <Box aria-hidden sx={{ height: { xs: 88, md: 0 }, [PHONE]: { height: 0 } }} />

      {/*
        `MainLayout` gives ancestors `overflow: auto`, which makes them the containing block for
        a `position: sticky` bar — so the shipped Save/Next bar very likely sat at the bottom of
        a ~2500px form instead of pinning. `fixed` below md is deterministic.
      */}
      <Box
        sx={{
          position: { xs: "fixed", md: "static" },
          insetInline: { xs: 0, md: "auto" },
          bottom: { xs: 0, md: "auto" },
          zIndex: { xs: 8, md: "auto" },
          mt: { xs: 0, md: 3 },
          p: { xs: 1.5, md: 2 },
          pb: { xs: "calc(12px + env(safe-area-inset-bottom))", md: 2 },
          borderRadius: { xs: 0, md: R.card },
          borderTop: `1px solid ${J.hairline}`,
          border: { md: `1px solid ${J.hairline}` },
          bgcolor: J.surface,
          boxShadow: { xs: SHADOW.sticky, md: "none" },
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.25,
          // PHONE: in the flow, at the end of the step, as on a desktop. Pinned to bottom: 0 it
          // sat UNDER the floating dock (z-index 1200, 76px tall), which covered Next and Save
          // entirely; and wrapped into three rows it hid a third of the form besides.
          [PHONE]: {
            position: "static",
            zIndex: "auto",
            mt: 3,
            p: 2,
            pb: 2,
            borderRadius: R.card,
            border: `1px solid ${J.hairline}`,
            boxShadow: "none",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 1.5,
            // Next and Save share the row; Back and Cancel share the row above them.
            "& > div": { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
            "& > div > *": { width: "100%", minWidth: 0 },
            // On the last step Save is alone in its row and takes all of it.
            "& > div > *:only-child": { gridColumn: "1 / -1" },
            "& .MuiButton-root": { width: "100%" },
          },
        }}
      >
        {/* Back and Cancel are ADJACENT on the leading edge: the two "go backwards" actions
            stop living at opposite ends of the bar. */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <JButton
            variant="ghost"
            startIcon="mdi:arrow-left"
            onClick={form.goBack}
            disabled={form.activeStep === 0}
            disabledReason={
              form.activeStep === 0
                ? t("jobsV2.form.onFirstStep", "You are on the first step")
                : undefined
            }
          >
            {t("jobsV2.stepper.back")}
          </JButton>
          <JButton variant="ghost" onClick={() => guard.requestLeave(onCancel)}>
            {t("jobsV2.modal.cancel")}
          </JButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {!isLastStep && (
            <JButton
              variant="secondary"
              endIcon="mdi:arrow-right"
              onClick={form.goNext}
              disabled={Boolean(nextDisabledReason)}
              disabledReason={nextDisabledReason}
            >
              {t("jobsV2.stepper.next")}
            </JButton>
          )}
          {/* Save is available on EVERY step, so changing one field does not cost four
              Next clicks. */}
          <JButton
            variant="primary"
            startIcon="mdi:content-save-outline"
            onClick={requestSave}
            loading={submitting}
          >
            {saveLabel}
          </JButton>
        </Box>
      </Box>

      <SelectStudentsDialog
        open={studentPickerOpen}
        initialSelected={form.assignedStudents}
        alreadyAssignedIds={serverAssignedIds}
        audience={{
          courseTitles: selectedAdaptiveTitles,
          retiredCourseTitles,
          collegeNames: (form.data.college_mappings ?? []).map((m) => m.college_name),
          published: Boolean(form.data.is_published),
        }}
        onClose={() => setStudentPickerOpen(false)}
        onConfirm={(students) => {
          form.setAssignedStudents(students);
          setStudentPickerOpen(false);
        }}
      />

      <ApplicationQuestionsModal
        open={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        onSubmit={addNewQuestion}
        existingQuestions={questionBank}
        // The order is the index within THIS job's selection, not the size of the global bank.
        nextOrder={(form.data.question_ids ?? []).length}
      />

      <JConfirm
        open={publishConfirm}
        title={
          form.data.is_published
            ? mode === "create"
              ? t("jobsV2.form.createPublishConfirmTitle", "Create and publish this job?")
              : t("jobsV2.form.publishConfirmTitle", "Publish this job?")
            : t("jobsV2.form.saveConfirmTitle", "Save this job?")
        }
        body={
          form.data.is_published
            ? t(
                "jobsV2.form.publishConfirmBody",
                "It becomes visible to the audience below the moment you save.",
              )
            : t(
                "jobsV2.form.saveConfirmBody",
                "It stays a draft, but the students you assigned are recorded now.",
              )
        }
        consequences={publishConsequences}
        confirmLabel={
          form.data.is_published
            ? t("jobsV2.form.publishConfirmAction", "Publish")
            : t("jobsV2.stepper.save")
        }
        onConfirm={() => void doSubmit()}
        onCancel={() => setPublishConfirm(false)}
        busy={submitting}
      />

      <JConfirm
        open={guard.promptOpen}
        title={t("jobsV2.modal.discardTitle")}
        body={t(
          "jobsV2.form.discardFormBody",
          "This job has unsaved changes. Leaving now loses everything you have typed since the last save.",
        )}
        confirmLabel={t("jobsV2.modal.discardConfirm")}
        cancelLabel={t("jobsV2.modal.discardCancel")}
        tone="danger"
        onConfirm={guard.confirmLeave}
        onCancel={guard.cancelLeave}
      />

      {/*
        Removing a question is one click plus this confirmation, always - not only when it has
        answers. The bank is shared, so even a row that looks unused on this form may be asked
        by another job, and the counts that decide it are only knowable server-side. The dialog
        turns danger-toned once real applicant answers or other jobs are in play.
      */}
      <JConfirm
        open={removeTarget !== null}
        title={t("jobsV2.questionBank.title", "Remove this question?")}
        body={
          removeError
            ? removeError
            : removeUsage
              ? t("jobsV2.questionBank.body", "“{{question}}” is removed from the shared bank.", {
                  question: removeTarget?.question_text ?? "",
                })
              : t("jobsV2.questionBank.loading", "Checking where this question is used…")
        }
        consequences={removeConsequences}
        tone={
          removeUsage && (removeUsage.answers > 0 || removeUsage.other_jobs > 0)
            ? "danger"
            : "neutral"
        }
        confirmLabel={t("jobsV2.questionBank.confirm", "Remove question")}
        busy={removeBusy || (removeTarget !== null && removeUsage === null && !removeError)}
        onConfirm={() => void confirmRemoveQuestion()}
        onCancel={() => {
          setRemoveTarget(null);
          setRemoveUsage(null);
          setRemoveError(null);
        }}
      />
    </Box>
  );
}

/* `Notice` is a kit primitive now (`ui/Surfaces.tsx`): the admin job detail wanted the same
 * banner for a failed JD upload, and a second copy is how the module ended up with four of
 * everything the first time. */
