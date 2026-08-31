"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  adminJobsV2Service,
  type JobCreateUpdatePayload,
  type JobQuestionV2,
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

  courses: CourseOption[];
  coursesLoading: boolean;
  coursesError: string | null;
  onRetryCourses: () => void;

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
  courses,
  coursesLoading,
  coursesError,
  onRetryCourses,
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

  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      setQuestionBank(await adminJobsV2Service.getQuestions());
    } catch (err) {
      setQuestionsError((err as Error)?.message ?? t("jobsV2.error.body"));
    } finally {
      setQuestionsLoading(false);
    }
  }, [t]);

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
  const selectedCourseTitles = useMemo(
    () =>
      (form.data.course_ids ?? [])
        .map((id) => courses.find((c) => Number(c.id) === Number(id)))
        .filter(Boolean)
        .map((c) => (c as CourseOption).title ?? (c as CourseOption).name ?? ""),
    [courses, form.data.course_ids],
  );
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
    courseTitles: selectedCourseTitles,
    adaptiveTitles: selectedAdaptiveTitles,
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
            courses={courses}
            coursesLoading={coursesLoading}
            coursesError={coursesError}
            onRetryCourses={onRetryCourses}
            adaptiveCourses={adaptiveCourses}
            adaptiveLoading={adaptiveLoading}
            adaptiveError={adaptiveError}
            onRetryAdaptive={() => void loadAdaptive()}
            questionBank={questionBank}
            questionsLoading={questionsLoading}
            questionsError={questionsError}
            onRetryQuestions={() => void loadQuestions()}
            onAddQuestion={() => setQuestionModalOpen(true)}
            onOpenStudentPicker={() => setStudentPickerOpen(true)}
            serverAssignedIds={serverAssignedIds}
          />
        )}
      </Box>

      {/* Spacer for the fixed bar below md, so the last control is never under it. */}
      <Box aria-hidden sx={{ height: { xs: 88, md: 0 } }} />

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
          courseTitles: selectedCourseTitles,
          adaptiveTitles: selectedAdaptiveTitles,
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
    </Box>
  );
}

/* `Notice` is a kit primitive now (`ui/Surfaces.tsx`): the admin job detail wanted the same
 * banner for a failed JD upload, and a second copy is how the module ended up with four of
 * everything the first time. */
