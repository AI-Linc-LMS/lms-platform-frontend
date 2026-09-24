"use client";

import { useState, useCallback, useEffect, useMemo, useRef, Suspense, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MCQBankQuery } from "@/components/admin/assessment/MCQSelectionSection";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/auth-context";
import { isCourseManagerRole } from "@/lib/auth/auth-utils";
import { isScopedAdminRole } from "@/lib/auth/role-utils";
import { audienceStepError, resolveBatchRequired } from "@/lib/utils/assessment-audience-rules";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { overSelectedSections } from "../sectionServedCount";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentService,
  apiErrorStatus,
  CreateAssessmentPayload,
  AssessmentQuizSectionWrite,
  AssessmentCodingProblemSectionWrite,
  AssessmentProjectSectionWrite,
  AssessmentSubjectiveSectionWrite,
  AssessmentSubjectiveQuestionListItem,
  MCQ,
  CodingProblemListItem,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";
import { AssessmentSectionHero, AssessmentBreadcrumb, StatusChip, DifficultyBalanceMeter } from "@/components/admin/assessment/shared";
import { BasicInfoSection } from "@/components/admin/assessment/BasicInfoSection";
import { AssessmentSettingsSection } from "@/components/admin/assessment/AssessmentSettingsSection";
import type { EmailNotificationEditorHandle } from "@/components/admin/assessment/EmailNotificationEditor";
import {
  MultipleSectionsSection,
  Section,
  sectionTimeLimitExceedsOverallMessage,
} from "@/components/admin/assessment/MultipleSectionsSection";
import { SectionBasedQuestionsInput } from "@/components/admin/assessment/SectionBasedQuestionsInput";
import { AssessmentPreviewSection } from "@/components/admin/assessment/AssessmentPreviewSection";
import type { WrittenPromptPreview } from "@/components/admin/assessment/SectionCard";
import type { SubjectiveQuestionDraft } from "@/components/admin/assessment/SubjectiveQuestionsFormSection";
import { CARD_GRID_ITEM_SX } from "@/components/common/cardGrid";
import { getPassBandFieldErrors } from "@/lib/utils/assessment-pass-band.utils";
import { buildAssessmentNotificationEmailHtml } from "@/lib/utils/email-template";
import { getPublicAppOrigin } from "@/lib/config";
import { extractSavedEmailAttachment } from "@/lib/utils/assessment-email-attachment";
import { saveAssessmentWithActivation } from "@/lib/utils/assessment-activation";
import { adminCohortsService } from "@/lib/services/admin/admin-cohorts.service";
import {
  listProjects,
  type AdminProjectTemplate,
} from "@/lib/services/admin/admin-projects.service";
import {
  applyAssessmentDetailToBasicFields,
  mapQuestionsExportToAuthoringState,
} from "@/lib/utils/assessment-authoring-from-export.utils";
import { PHONE } from "@/components/common/mobile/phone";
import { SheetDialog } from "@/components/admin/SheetDialog";
import { PhoneFloor } from "@/components/admin/PhoneSheetParts";

type MCQInputMethod = "manual" | "existing" | "csv" | "ai";

function toAssessmentApiDecimalString(
  raw: string | undefined
): string | undefined {
  if (raw == null || !String(raw).trim()) return undefined;
  const s = String(raw).trim().replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n.toFixed(2);
}

const steps = ["Assessment Details", "Add Questions", "Review & Create"];

/** The wizard's filled, gradient action (Continue, and Publish on the final step). */
const PRIMARY_ACTION_SX = {
  textTransform: "none",
  fontWeight: 700,
  px: 3,
  borderRadius: "12px",
  color: "#fff",
  background: "var(--gradient-ai)",
  boxShadow: "0 10px 22px -12px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
  "&:hover": { filter: "brightness(1.05)" },
  "&.Mui-disabled": {
    color: "var(--font-secondary)",
    background: "color-mix(in srgb, var(--ai-violet) 18%, var(--surface) 82%)",
  },
} as const;

/** The outlined companion to it: Save on the final step, which keeps a draft. */
const SECONDARY_ACTION_SX = {
  textTransform: "none",
  fontWeight: 700,
  px: 2.5,
  borderRadius: "12px",
  color: "var(--font-primary)",
  borderColor: "color-mix(in srgb, var(--font-secondary) 35%, var(--border-default) 65%)",
  bgcolor: "var(--card-bg)",
  "&:hover": {
    borderColor: "var(--accent-indigo)",
    bgcolor: "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg) 94%)",
  },
  "&.Mui-disabled": { borderColor: "var(--border-default)" },
} as const;

/** The save body's email fields: compared on their own, not as part of the form (formSignature). */
const EMAIL_PAYLOAD_KEYS = [
  "email_notification_enabled",
  "email_subject",
  "email_body",
  "email_html",
  "attachment_url",
  "email_base_url",
  "email_reminders_enabled",
] as const;

interface SubmitOptions {
  skipSectionValidation?: boolean;
  forceDraft?: boolean;
  /**
   * Make the paper live once it is saved. A new paper is created as a draft and then published
   * through the same endpoint a reopened draft uses, so both paths run the same checks.
   */
  publish?: boolean;
  /** Set once the author has seen the "these questions will not be served" dialog. */
  acknowledgeExtraQuestions?: boolean;
}

function CreateAssessmentPageContent() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  // The server refuses a non-admin's new paper with no batch; the form has to say so up front
  // rather than letting them fill the whole wizard and fail on save. The server reports the rule
  // itself (builder-config), so the marker and the refusal cannot drift; the role rule is only
  // the fallback for an older backend or a failed request.
  const [serverBatchRequired, setServerBatchRequired] = useState<boolean | null>(null);
  useEffect(() => {
    if (!config.clientId) return;
    let cancelled = false;
    void adminAssessmentService.getAssessmentBuilderConfig(config.clientId).then((cfg) => {
      if (!cancelled) setServerBatchRequired(cfg ? cfg.batch_required : null);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const batchRequired = resolveBatchRequired(serverBatchRequired, user?.role);
  // Shown once the author has tried to leave the step, not on a pristine form.
  const [audienceAttempted, setAudienceAttempted] = useState(false);
  const { clientInfo } = useClientInfo();
  const canConfigureLiveStreaming =
    clientInfo?.live_proctoring_enabled === true;

  useEffect(() => {
    if (authLoading) return;
    if (isCourseManagerRole(user?.role)) {
      router.replace("/admin/assessment");
    }
  }, [authLoading, user?.role, router]);

  /**
   * Navigate after a write, keeping every submit button off until the route arrives. For a
   * same-route redirect (the draft editor, ?fromDraft=N) the wait ends when that draft has loaded;
   * any other destination unmounts this page.
   */
  const leaveTo = (url: string, draftId?: number) => {
    awaitingDraftRef.current = draftId ?? null;
    setLeaving(true);
    router.push(url);
  };

  const [activeStep, setActiveStep] = useState(0);
  // Project briefs picked per section. Kept beside the other per-section pickers rather than on
  // the Section itself, matching how MCQ and coding selections are held.
  const [sectionProjectIds, setSectionProjectIds] = useState<Record<string, number[]>>({});
  // The brief library, loaded once so the outline and the review step can name a project section
  // and price it. The picker fetches its own copy for its own list; this is the wizard's, and it
  // is only fetched when a project section actually exists.
  const [projectBriefs, setProjectBriefs] = useState<AdminProjectTemplate[]>([]);
  const [creating, setCreating] = useState(false);
  /**
   * Sections that hold more questions than they will serve, held here while the author
   * decides. Null when there is nothing to warn about.
   */
  const [extraQuestionPrompt, setExtraQuestionPrompt] = useState<
    Array<{
      title: string;
      order: number;
      serves: number | undefined;
      picked: number;
      noun: string;
    }> | null
  >(null);
  const [editingAssessmentId, setEditingAssessmentId] = useState<number | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadedIsDraft, setLoadedIsDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  /** Which final-step button is busy, so only that one says "Publishing…" / "Saving…". */
  const [submitIntent, setSubmitIntent] = useState<"save" | "publish" | null>(null);
  /** The submit the extra-questions dialog interrupted, finished by its "…as configured" button. */
  const pendingSubmitRef = useRef<SubmitOptions>({});
  /**
   * The paper this page created, kept the moment createAssessment answers: in a ref for the click
   * handlers, which can run before React re-renders, and in state for the render.
   *
   * editingAssessmentId is only set later, by the ?fromDraft effect once the route has changed.
   * In between, a second click (Save, Publish, or a retry after a failed publish) found no id and
   * POSTed a second paper, and a second publish emailed the same learners again. Every later
   * click now goes to this paper.
   */
  const createdIdRef = useRef<number | null>(null);
  const [createdAssessmentId, setCreatedAssessmentId] = useState<number | null>(null);
  /** A write is in flight. A ref beside `creating`: a second click can land before the re-render. */
  const submittingRef = useRef(false);
  /**
   * The page has sent the author on after a write and the route has not arrived yet. The submit
   * buttons stay off until it does. `creating` alone was cleared in `finally`, which turned them
   * back on while the router was still on its way.
   */
  const [leaving, setLeaving] = useState(false);
  /** For a same-route redirect (?fromDraft=N): the draft whose load ends the wait. */
  const awaitingDraftRef = useRef<number | null>(null);
  /** Bumped when a draft finishes loading, so the saved-state baseline is taken from that render. */
  const [draftLoadCount, setDraftLoadCount] = useState(0);
  /** What the loaded paper's Active switch was, for a save that must not fold the switch in. */
  const loadedIsActiveRef = useRef(true);
  /**
   * The form as last saved, email aside (see formSignature). Publish compares with it: the publish
   * call makes the SAVED paper live, so unsaved edits would silently not go out.
   */
  const savedFormSignatureRef = useRef<string | null>(null);
  /**
   * The notification email as last saved. The publish call cannot carry one either: the server
   * sends the email it has saved, so an edited subject or body counts as an unsaved change.
   */
  const savedEmailRef = useRef<{ enabled: boolean; subject: string; body: string } | null>(null);
  /** The draft's saved email, waiting for the editor to mount (it is not mounted while loading). */
  const pendingEmailRestoreRef = useRef<{ subject: string | null; body: string | null } | null>(
    null,
  );
  /** Publish found unsaved changes this author may not save; offer the last saved version. */
  const [lastSavedPrompt, setLastSavedPrompt] = useState<{ reason: string } | null>(null);

  // Assessment basic info
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  // Blank means "use the institution's timezone" — the same default the backend resolves to.
  const [timezone, setTimezone] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [cohortIds, setCohortIds] = useState<number[]>([]);
  const [retiredCourseTitles, setRetiredCourseTitles] = useState<string[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [liveStreaming, setLiveStreaming] = useState(false);
  const [sendCommunication, setSendCommunication] = useState(false);
  // Scheduled-reminder opt-in + chosen lead times (minutes before start).
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(false);
  const [emailReminderOffsets, setEmailReminderOffsets] = useState<number[]>([]);
  // Email subject/body/attachment live INSIDE <EmailNotificationEditor /> so
  // typing in them doesn't re-render this huge page. We read the final values
  // through this ref at submit time only.
  const emailEditorRef = useRef<EmailNotificationEditorHandle>(null);
  // The editor only mounts on Step 0, so by the time Create/Publish runs from Step 2 the
  // ref is null and the composed email was silently dropped. Snapshot the editor's
  // values whenever we leave Step 0 and fall back to it at submit time.
  const emailSnapshotRef = useRef<
    ReturnType<EmailNotificationEditorHandle["getValues"]> | null
  >(null);
  const captureEmailSnapshot = () => {
    const v = emailEditorRef.current?.getValues();
    if (!v) return;
    const prev = emailSnapshotRef.current;
    emailSnapshotRef.current = {
      ...v,
      // A re-mounted editor can't restore a previously-picked File/URL, so keep the
      // prior one when the current capture has none.
      attachment: v.attachment ?? prev?.attachment ?? null,
      attachmentUrl: v.attachmentUrl ?? prev?.attachmentUrl ?? null,
    };
  };
  // Returning to Step 0 re-mounts the editor fresh - re-seed it from the snapshot so
  // the composed email isn't visually reset (and a later capture can't clobber it with
  // defaults). Child imperative refs are set by the time this parent effect runs.
  useEffect(() => {
    if (activeStep === 0 && emailSnapshotRef.current) {
      const s = emailSnapshotRef.current;
      emailEditorRef.current?.setContent(s.subject, s.body);
    }
  }, [activeStep]);
  // The editor pushes a single boolean up whenever its "has real content"
  // status flips - used to derive `email_notification_enabled` without
  // re-rendering the page on every keystroke.
  const [emailEditorHasData, setEmailEditorHasData] = useState(false);
  const emailNotificationEnabled = sendCommunication && emailEditorHasData;
  // Previously-saved attachment surfaced as a chip in the editor on draft
  // reload. If the admin doesn't replace it, we won't re-send `email_attachment`
  // and the backend keeps the existing file.
  const [existingEmailAttachmentUrl, setExistingEmailAttachmentUrl] = useState<
    string | null
  >(null);
  const [existingEmailAttachmentName, setExistingEmailAttachmentName] =
    useState<string | null>(null);
  const [showResult, setShowResult] = useState(true);
  const [evaluationMode, setEvaluationMode] = useState<"auto" | "manual">("auto");
  useEffect(() => {
    if (evaluationMode === "manual" && showResult) {
      setShowResult(false);
    }
  }, [evaluationMode, showResult]);

  // Live-built default subject/body for the student notification email.
  const defaultEmailSubject = useMemo(
    () => `Important Notification - ${title.trim() || "New Assessment"}`,
    [title]
  );
  // The schedule (start/end/duration) is rendered as a dedicated block by
  // <EmailTemplatePreview> and the rendered email HTML - so the seeded body
  // only needs the greeting + a reference to the assessment. This keeps
  // start/end times always current in the email even when the admin
  // customises the body.
  const defaultEmailBody = useMemo(() => {
    return [
      "<p>Dear {name},</p>",
      "<p>All set! Your assessment details are below. Good luck 👍.</p>",
      `<p><strong>Assessment:</strong> ${title.trim() || "New Assessment"}</p>`,
    ].join("");
  }, [title]);

  // Schedule passed to the preview + the rendered email HTML. Rebuilt on
  // every render but cheap (just a plain object).
  const emailSchedule = useMemo(
    () => ({
      startTime: startTime || null,
      endTime: endTime || null,
      durationMinutes: durationMinutes || null,
    }),
    [startTime, endTime, durationMinutes]
  );

  const [allowMovementAcrossSections, setAllowMovementAcrossSections] =
    useState(true);
  const [tabSwitchLimitEnabled, setTabSwitchLimitEnabled] = useState(false);
  const [tabSwitchLimitCount, setTabSwitchLimitCount] = useState(2);
  const [certificateAvailable, setCertificateAvailable] = useState(false);
  const [passBandLowerPercent, setPassBandLowerPercent] = useState("");
  const [passBandUpperPercent, setPassBandUpperPercent] = useState("");
  const [allowDesktop, setAllowDesktop] = useState(true);
  const [allowMobile, setAllowMobile] = useState(true);
  const [allowTablet, setAllowTablet] = useState(true);

  // Multiple sections
  const [sections, setSections] = useState<Section[]>([]);

  // MCQ input method (per section)
  const [mcqInputMethodBySection, setMcqInputMethodBySection] =
    useState<Record<string, MCQInputMethod>>({});

  // Section-based question assignments
  // For manual/csv/ai input
  const [manualMCQs, setManualMCQs] = useState<Record<string, MCQ[]>>({});
  const [csvMCQs, setCsvMCQs] = useState<Record<string, MCQ[]>>({});
  const [aiMCQs, setAiMCQs] = useState<Record<string, MCQ[]>>({});
  // For existing pool selection
  const [sectionMcqIds, setSectionMcqIds] = useState<Record<string, number[]>>(
    {}
  );

  // Existing MCQs for selection.
  //
  // `existingMCQs` used to be the ENTIRE tenant bank, fetched on open - 28,086 rows in the
  // largest tenant. It is now one server-filtered page, which means the rows on screen are no
  // longer the rows a selection might refer to: a question picked on page 1 is gone from this
  // array by page 4, and the payload builder needs its full object to send the question text
  // and answer key.
  //
  // `mcqCache` is what closes that gap. Every row the server ever returns is remembered here,
  // and selections resolve against it rather than against the current page. It can only be
  // asked for ids the user has actually seen (you cannot tick a row that was never rendered),
  // plus the ones seeded from the assessment being edited - so it is complete by construction.
  const [existingMCQs, setExistingMCQs] = useState<any[]>([]);
  const [loadingMCQs, setLoadingMCQs] = useState(false);
  const [mcqCache, setMcqCache] = useState<Record<number, any>>({});
  const [mcqTotalCount, setMcqTotalCount] = useState(0);
  const [mcqBankFacets, setMcqBankFacets] = useState<{
    topics: string[];
    skills: string[];
    tags: string[];
  }>({ topics: [], skills: [], tags: [] });

  const rememberMCQs = useCallback((rows: any[]) => {
    if (!rows.length) return;
    setMcqCache((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        if (row && typeof row.id === "number") next[row.id] = row;
      }
      return next;
    });
  }, []);

  /** Selected ids -> full objects, from the cache rather than the visible page. */
  const resolveSelectedMCQs = useCallback(
    (ids: number[]) => ids.map((id) => mcqCache[id]).filter(Boolean),
    [mcqCache],
  );

  // Courses for multi-select
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState(false);

  // Coding problem input method (per section)
  const [codingInputMethodBySection, setCodingInputMethodBySection] =
    useState<Record<string, "existing" | "ai" | "raw" | "csv">>({});
  const [sectionCodingProblemIds, setSectionCodingProblemIds] = useState<
    Record<string, number[]>
  >({});
  // For AI generated coding problems (similar to aiMCQs)
  const [aiCodingProblems, setAiCodingProblems] = useState<
    Record<string, CodingProblemListItem[]>
  >({});
  const [existingCodingProblems, setExistingCodingProblems] = useState<
    CodingProblemListItem[]
  >([]);
  const [loadingCodingProblems, setLoadingCodingProblems] = useState(false);

  const [subjectiveInputMethodBySection, setSubjectiveInputMethodBySection] =
    useState<Record<string, "manual" | "existing">>({});
  const [manualSubjectiveQuestions, setManualSubjectiveQuestions] = useState<
    Record<string, SubjectiveQuestionDraft[]>
  >({});
  const [sectionSubjectiveQuestionIds, setSectionSubjectiveQuestionIds] = useState<
    Record<string, number[]>
  >({});
  const [existingSubjectiveQuestions, setExistingSubjectiveQuestions] = useState<
    AssessmentSubjectiveQuestionListItem[]
  >([]);
  const [loadingSubjectiveQuestions, setLoadingSubjectiveQuestions] = useState(false);

  const passBandFieldErrors = useMemo(
    () =>
      getPassBandFieldErrors(
        passBandLowerPercent,
        passBandUpperPercent,
        certificateAvailable
      ),
    [passBandLowerPercent, passBandUpperPercent, certificateAvailable]
  );

  // Load existing MCQs and coding problems on page load
  useEffect(() => {
    // The bank is no longer fetched on mount - the picker asks for the page it needs, and
    // asks again when the search or the facets change. Fetching here would be a wasted
    // request for every admin who never opens the "choose from bank" tab.

    loadExistingCodingProblems();
    loadExistingSubjectiveQuestions();
    loadAudienceOptions();
  }, []);

  useEffect(() => {
    const v = searchParams.get("fromDraft");
    if (v && /^\d+$/.test(v)) {
      setEditingAssessmentId(Number(v));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!editingAssessmentId || !config.clientId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingDraft(true);
        const [detail, exportJson] = await Promise.all([
          adminAssessmentService.getAssessmentById(config.clientId, editingAssessmentId),
          adminAssessmentService.getQuestionsExportJson(config.clientId, editingAssessmentId),
        ]);
        if (cancelled) return;
        const d = detail as { is_draft?: boolean; submissions_count?: number };
        setLoadedIsDraft(Boolean(d.is_draft));
        if (d.submissions_count && d.submissions_count > 0) {
          showToast("This assessment already has attempts; sections cannot be edited here.", "error");
          router.replace(`/admin/assessment/${editingAssessmentId}/edit`);
          return;
        }
        applyAssessmentDetailToBasicFields(detail, {
          setTitle,
          setInstructions,
          setDescription,
          setDurationMinutes,
          setStartTime,
          setEndTime,
          setIsPaid,
          setPrice,
          setCurrency,
          setIsActive,
          setRetiredCourseTitles,
          setColleges,
          setProctoringEnabled,
          setLiveStreaming,
          setSendCommunication,
          setShowResult,
          setEvaluationMode,
          setAllowMovementAcrossSections,
          setTabSwitchLimitEnabled,
          setTabSwitchLimitCount,
          setCertificateAvailable,
          setPassBandLowerPercent,
          setPassBandUpperPercent,
          setAllowDesktop,
          setAllowMobile,
          setAllowTablet,
        });
        // Carry any previously-saved attachment forward to the editor so the
        // admin sees it and can choose to keep or replace it. Backend has used
        // a few field names over time - accept any.
        const draftAny = detail as unknown as Record<string, unknown>;
        const savedAttachment = extractSavedEmailAttachment(draftAny);
        setExistingEmailAttachmentUrl(savedAttachment.url);
        setExistingEmailAttachmentName(savedAttachment.name);
        // P3: restore the draft's saved notification email so it isn't lost on reopen.
        // The editor seeds its body from initialBody only at mount, so a late async
        // load must be applied imperatively - but NOT from here. The page shows a spinner
        // while the draft loads, so the editor is not mounted and a setContent now did
        // nothing: the editor opened on the defaults, and the next save replaced the saved
        // email with them. The effect below applies it once the editor exists.
        const draftEmailBody =
          typeof draftAny.email_body === "string" ? draftAny.email_body.trim() : "";
        const draftEmailSubject =
          typeof draftAny.email_subject === "string" ? draftAny.email_subject : "";
        pendingEmailRestoreRef.current =
          draftEmailBody || draftEmailSubject
            ? { subject: draftEmailSubject || null, body: draftEmailBody || null }
            : null;
        savedEmailRef.current = {
          enabled:
            ((draftAny.email_notification_enabled as boolean | undefined) ??
              (draftAny.send_communication as boolean | undefined) ??
              false) === true,
          subject: draftEmailSubject.trim(),
          body: draftEmailBody,
        };
        // Loaded like every other setting, so a save (Save, or the save Publish makes first)
        // sends back what the paper holds instead of clearing it: the timezone override went
        // out blank and the reminder schedule went out empty.
        setTimezone(typeof draftAny.timezone === "string" ? draftAny.timezone : "");
        setEmailRemindersEnabled(draftAny.email_reminders_enabled === true);
        setEmailReminderOffsets(
          Array.isArray(draftAny.email_reminder_offsets)
            ? (draftAny.email_reminder_offsets as number[])
            : [],
        );
        loadedIsActiveRef.current = (detail as { is_active?: boolean }).is_active ?? true;
        // The paper's batches, as the edit page loads them (`audience.cohorts`). Left empty, an
        // instructor had to pick them again to get past the first step, and every draft looked
        // edited to the unsaved-changes check; a save then replaced the set with the re-pick.
        const draftAudience = (draftAny.audience ?? null) as { cohorts?: unknown } | null;
        setCohortIds(
          Array.isArray(draftAudience?.cohorts)
            ? (draftAudience.cohorts as { id: number }[])
                .map((c) => c?.id)
                .filter((id): id is number => typeof id === "number")
            : [],
        );
        const mapped = mapQuestionsExportToAuthoringState(exportJson);
        // Seed the cache with the questions already on this assessment. Editing pre-selects
        // their ids, and those rows may sit on page 40 of the bank - or not be reachable by
        // the current search at all - so without this the payload builder would silently drop
        // every question the assessment already had.
        rememberMCQs(
          (exportJson?.sections ?? [])
            .flatMap((section: any) => section?.questions ?? [])
            .filter((q: any) => q && typeof q.id === "number" && "option_a" in q),
        );
        setSections(mapped.sections);
        setMcqInputMethodBySection(mapped.mcqInputMethodBySection);
        setCodingInputMethodBySection(mapped.codingInputMethodBySection);
        setSubjectiveInputMethodBySection(mapped.subjectiveInputMethodBySection);
        setSectionMcqIds(mapped.sectionMcqIds);
        setSectionCodingProblemIds(mapped.sectionCodingProblemIds);
        setSectionSubjectiveQuestionIds(mapped.sectionSubjectiveQuestionIds);
        setManualMCQs({});
        setCsvMCQs({});
        setAiMCQs({});
        setManualSubjectiveQuestions({});
        setAiCodingProblems({});
        // The render this batch produces is the paper as saved: the unsaved-changes baseline is
        // taken from it (see the effect keyed on draftLoadCount).
        setDraftLoadCount((n) => n + 1);
        // A redirect here after a create (?fromDraft=N) has arrived: this page is now the draft
        // editor for that paper, and its buttons act on it.
        if (awaitingDraftRef.current === editingAssessmentId) {
          awaitingDraftRef.current = null;
          setLeaving(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          showToast(e instanceof Error ? e.message : "Failed to load draft assessment", "error");
          router.replace("/admin/assessment");
        }
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingAssessmentId, router, showToast]);

  // Put the draft's saved email into the editor once the editor exists: on step 0, after the
  // load, and when "Send notification email" mounts it. Declared after the step-0 re-seed from
  // the snapshot, so the saved email wins over a snapshot taken before the draft was loaded.
  useEffect(() => {
    const pending = pendingEmailRestoreRef.current;
    if (!pending || loadingDraft || activeStep !== 0) return;
    const editor = emailEditorRef.current;
    if (!editor) return;
    editor.setContent(pending.subject, pending.body);
    pendingEmailRestoreRef.current = null;
  }, [loadingDraft, activeStep, sendCommunication, draftLoadCount]);

  // The paper as saved, taken from the render the load produced (every loaded value is set in
  // one batch). Publish compares what is on screen with it.
  useEffect(() => {
    if (draftLoadCount === 0) return;
    savedFormSignatureRef.current = formSignature();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per load, from that render's state
  }, [draftLoadCount]);

  /** The audience picker's options. Batches are the targeting now: a legacy course tag keeps a
   *  paper off the rest of the tenant but gives nobody access (BE-A3a), so it is not offered. */
  const loadAudienceOptions = async () => {
    setLoadingCohorts(true);
    try {
      const rows = await adminCohortsService.listCohorts();
      setCohorts(rows.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (error: any) {
      // Non-fatal, but not silent: an empty picker and a lost list look identical otherwise.
      setCohorts([]);
      showToast(error?.message || "Failed to load batches", "error");
    } finally {
      setLoadingCohorts(false);
    }
  };

  /**
   * One page of the bank, filtered by the server.
   *
   * The facets come back on the same trip so the dropdowns narrow with the results - offering
   * a topic that matches nothing is how you get an empty list and no idea why.
   */
  const loadMCQPage = useCallback(
    async (query: MCQBankQuery) => {
      try {
        setLoadingMCQs(true);
        const filters = {
          q: query.search || undefined,
          difficulty: query.facets.difficulty || undefined,
          topic: query.facets.topics[0] || undefined,
          skill: query.facets.skills[0] || undefined,
          tag: query.facets.tags[0] || undefined,
        };
        const [page, facets] = await Promise.all([
          adminAssessmentService.getMCQPage(config.clientId, {
            ...filters,
            page: query.page,
            page_size: query.limit,
          }),
          adminAssessmentService
            .getQuestionBankFacets(config.clientId, "mcqs", filters)
            .catch(() => null),
        ]);
        setExistingMCQs(page.results);
        setMcqTotalCount(page.count);
        rememberMCQs(page.results);
        if (facets) {
          setMcqBankFacets({
            topics: facets.topics,
            skills: facets.skills,
            tags: facets.tags,
          });
        }
      } catch (error: any) {
        showToast(error?.message || "Failed to load MCQs", "error");
      } finally {
        setLoadingMCQs(false);
      }
    },
    [config.clientId, rememberMCQs, showToast],
  );

  const loadExistingCodingProblems = async () => {
    try {
      setLoadingCodingProblems(true);
      const data = await adminAssessmentService.getCodingProblems(
        config.clientId
      );
      setExistingCodingProblems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load coding problems", "error");
    } finally {
      setLoadingCodingProblems(false);
    }
  };

  const loadExistingSubjectiveQuestions = async () => {
    try {
      setLoadingSubjectiveQuestions(true);
      const data = await adminAssessmentService.listAssessmentSubjectiveQuestions(
        config.clientId
      );
      setExistingSubjectiveQuestions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load written questions", "error");
    } finally {
      setLoadingSubjectiveQuestions(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Preserve the composed email before the editor unmounts on step change.
      captureEmailSnapshot();
      // Validate basic info
      if (!title.trim() || !instructions.trim()) {
        showToast("Please fill in all required fields", "error");
        return;
      }
      if (durationMinutes < 1) {
        showToast("Duration must be at least 1 minute", "error");
        return;
      }
      if (isPaid && (!price || Number(price) <= 0)) {
        showToast("Please enter a valid price for paid assessment", "error");
        return;
      }
      if (sections.length === 0) {
        showToast("Please add at least one section", "error");
        return;
      }
      const sectionOverOverall = sections.find(
        (s) => sectionTimeLimitExceedsOverallMessage(durationMinutes, s.timeLimitMinutes)
      );
      if (sectionOverOverall) {
        showToast(
          "A section time limit is higher than the overall assessment duration. Fix it before continuing.",
          "error"
        );
        return;
      }
      if (passBandFieldErrors.lower || passBandFieldErrors.upper) {
        return;
      }
      if (tabSwitchLimitEnabled && tabSwitchLimitCount < 1) {
        showToast("Allowed tab switches must be at least 1", "error");
        return;
      }
      // Stop here, on the step that has the field, instead of letting the author build every
      // section and only hear about it from the server on the final click.
      const audienceError = audienceStepError(batchRequired, cohortIds);
      if (audienceError) {
        setAudienceAttempted(true);
        showToast(audienceError, "error");
        document
          .getElementById("assessment-batches-field")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    if (activeStep === 1) {
      // Validate questions for each section
      const quizSections = sections.filter((s) => s.type === "quiz");
      const codingSections = sections.filter((s) => s.type === "coding");
      const subjectiveSections = sections.filter((s) => s.type === "subjective");

      let hasQuizQuestions = false;
      let hasCodingProblems = false;
      let hasSubjectiveQuestions = false;

      // Check quiz sections (each section can have its own input method)
      if (quizSections.length > 0) {
        for (const section of quizSections) {
          const method = mcqInputMethodBySection[section.id] ?? "manual";
          if (method === "existing") {
            const ids = sectionMcqIds[section.id] || [];
            if (ids.length > 0) {
              hasQuizQuestions = true;
              break;
            }
          } else {
            const mcqs =
              manualMCQs[section.id] ||
              csvMCQs[section.id] ||
              aiMCQs[section.id] ||
              [];
            if (mcqs.length > 0) {
              hasQuizQuestions = true;
              break;
            }
          }
        }
      }

      // Check coding sections
      if (codingSections.length > 0) {
        for (const section of codingSections) {
          const ids = sectionCodingProblemIds[section.id] || [];
          const aiProblems = aiCodingProblems[section.id] || [];
          if (ids.length > 0 || aiProblems.length > 0) {
            hasCodingProblems = true;
            break;
          }
        }
      }

      if (subjectiveSections.length > 0) {
        for (const section of subjectiveSections) {
          const method = subjectiveInputMethodBySection[section.id] ?? "manual";
          if (method === "existing") {
            if ((sectionSubjectiveQuestionIds[section.id] || []).length > 0) {
              hasSubjectiveQuestions = true;
              break;
            }
          } else {
            const rows = manualSubjectiveQuestions[section.id] || [];
            const filled = rows.filter(
              (r) =>
                r.question_text.trim().length > 0 &&
                r.evaluation_prompt.trim().length > 0
            );
            if (filled.length > 0) {
              hasSubjectiveQuestions = true;
              break;
            }
          }
        }
      }

      // A project section carries no "questions" — the briefs are the work. Without this a
      // project-only paper, which is exactly what the feature exists to produce, could never
      // leave step 1: Continue stayed permanently disabled.
      const hasProjects = sections
        .filter((sec) => sec.type === "project")
        .some((sec) => (sectionProjectIds[sec.id] || []).length > 0);

      // At least one section type must have questions (or, for a project section, a brief)
      if (!hasQuizQuestions && !hasCodingProblems && !hasSubjectiveQuestions && !hasProjects) {
        showToast(
          "Please add at least one question to a section, or pick a project for a project section",
          "error"
        );
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Validation function to check if Next button should be enabled
  const isNextButtonDisabled = useMemo(() => {
    if (activeStep === 0) {
      // Step 0: Basic info validation
      if (!title.trim() || !instructions.trim()) {
        return true;
      }
      if (durationMinutes < 1) {
        return true;
      }
      if (isPaid && (!price || Number(price) <= 0)) {
        return true;
      }
      if (sections.length === 0) {
        return true;
      }
      if (
        sections.some((s) =>
          sectionTimeLimitExceedsOverallMessage(durationMinutes, s.timeLimitMinutes)
        )
      ) {
        return true;
      }
      if (passBandFieldErrors.lower || passBandFieldErrors.upper) {
        return true;
      }
      if (tabSwitchLimitEnabled && tabSwitchLimitCount < 1) {
        return true;
      }
      return false;
    }
    
    if (activeStep === 1) {
      // Step 1: Validate questions for each section
      const quizSections = sections.filter((s) => s.type === "quiz");
      const codingSections = sections.filter((s) => s.type === "coding");
      const subjectiveSections = sections.filter((s) => s.type === "subjective");

      // Check quiz sections
      for (const section of quizSections) {
        // Calculate total MCQs for this section (inline logic)
        let totalQuestions = 0;
        if (manualMCQs[section.id]) {
          totalQuestions += manualMCQs[section.id].length;
        }
        if (csvMCQs[section.id]) {
          totalQuestions += csvMCQs[section.id].length;
        }
        if (aiMCQs[section.id]) {
          totalQuestions += aiMCQs[section.id].length;
        }
        const existingIds = sectionMcqIds[section.id] || [];
        totalQuestions += existingIds.length;
        
        const requiredQuestions = section.number_of_questions_to_show ?? 1;
        
        if (totalQuestions < requiredQuestions) {
          return true; // Not enough questions
        }
      }
      
      // A project section needs at least one brief, and at least as many as it says it will
      // draw — a section promising 2 from a pool of 1 sets every learner the same project.
      for (const section of sections.filter((sec) => sec.type === "project")) {
        const picked = (sectionProjectIds[section.id] || []).length;
        if (picked < 1) return true;
        if ((section.number_of_questions_to_show ?? 1) > picked) return true;
      }

      // Check coding sections (count only selected IDs to avoid double-counting with AI list)
      for (const section of codingSections) {
        const totalProblems = (sectionCodingProblemIds[section.id] || []).length;
        const requiredProblems = section.number_of_questions_to_show ?? 1;
        if (totalProblems < requiredProblems) {
          return true; // Not enough problems
        }
      }

      for (const section of subjectiveSections) {
        const method = subjectiveInputMethodBySection[section.id] ?? "manual";
        let totalWritten = 0;
        if (method === "existing") {
          totalWritten = (sectionSubjectiveQuestionIds[section.id] || []).length;
        } else {
          const rows = manualSubjectiveQuestions[section.id] || [];
          totalWritten = rows.filter(
            (r) =>
              r.question_text.trim().length > 0 &&
              r.evaluation_prompt.trim().length > 0
          ).length;
        }
        const requiredWritten = section.number_of_questions_to_show ?? 1;
        if (totalWritten < requiredWritten) {
          return true;
        }
      }
      
      // At least one section type must have questions
      let hasQuizQuestions = false;
      let hasCodingProblems = false;
      let hasSubjectiveQuestions = false;
      
      if (quizSections.length > 0) {
        for (const section of quizSections) {
          let totalQuestions = 0;
          if (manualMCQs[section.id]) {
            totalQuestions += manualMCQs[section.id].length;
          }
          if (csvMCQs[section.id]) {
            totalQuestions += csvMCQs[section.id].length;
          }
          if (aiMCQs[section.id]) {
            totalQuestions += aiMCQs[section.id].length;
          }
          const existingIds = sectionMcqIds[section.id] || [];
          totalQuestions += existingIds.length;
          
          if (totalQuestions > 0) {
            hasQuizQuestions = true;
            break;
          }
        }
      }
      
      if (codingSections.length > 0) {
        for (const section of codingSections) {
          const totalProblems = (sectionCodingProblemIds[section.id] || []).length;
          if (totalProblems > 0) {
            hasCodingProblems = true;
            break;
          }
        }
      }

      if (subjectiveSections.length > 0) {
        for (const section of subjectiveSections) {
          const method = subjectiveInputMethodBySection[section.id] ?? "manual";
          if (method === "existing") {
            if ((sectionSubjectiveQuestionIds[section.id] || []).length > 0) {
              hasSubjectiveQuestions = true;
              break;
            }
          } else {
            const rows = manualSubjectiveQuestions[section.id] || [];
            if (
              rows.some(
                (r) =>
                  r.question_text.trim().length > 0 &&
                  r.evaluation_prompt.trim().length > 0
              )
            ) {
              hasSubjectiveQuestions = true;
              break;
            }
          }
        }
      }
      
      // A project section carries no "questions" — the briefs are the work. Without this a
      // project-only paper, which is exactly what the feature exists to produce, could never
      // leave step 1: Continue stayed permanently disabled.
      const hasProjects = sections
        .filter((sec) => sec.type === "project")
        .some((sec) => (sectionProjectIds[sec.id] || []).length > 0);

      if (!hasQuizQuestions && !hasCodingProblems && !hasSubjectiveQuestions && !hasProjects) {
        return true; // No questions and no projects at all
      }
      
      return false;
    }
    
    return false;
  }, [
    activeStep,
    title,
    instructions,
    durationMinutes,
    isPaid,
    price,
    sections,
    sectionMcqIds,
    manualMCQs,
    csvMCQs,
    aiMCQs,
    sectionCodingProblemIds,
    aiCodingProblems,
    subjectiveInputMethodBySection,
    manualSubjectiveQuestions,
    sectionSubjectiveQuestionIds,
    passBandFieldErrors.lower,
    passBandFieldErrors.upper,
    // Read inside the memo (line ~552) but were missing - Next stayed enabled with an
    // invalid tab-switch limit until an unrelated field changed.
    tabSwitchLimitEnabled,
    tabSwitchLimitCount,
      sectionProjectIds,
  ]);

  // Get total count of MCQs for a specific section (all sources combined)
  const getTotalMCQCountForSection = (sectionId: string): number => {
    let count = 0;
    
    // Manual MCQs
    if (manualMCQs[sectionId]) {
      count += manualMCQs[sectionId].length;
    }
    
    // CSV MCQs
    if (csvMCQs[sectionId]) {
      count += csvMCQs[sectionId].length;
    }
    
    // AI MCQs
    if (aiMCQs[sectionId]) {
      count += aiMCQs[sectionId].length;
    }
    
    // Existing pool MCQs
    const existingIds = sectionMcqIds[sectionId] || [];
    count += existingIds.length;
    
    return count;
  };

  // Get MCQs for a specific section - checks ALL input methods
  const getMCQsForSection = (sectionId: string): MCQ[] => {
    // Collect questions from all possible sources
    const allMCQs: MCQ[] = [];

    // Manual MCQs
    if (manualMCQs[sectionId] && manualMCQs[sectionId].length > 0) {
      allMCQs.push(...manualMCQs[sectionId]);
    }

    // CSV MCQs
    if (csvMCQs[sectionId] && csvMCQs[sectionId].length > 0) {
      allMCQs.push(...csvMCQs[sectionId]);
    }

    // AI MCQs
    if (aiMCQs[sectionId] && aiMCQs[sectionId].length > 0) {
      allMCQs.push(...aiMCQs[sectionId]);
    }

    // Existing pool MCQs (convert IDs to MCQ objects)
    const existingIds = sectionMcqIds[sectionId] || [];
    if (existingIds.length > 0) {
      const existingMCQsForSection = resolveSelectedMCQs(existingIds)
        .map((mcq) => ({
          question_text: mcq.question_text,
          option_a: mcq.option_a,
          option_b: mcq.option_b,
          option_c: mcq.option_c,
          option_d: mcq.option_d,
          correct_option: (mcq.correct_option as "A" | "B" | "C" | "D") || "A",
          explanation: mcq.explanation || "",
          difficulty_level:
            (mcq.difficulty_level as "Easy" | "Medium" | "Hard") || "Medium",
          topic: mcq.topic || "",
          skills: mcq.skills || "",
        }));
      allMCQs.push(...existingMCQsForSection);
    }

    return allMCQs;
  };

  // Get MCQ IDs for a specific section (for existing pool)
  const getMcqIdsForSection = (sectionId: string): number[] => {
    return sectionMcqIds[sectionId] || [];
  };

  // Get total count of coding problems for a specific section (all sources combined)
  const getTotalCodingProblemCountForSection = (sectionId: string): number => {
    return (sectionCodingProblemIds[sectionId] || []).length;
  };

  // Get Coding Problem IDs for a specific section
  const getCodingProblemIdsForSection = (sectionId: string): number[] => {
    return sectionCodingProblemIds[sectionId] || [];
  };

  // Get Coding Problems for a specific section (combines AI generated and existing)
  const getCodingProblemsForSection = (
    sectionId: string
  ): CodingProblemListItem[] => {
    const problems: CodingProblemListItem[] = [];

    // Add AI generated problems
    if (aiCodingProblems[sectionId] && aiCodingProblems[sectionId].length > 0) {
      problems.push(...aiCodingProblems[sectionId]);
    }

    // Add existing problems (from selected IDs)
    const selectedIds = sectionCodingProblemIds[sectionId] || [];
    if (selectedIds.length > 0) {
      const existingProblems = existingCodingProblems.filter((problem) =>
        selectedIds.includes(problem.id)
      );
      // Only add if not already in AI generated list (avoid duplicates)
      existingProblems.forEach((problem) => {
        if (!problems.some((p) => p.id === problem.id)) {
          problems.push(problem);
        }
      });
    }

    return problems;
  };

  const getTotalSubjectiveCountForSection = (sectionId: string): number => {
    const method = subjectiveInputMethodBySection[sectionId] ?? "manual";
    if (method === "existing") {
      return (sectionSubjectiveQuestionIds[sectionId] || []).length;
    }
    const rows = manualSubjectiveQuestions[sectionId] || [];
    return rows.filter(
      (r) =>
        r.question_text.trim().length > 0 &&
        r.evaluation_prompt.trim().length > 0
    ).length;
  };

  const getWrittenPromptsForSection = (
    sectionId: string
  ): WrittenPromptPreview[] => {
    const method = subjectiveInputMethodBySection[sectionId] ?? "manual";
    if (method === "existing") {
      const ids = sectionSubjectiveQuestionIds[sectionId] || [];
      return existingSubjectiveQuestions
        .filter((q) => ids.includes(q.id))
        .map((q) => ({
          question_text: q.question_text,
          max_marks: q.max_marks,
          answer_mode: q.answer_mode,
        }));
    }
    const drafts = manualSubjectiveQuestions[sectionId] || [];
    return drafts
      .filter(
        (r: SubjectiveQuestionDraft) =>
          r.question_text.trim().length > 0 &&
          r.evaluation_prompt.trim().length > 0
      )
      .map((r) => ({
        question_text: r.question_text,
        max_marks: r.max_marks,
        answer_mode: r.answer_mode,
      }));
  };

  // Get all MCQs across all sections with section information
  const getAllMCQsWithSections = (): Array<MCQ & { sectionId: string }> => {
    const quizSections = sections.filter((s) => s.type === "quiz");
    const allMCQs: Array<MCQ & { sectionId: string }> = [];
    quizSections.forEach((section) => {
      const sectionMCQs = getMCQsForSection(section.id);
      sectionMCQs.forEach((mcq) => {
        allMCQs.push({ ...mcq, sectionId: section.id });
      });
    });
    return allMCQs;
  };

  // Get all MCQs across all sections (for backward compatibility)
  const getAllMCQs = (): MCQ[] => {
    return getAllMCQsWithSections().map(({ sectionId, ...mcq }) => mcq);
  };

  /**
   * The request body a save sends, built from what is on screen. Pure: it reads state and
   * validates nothing (handleCreate validates first), so the unsaved-changes check can build the
   * same body and compare it with the last saved one.
   */
  const buildSavePayload = (): {
    payload: CreateAssessmentPayload;
    emailAttachment: File | null;
  } => {
    const quizSections = sections
      .filter((s) => s.type === "quiz")
      .sort((a, b) => a.order - b.order);
    const codingSections = sections
      .filter((s) => s.type === "coding")
      .sort((a, b) => a.order - b.order);
    const subjectiveSections = sections
      .filter((s) => s.type === "subjective")
      .sort((a, b) => a.order - b.order);

    // Convert datetime-local strings to IST ISO format (format: "2026-01-22T22:54:00+05:30")
    // Note: datetime-local input treats the entered time as local time, but we interpret it as IST
    const convertToIST = (dateTimeString: string): string | undefined => {
      if (!dateTimeString || !dateTimeString.trim()) {
        return undefined;
      }
      try {
        // datetime-local format: "YYYY-MM-DDTHH:mm" (no timezone, treated as local)
        // We interpret the entered time as IST time and format it with IST timezone offset
        let isoString = dateTimeString.trim();
        
        // If format is "YYYY-MM-DDTHH:mm", append ":00" for seconds
        if (isoString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          isoString = isoString + ":00";
        }
        
        // Parse the datetime string to extract components
        const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
        if (!match) {
          return undefined;
        }
        
        const [, year, month, day, hours, minutes, seconds] = match;
        
        // Validate the date components
        const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
        if (isNaN(date.getTime())) {
          return undefined;
        }
        
        // Return ISO format with IST timezone: "2026-01-22T22:54:00+05:30"
        // The time entered is treated as IST time, so we just append the IST offset
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
      } catch {
        return undefined;
      }
    };

    // Build payload with all sections
    const payload: CreateAssessmentPayload = {
      title: title.trim(),
      instructions: instructions.trim(),
      description: description.trim() || undefined,
      duration_minutes: durationMinutes,
      start_time: convertToIST(startTime),
      end_time: convertToIST(endTime),
      is_paid: isPaid,
      price: isPaid ? (price ? Number(price) : null) : null,
      currency: isPaid ? currency : undefined,
      // Sent even when blank: clearing it back to the institution's zone is a real
      // edit, and omitting the key would silently keep the old override.
      timezone,
      is_active: isActive,
      proctoring_enabled: proctoringEnabled,
      live_streaming: canConfigureLiveStreaming ? liveStreaming : false,
      // Pulled from the email editor below; populated in-place after the
      // payload is built.
      email_notification_enabled: false,
      email_subject: undefined,
      email_body: undefined,
      email_html: undefined,
      attachment_url: undefined,
      show_result: evaluationMode === "manual" ? false : showResult,
      evaluation_mode: evaluationMode,
      certificate_available: certificateAvailable,
      allow_movement: allowMovementAcrossSections,
      tab_switch_limit_enabled: tabSwitchLimitEnabled,
      tab_switch_limit_count: tabSwitchLimitEnabled ? tabSwitchLimitCount : null,
      allow_desktop: allowDesktop,
      allow_mobile: allowMobile,
      allow_tablet: allowTablet,
    };

    const passLower = toAssessmentApiDecimalString(passBandLowerPercent);
    const passUpper = toAssessmentApiDecimalString(passBandUpperPercent);
    if (passLower != null) payload.pass_band_lower_min_percent = passLower;
    if (passUpper != null) payload.pass_band_upper_min_percent = passUpper;

    // The batches are the targeting: no course_ids, because the server ignores them and logs
    // that it did, and a paper "targeted" by a retired tag reaches nobody.
    if (cohortIds.length > 0) {
      payload.cohort_ids = cohortIds;
    }

    // Add colleges if any colleges are specified
    if (colleges.length > 0) {
      payload.colleges = colleges;
    }

    // `emailNotificationEnabled` already accounts for toggle state AND the
    // editor having real content. Snapshot the editor only when we plan to
    // actually send something.
    // Prefer the live editor (when mounted, i.e. still on Step 0); otherwise use the
    // snapshot captured when we left Step 0 - the editor unmounts on later steps and
    // reading its null ref used to drop the whole composed email.
    const emailSnapshot = emailNotificationEnabled
      ? emailEditorRef.current?.getValues() ?? emailSnapshotRef.current
      : null;
    payload.email_notification_enabled = emailNotificationEnabled;
    payload.email_subject = emailSnapshot?.subject;
    payload.email_body = emailSnapshot?.body;
    // Render the full transactional email (header + body + footer) so the
    // backend can forward it verbatim and recipients see exactly what the
    // admin previewed.
    payload.email_html = emailSnapshot
      ? buildAssessmentNotificationEmailHtml({
          subject: emailSnapshot.subject,
          bodyHtml: emailSnapshot.body,
          clientName: clientInfo?.name?.trim() || "Your team",
          logoUrl: clientInfo?.app_logo_url ?? null,
          schedule: emailSchedule,
        })
      : undefined;
    payload.email_base_url = getPublicAppOrigin();
    // Scheduled reminders - additive to the on-publish send, only when notifications on.
    payload.email_reminders_enabled =
      emailNotificationEnabled && emailRemindersEnabled;
    payload.email_reminder_offsets = emailRemindersEnabled
      ? emailReminderOffsets
      : [];
    const emailAttachment = emailSnapshot?.attachment ?? null;
    // When the admin is keeping the previously-saved attachment (no new
    // file picked), pass the existing URL so the backend retains it.
    payload.attachment_url = emailSnapshot?.attachmentUrl ?? undefined;

    // Remove undefined fields to match exact API format
    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof typeof payload] === undefined) {
        delete payload[key as keyof typeof payload];
      }
    });

    const quizSectionsForPayload = quizSections.filter(
      (s) => getTotalMCQCountForSection(s.id) > 0
    );
    const codingSectionsForPayload = codingSections.filter(
      (s) => getTotalCodingProblemCountForSection(s.id) > 0
    );
    const subjectiveSectionsForPayload = subjectiveSections.filter(
      (s) => getTotalSubjectiveCountForSection(s.id) > 0
    );

    // Prepare quiz sections (API: `quizSection` camelCase array)
    if (quizSectionsForPayload.length > 0) {
      payload.quizSection = quizSectionsForPayload.map((section) => {
        const sectionMCQs = getMCQsForSection(section.id);
        const sectionMcqIds = getMcqIdsForSection(section.id);

        const manualMCQsForSection = manualMCQs[section.id] || [];
        const csvMCQsForSection = csvMCQs[section.id] || [];
        const aiMCQsForSection = aiMCQs[section.id] || [];
        const mcqsToSend = [
          ...manualMCQsForSection,
          ...csvMCQsForSection,
          ...aiMCQsForSection,
        ];

        const sectionPayload: AssessmentQuizSectionWrite = {
          title: section.title.trim(),
          order: section.order,
          number_of_questions:
            section.number_of_questions_to_show !== undefined
              ? section.number_of_questions_to_show
              : sectionMCQs.length,
        };

        if (section.description && section.description.trim()) {
          sectionPayload.description = section.description.trim();
        }

        if (section.easyScore !== undefined) {
          sectionPayload.easy_score = section.easyScore;
        }
        if (section.mediumScore !== undefined) {
          sectionPayload.medium_score = section.mediumScore;
        }
        if (section.hardScore !== undefined) {
          sectionPayload.hard_score = section.hardScore;
        }

        if (
          section.timeLimitMinutes != null &&
          Number.isFinite(section.timeLimitMinutes) &&
          section.timeLimitMinutes > 0
        ) {
          sectionPayload.time_limit_minutes = Math.round(
            section.timeLimitMinutes
          );
        }
        const cutoff = toAssessmentApiDecimalString(section.sectionCutoffMarks);
        if (cutoff != null) sectionPayload.section_cutoff_marks = cutoff;

        if (mcqsToSend.length > 0) {
          sectionPayload.mcqs = mcqsToSend;
        }

        if (sectionMcqIds.length > 0) {
          sectionPayload.mcq_ids = sectionMcqIds;
        }

        if (section.number_of_questions_to_show !== undefined) {
          sectionPayload.number_of_questions_to_show =
            section.number_of_questions_to_show;
        }

        return sectionPayload;
      });
    }

    // Prepare project sections (API: `projectSection` camelCase array). Briefs are referenced
    // by id — the hidden grader lives on the brief and never travels in an assessment payload.
    const projectSectionsForPayload = sections.filter((sec) => sec.type === "project");
    if (projectSectionsForPayload.length > 0) {
      payload.projectSection = projectSectionsForPayload.map((section) => {
        const ids = sectionProjectIds[section.id] ?? [];
        const sectionPayload: AssessmentProjectSectionWrite = {
          title: section.title.trim(),
          order: section.order,
          project_ids: ids,
          number_of_questions:
            section.number_of_questions_to_show && section.number_of_questions_to_show > 0
              ? Math.min(section.number_of_questions_to_show, ids.length || 1)
              : ids.length || 1,
        };
        if (section.description && section.description.trim()) {
          sectionPayload.description = section.description.trim();
        }
        if (
          section.sectionCutoffMarks != null &&
          String(section.sectionCutoffMarks).trim() !== ""
        ) {
          sectionPayload.section_cutoff_marks = String(section.sectionCutoffMarks);
        }
        return sectionPayload;
      });
    }

    // Prepare coding sections (API: `codingProblemSection` camelCase array)
    if (codingSectionsForPayload.length > 0) {
      payload.codingProblemSection = codingSectionsForPayload.map((section) => {
        const sectionCodingProblemIds = getCodingProblemIdsForSection(
          section.id
        );
        const sectionPayload: AssessmentCodingProblemSectionWrite = {
          title: section.title.trim(),
          order: section.order,
          number_of_questions:
            section.number_of_questions_to_show !== undefined
              ? section.number_of_questions_to_show
              : sectionCodingProblemIds.length,
          coding_problem_ids: sectionCodingProblemIds,
        };

        if (section.description && section.description.trim()) {
          sectionPayload.description = section.description.trim();
        }

        if (section.easyScore !== undefined) {
          sectionPayload.easy_score = section.easyScore;
        }
        if (section.mediumScore !== undefined) {
          sectionPayload.medium_score = section.mediumScore;
        }
        if (section.hardScore !== undefined) {
          sectionPayload.hard_score = section.hardScore;
        }

        if (
          section.timeLimitMinutes != null &&
          Number.isFinite(section.timeLimitMinutes) &&
          section.timeLimitMinutes > 0
        ) {
          sectionPayload.time_limit_minutes = Math.round(
            section.timeLimitMinutes
          );
        }
        const cutoff = toAssessmentApiDecimalString(section.sectionCutoffMarks);
        if (cutoff != null) sectionPayload.section_cutoff_marks = cutoff;

        if (section.number_of_questions_to_show !== undefined) {
          sectionPayload.number_of_questions_to_show =
            section.number_of_questions_to_show;
        }

        return sectionPayload;
      });
    }

    if (subjectiveSectionsForPayload.length > 0) {
      payload.subjectiveQuestionSection = subjectiveSectionsForPayload.map((section) => {
        const method = subjectiveInputMethodBySection[section.id] ?? "manual";
        const totalCount = getTotalSubjectiveCountForSection(section.id);

        const sectionPayload: AssessmentSubjectiveSectionWrite = {
          title: section.title.trim(),
          order: section.order,
          number_of_questions:
            section.number_of_questions_to_show !== undefined
              ? section.number_of_questions_to_show
              : totalCount,
        };

        if (section.description && section.description.trim()) {
          sectionPayload.description = section.description.trim();
        }

        if (section.easyScore !== undefined) {
          sectionPayload.easy_score = section.easyScore;
        }
        if (section.mediumScore !== undefined) {
          sectionPayload.medium_score = section.mediumScore;
        }
        if (section.hardScore !== undefined) {
          sectionPayload.hard_score = section.hardScore;
        }

        if (
          section.timeLimitMinutes != null &&
          Number.isFinite(section.timeLimitMinutes) &&
          section.timeLimitMinutes > 0
        ) {
          sectionPayload.time_limit_minutes = Math.round(
            section.timeLimitMinutes
          );
        }
        const subjectiveCutoff = toAssessmentApiDecimalString(
          section.sectionCutoffMarks
        );
        if (subjectiveCutoff != null) {
          sectionPayload.section_cutoff_marks = subjectiveCutoff;
        }

        if (method === "existing") {
          const ids = sectionSubjectiveQuestionIds[section.id] || [];
          if (ids.length > 0) {
            sectionPayload.subjective_question_ids = ids;
          }
        } else {
          const drafts = manualSubjectiveQuestions[section.id] || [];
          const filtered = drafts.filter(
            (r) =>
              r.question_text.trim().length > 0 &&
              r.evaluation_prompt.trim().length > 0
          );
          if (filtered.length > 0) {
            sectionPayload.subjective_questions = filtered.map((row) => ({
              question_text: row.question_text.trim(),
              evaluation_prompt: row.evaluation_prompt.trim(),
              max_marks: row.max_marks,
              ...(row.question_type?.trim()
                ? { question_type: row.question_type.trim() }
                : {}),
              ...(row.answer_mode ? { answer_mode: row.answer_mode } : {}),
            }));
          }
        }

        if (section.number_of_questions_to_show !== undefined) {
          sectionPayload.number_of_questions_to_show =
            section.number_of_questions_to_show;
        }

        return sectionPayload;
      });
    }

    payload.quizSection = payload.quizSection ?? [];
    payload.codingProblemSection = payload.codingProblemSection ?? [];
    payload.subjectiveQuestionSection = payload.subjectiveQuestionSection ?? [];

    return { payload, emailAttachment };
  };

  const handleCreate = async (options?: SubmitOptions) => {
    // One write at a time. `creating` disables the buttons, but only from the next render; a
    // second click (or a double-click) can land before it.
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setCreating(true);
      setSubmitIntent(options?.publish ? "publish" : "save");

      if (!allowDesktop && !allowMobile && !allowTablet) {
        showToast(t("assessmentDevice.atLeastOne"), "error");
        setCreating(false);
        return;
      }

      const quizSections = sections
        .filter((s) => s.type === "quiz")
        .sort((a, b) => a.order - b.order);
      const codingSections = sections
        .filter((s) => s.type === "coding")
        .sort((a, b) => a.order - b.order);
      const subjectiveSections = sections
        .filter((s) => s.type === "subjective")
        .sort((a, b) => a.order - b.order);

      const skipSectionValidation = Boolean(options?.skipSectionValidation);

      // Checked again at save, not only on Continue: the step can be reached without it (a
      // loaded draft, the stepper). A new DRAFT is checked too, because creating one is a POST
      // and the server refuses that without a batch just the same; only a save of an existing
      // paper (a PATCH, which does not carry the rule) skips it on the draft path.
      const audienceError = audienceStepError(batchRequired, cohortIds);
      if (audienceError && (!skipSectionValidation || !editingAssessmentId)) {
        showToast(audienceError, "error");
        setAudienceAttempted(true);
        setActiveStep(0);
        setCreating(false);
        return;
      }

      // Need at least one quiz, coding, written or project section block (relaxed for draft save)
      if (
        !skipSectionValidation &&
        quizSections.length === 0 &&
        codingSections.length === 0 &&
        subjectiveSections.length === 0 &&
        sections.filter((sec) => sec.type === "project").length === 0
      ) {
        showToast(
          "Please add at least one quiz, coding, written or project section",
          "error"
        );
        setCreating(false);
        return;
      }

      if (
        !skipSectionValidation &&
        durationMinutes >= 1 &&
        sections.some((s) =>
          sectionTimeLimitExceedsOverallMessage(durationMinutes, s.timeLimitMinutes)
        )
      ) {
        showToast(
          "A section time limit exceeds the overall assessment duration. Adjust times before creating.",
          "error"
        );
        setCreating(false);
        return;
      }

      // Validate that all quiz sections have at least 1 question
      if (!skipSectionValidation && quizSections.length > 0) {
        const sectionsWithoutQuestions: Array<{ title: string; order: number }> =
          [];
        quizSections.forEach((section) => {
          const sectionMCQs = getMCQsForSection(section.id);
          if (sectionMCQs.length === 0) {
            sectionsWithoutQuestions.push({
              title: section.title,
              order: section.order,
            });
          }
        });

        if (sectionsWithoutQuestions.length > 0) {
          const sectionNames = sectionsWithoutQuestions
            .sort((a, b) => a.order - b.order)
            .map((s) => `"${s.title}" (Order: ${s.order})`)
            .join(", ");
          showToast(
            `Please add at least 1 question to the following quiz sections: ${sectionNames}`,
            "error"
          );
          setCreating(false);
          return;
        }
      }

      // Validate number_of_questions_to_show for quiz sections
      const invalidQuizSections: Array<{ title: string; order: number; required: number; selected: number }> = [];
      if (!skipSectionValidation) quizSections.forEach((section) => {
        if (section.number_of_questions_to_show !== undefined) {
          const totalQuestions = getTotalMCQCountForSection(section.id);
          if (totalQuestions < section.number_of_questions_to_show) {
            invalidQuizSections.push({
              title: section.title,
              order: section.order,
              required: section.number_of_questions_to_show,
              selected: totalQuestions,
            });
          }
        }
      });

      if (!skipSectionValidation && invalidQuizSections.length > 0) {
        const errorMessages = invalidQuizSections
          .sort((a, b) => a.order - b.order)
          .map((s) => `"${s.title}" (Order: ${s.order}): Need ${s.required} questions, but only ${s.selected} selected`)
          .join("; ");
        showToast(
          `Quiz sections with insufficient questions: ${errorMessages}`,
          "error"
        );
        setCreating(false);
        return;
      }

      // Validate number_of_questions_to_show for coding sections
      const invalidCodingSections: Array<{ title: string; order: number; required: number; selected: number }> = [];
      if (!skipSectionValidation) {
        codingSections.forEach((section) => {
          if (section.number_of_questions_to_show !== undefined) {
            const totalProblems = getTotalCodingProblemCountForSection(section.id);
            if (totalProblems < section.number_of_questions_to_show) {
              invalidCodingSections.push({
                title: section.title,
                order: section.order,
                required: section.number_of_questions_to_show,
                selected: totalProblems,
              });
            }
          }
        });
      }

      if (!skipSectionValidation && invalidCodingSections.length > 0) {
        const errorMessages = invalidCodingSections
          .sort((a, b) => a.order - b.order)
          .map((s) => `"${s.title}" (Order: ${s.order}): Need ${s.required} problems, but only ${s.selected} selected`)
          .join("; ");
        showToast(
          `Coding sections with insufficient problems: ${errorMessages}`,
          "error"
        );
        setCreating(false);
        return;
      }

      if (!skipSectionValidation && subjectiveSections.length > 0) {
        const sectionsWithoutQuestions: Array<{ title: string; order: number }> =
          [];
        subjectiveSections.forEach((section) => {
          if (getTotalSubjectiveCountForSection(section.id) === 0) {
            sectionsWithoutQuestions.push({
              title: section.title,
              order: section.order,
            });
          }
        });

        if (sectionsWithoutQuestions.length > 0) {
          const sectionNames = sectionsWithoutQuestions
            .sort((a, b) => a.order - b.order)
            .map((s) => `"${s.title}" (Order: ${s.order})`)
            .join(", ");
          showToast(
            `Please add at least 1 written prompt to the following sections: ${sectionNames}`,
            "error"
          );
          setCreating(false);
          return;
        }
      }

      // Validate number_of_questions_to_show for subjective sections
      const invalidSubjectiveSections: Array<{
        title: string;
        order: number;
        required: number;
        selected: number;
      }> = [];
      if (!skipSectionValidation) {
        subjectiveSections.forEach((section) => {
          if (section.number_of_questions_to_show !== undefined) {
            const totalWritten = getTotalSubjectiveCountForSection(section.id);
            if (totalWritten < section.number_of_questions_to_show) {
              invalidSubjectiveSections.push({
                title: section.title,
                order: section.order,
                required: section.number_of_questions_to_show,
                selected: totalWritten,
              });
            }
          }
        });
      }

      if (!skipSectionValidation && invalidSubjectiveSections.length > 0) {
        const errorMessages = invalidSubjectiveSections
          .sort((a, b) => a.order - b.order)
          .map(
            (s) =>
              `"${s.title}" (Order: ${s.order}): Need ${s.required} prompts, but only ${s.selected} added`
          )
          .join("; ");
        showToast(
          `Written sections with insufficient prompts: ${errorMessages}`,
          "error"
        );
        setCreating(false);
        return;
      }

      // A section serves `number_of_questions_to_show` drawn at RANDOM from what was
      // picked, so anything picked beyond that count is never shown -- and not "the ones
      // added last", a different subset per student. The validations above only catch the
      // opposite mistake (asking for more than was picked), which is why an author could
      // configure 8, add 10, and publish with no indication that 2 would be dropped.
      const extraQuestionCandidates = skipSectionValidation
        ? []
        : [
            ...quizSections.map((sec) => ({
              title: sec.title,
              order: sec.order,
              serves: sec.number_of_questions_to_show,
              picked: getTotalMCQCountForSection(sec.id),
              noun: "questions",
            })),
            ...codingSections.map((sec) => ({
              title: sec.title,
              order: sec.order,
              serves: sec.number_of_questions_to_show,
              picked: getTotalCodingProblemCountForSection(sec.id),
              noun: "problems",
            })),
            ...subjectiveSections.map((sec) => ({
              title: sec.title,
              order: sec.order,
              serves: sec.number_of_questions_to_show,
              picked: getTotalSubjectiveCountForSection(sec.id),
              noun: "prompts",
            })),
          ];

      const extraQuestionSections = overSelectedSections(extraQuestionCandidates);

      if (!options?.acknowledgeExtraQuestions && extraQuestionSections.length > 0) {
        // Remember which button asked, so "…as configured" finishes the same action.
        pendingSubmitRef.current = options ?? {};
        setExtraQuestionPrompt(extraQuestionSections);
        setCreating(false);
        return;
      }

      if (passBandFieldErrors.lower || passBandFieldErrors.upper) {
        setActiveStep(0);
        setCreating(false);
        return;
      }

      if (skipSectionValidation) {
        if (!title.trim() || !instructions.trim()) {
          showToast("Title and instructions are required to save a draft.", "error");
          setCreating(false);
          return;
        }
        if (durationMinutes < 1) {
          showToast("Duration must be at least 1 minute.", "error");
          setCreating(false);
          return;
        }
      }

      const { payload, emailAttachment } = buildSavePayload();

      // The paper this click is about: the one this page was opened for, or the one it has
      // already created. Never a second one (see createdIdRef).
      const paperId = editingAssessmentId ?? createdIdRef.current;

      // Publishing a NEW paper saves it as a draft first, for every role, and then makes the same
      // publish call a reopened draft makes (publishCreatedDraft). The create endpoint forces a
      // scoped author's paper into a draft anyway; doing it for everyone means there is one way
      // a paper goes live from this page, with one set of checks.
      if (options?.forceDraft || (options?.publish && !editingAssessmentId)) {
        payload.is_draft = true;
        payload.is_active = false;
      }

      if (paperId) {
        if (options?.publish) {
          await saveThenPublish(paperId, payload, emailAttachment);
          return;
        }
        const activationError = await saveExistingPaper(paperId, payload, emailAttachment);
        showToast(
          activationError ??
            (options?.forceDraft ? "Draft saved successfully" : "Assessment updated successfully"),
          activationError ? "error" : "success",
        );
        if (editingAssessmentId === paperId) {
          leaveTo(`/admin/assessment/${paperId}/edit`);
        } else {
          leaveTo(`/admin/assessment/create?fromDraft=${paperId}`, paperId);
        }
      } else {
        const created = await adminAssessmentService.createAssessment(
          config.clientId,
          payload,
          emailAttachment
        );
        // Kept before anything else can happen: from here on, every click is about this paper.
        createdIdRef.current = created.id;
        setCreatedAssessmentId(created.id);
        if (options?.publish) {
          // The draft exists now. Whatever happens next, the author is told the truth about it.
          await publishCreatedDraft(created.id);
          return;
        }
        showToast(
          options?.forceDraft
            ? (t("assessmentPublish.savedDraft", {
                defaultValue: "Saved as a draft. Learners cannot see it until you publish it.",
              }) as string)
            : "Assessment created successfully",
          "success"
        );
        if (options?.forceDraft) {
          leaveTo(`/admin/assessment/create?fromDraft=${created.id}`, created.id);
        } else {
          leaveTo("/admin/assessment");
        }
      }
    } catch (error: any) {
      showToast(
        error?.message ||
          (editingAssessmentId ? "Failed to update assessment" : "Failed to create assessment"),
        "error"
      );
    } finally {
      submittingRef.current = false;
      setCreating(false);
      setSubmitIntent(null);
    }
  };

  /**
   * Save the paper this page is working on (not a new one). A live paper's Active switch goes on
   * its own `{ is_active }` request, which the server authorises like publish; inside the content
   * save it was refused for an instructor who may publish but not edit. On a draft `is_active`
   * is not activation - publishing is - so a draft's save carries it as it always has.
   *
   * Throws when the content save fails. Returns the message to show when only the switch did
   * not move, or null.
   */
  const saveExistingPaper = async (
    paperId: number,
    payload: CreateAssessmentPayload,
    attachment: File | null,
  ): Promise<string | null> => {
    if (editingAssessmentId === paperId && !loadedIsDraft) {
      const result = await saveAssessmentWithActivation({
        clientId: config.clientId,
        assessmentId: paperId,
        payload,
        attachment,
        wasActive: loadedIsActiveRef.current,
        isActive,
      });
      if (!result.ok && result.stage === "content") throw result.error;
      if (!result.ok) {
        const reason =
          result.error instanceof Error && result.error.message ? result.error.message : "";
        return isActive
          ? (t("assessmentPublish.activationFailed", {
              defaultValue: "Your changes were saved, but the assessment was not activated. {{reason}}",
              reason,
            }) as string)
          : (t("assessmentPublish.deactivationFailed", {
              defaultValue: "Your changes were saved, but the assessment was not deactivated. {{reason}}",
              reason,
            }) as string);
      }
      return null;
    }
    await adminAssessmentService.updateAssessment(config.clientId, paperId, payload, attachment);
    return null;
  };

  /**
   * Publish with unsaved changes: save them, then publish, so what is on screen is what goes live.
   * The publish call makes the SAVED paper live and the server sends the SAVED email, so skipping
   * the save published the old version while the author looked at the new one.
   *
   * If the save fails, nothing is published. The one exception is a refusal (403) for a scoped
   * author: they may publish this paper without being allowed to change it, so they are offered
   * the version the server holds instead of being stopped.
   */
  const saveThenPublish = async (
    paperId: number,
    payload: CreateAssessmentPayload,
    attachment: File | null,
  ) => {
    try {
      await adminAssessmentService.updateAssessment(config.clientId, paperId, payload, attachment);
    } catch (e: unknown) {
      const reason = e instanceof Error && e.message ? e.message : "Failed to save";
      if (
        editingAssessmentId === paperId &&
        isScopedAdminRole(user?.role) &&
        apiErrorStatus(e) === 403
      ) {
        setLastSavedPrompt({ reason });
        return;
      }
      showToast(
        t("assessmentPublish.notSavedNotPublished", {
          defaultValue: "Your changes could not be saved, so nothing was published: {{reason}}",
          reason,
        }) as string,
        "error",
      );
      return;
    }
    // Saved: the screen is the last saved version now, so a retry after a failed publish does not
    // save again.
    rememberSavedState();
    if (editingAssessmentId === paperId) {
      try {
        // No attachment: it went up with the save.
        await publishDraftById(paperId, false);
      } catch (e: unknown) {
        const reason = e instanceof Error && e.message ? e.message : "Failed to publish";
        showToast(
          t("assessmentPublish.savedNotPublished", {
            defaultValue: "Saved as a draft, but not published: {{reason}}",
            reason,
          }) as string,
          "error",
        );
      }
      return;
    }
    await publishCreatedDraft(paperId);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await handleCreate({ skipSectionValidation: true, forceDraft: true });
    } finally {
      setSavingDraft(false);
    }
  };

  /**
   * Every submit button's off switch. `leaving` holds them off between a write and the route it
   * sends the author to. `awaitingCreatedPaper` is the same guarantee from the created id itself:
   * once this page has made a paper, it acts again only as that paper's editor, never as a blank
   * form that would make another.
   */
  const awaitingCreatedPaper =
    createdAssessmentId !== null && editingAssessmentId !== createdAssessmentId;
  const saveDraftDisabled =
    creating || loadingDraft || savingDraft || leaving || awaitingCreatedPaper;
  /** A new paper, or a reopened draft. A paper that is already live has nothing to publish. */
  const showPublish = !editingAssessmentId || loadedIsDraft;

  const renderSaveDraftButton = (opts?: { compact?: boolean }) => {
    const compact = opts?.compact ?? false;
    const label = savingDraft ? "Saving…" : "Save draft";
    const btn = (
      <Button
        variant="outlined"
        color="secondary"
        size={compact ? "small" : "medium"}
        onClick={() => void handleSaveDraft()}
        disabled={saveDraftDisabled}
        startIcon={
          savingDraft ? (
            <CircularProgress size={compact ? 14 : 16} color="inherit" aria-hidden />
          ) : (
            <IconWrapper icon="mdi:content-save-outline" size={compact ? 18 : 20} />
          )
        }
        aria-busy={savingDraft}
        sx={{
          borderColor: "color-mix(in srgb, var(--font-secondary) 35%, var(--border-default) 65%)",
          color: "var(--font-primary)",
          fontWeight: 600,
          textTransform: "none",
          letterSpacing: "0.01em",
          px: compact ? 1.5 : 2,
          "&:hover": {
            borderColor: "var(--accent-indigo)",
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg) 94%)",
          },
          "&.Mui-disabled": {
            borderColor: "var(--border-default)",
          },
        }}
      >
        {label}
      </Button>
    );
    return (
      <Tooltip
        title={
          editingAssessmentId
            ? "Updates your draft on the server. Learners still cannot see it until you publish."
            : "Saves progress as a draft (title, settings, and any sections you’ve started). You can leave and continue later. Learners never see drafts until you publish."
        }
        placement="bottom"
        arrow
        enterDelay={400}
      >
        <span>{btn}</span>
      </Tooltip>
    );
  };

  /**
   * The publish request, built once for both doors: a reopened draft (handlePublishAssessment)
   * and a new paper (publishCreatedDraft). Snapshots the email editor so the call carries the
   * notification details (subject, body, rendered HTML, attachment).
   */
  const buildPublishRequest = (activate: boolean) => {
    const emailSnapshot = emailNotificationEnabled
      ? emailEditorRef.current?.getValues() ?? emailSnapshotRef.current
      : null;
    const body = {
      is_active: activate,
      email_notification_enabled: emailNotificationEnabled,
      email_base_url: getPublicAppOrigin(),
      ...(emailSnapshot
        ? {
            email_subject: emailSnapshot.subject,
            email_body: emailSnapshot.body,
            email_html: buildAssessmentNotificationEmailHtml({
              subject: emailSnapshot.subject,
              bodyHtml: emailSnapshot.body,
              clientName: clientInfo?.name?.trim() || "Your team",
              logoUrl: clientInfo?.app_logo_url ?? null,
              schedule: emailSchedule,
            }),
            // Retain the previously-saved attachment unless a new file was
            // picked (in which case the multipart `email_attachment` wins).
            ...(emailSnapshot.attachmentUrl
              ? { attachment_url: emailSnapshot.attachmentUrl }
              : {}),
          }
        : {}),
    };
    return { body, attachment: emailSnapshot?.attachment ?? null };
  };

  /** The draft editor's publish: the saved draft goes live, active. Throws when it fails. */
  const publishDraftById = async (id: number, withAttachment: boolean) => {
    const { body, attachment } = buildPublishRequest(true);
    await adminAssessmentService.publishAssessment(
      config.clientId,
      id,
      body,
      withAttachment ? attachment : null,
    );
    showToast("Assessment published", "success");
    setLoadedIsDraft(false);
    leaveTo(`/admin/assessment/${id}/edit`);
  };

  /** Publish the draft as saved. Used when nothing on screen differs from it, or when asked to. */
  const handlePublishAssessment = async (options?: { lastSavedVersion?: boolean }) => {
    if (!editingAssessmentId || !config.clientId) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setCreating(true);
      setSubmitIntent("publish");
      // "The last saved version" means exactly that: a file picked since is not sent either.
      await publishDraftById(editingAssessmentId, !options?.lastSavedVersion);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to publish", "error");
    } finally {
      submittingRef.current = false;
      setCreating(false);
      setSubmitIntent(null);
    }
  };

  /**
   * Everything a save sends except the notification email, as one comparable string. The email
   * is compared on its own (emailDiffersFromSaved) because the editor settles a render after the
   * load: its "has content" flag, and with it `email_notification_enabled` and
   * `email_reminders_enabled` in the body, arrive late and would read as a change.
   */
  const formSignature = (): string => {
    const form: Record<string, unknown> = { ...buildSavePayload().payload };
    for (const key of EMAIL_PAYLOAD_KEYS) delete form[key];
    form.email_reminders_switch = emailRemindersEnabled;
    return JSON.stringify(form);
  };

  /** Whether the email a save would send differs from the saved one. A new file always does. */
  const emailDiffersFromSaved = (): boolean => {
    const values = emailEditorRef.current?.getValues() ?? emailSnapshotRef.current;
    if (emailNotificationEnabled && values?.attachment) return true;
    const saved = savedEmailRef.current;
    if (!saved) return false;
    if (emailNotificationEnabled !== saved.enabled) return true;
    if (!emailNotificationEnabled || !values) return false;
    return values.subject.trim() !== saved.subject || values.body.trim() !== saved.body;
  };

  /** Does the screen differ from the paper as last saved? Unknown counts as yes. */
  const hasUnsavedChanges = (): boolean => {
    if (savedFormSignatureRef.current === null) return true;
    if (formSignature() !== savedFormSignatureRef.current) return true;
    return emailDiffersFromSaved();
  };

  /** After a save: what is on screen is the last saved version. */
  const rememberSavedState = () => {
    savedFormSignatureRef.current = formSignature();
    const values = emailEditorRef.current?.getValues() ?? emailSnapshotRef.current;
    savedEmailRef.current = {
      enabled: emailNotificationEnabled,
      subject: (values?.subject ?? "").trim(),
      body: (values?.body ?? "").trim(),
    };
  };

  /**
   * Publish in the draft editor. Nothing changed: publish the saved draft. Something changed: save
   * it first (handleCreate's full checks, then saveThenPublish), so the edits go live with it.
   */
  const handleDraftEditorPublish = () => {
    if (hasUnsavedChanges()) {
      void handleCreate({ publish: true });
    } else {
      void handlePublishAssessment();
    }
  };

  /**
   * The second half of "Publish assessment" on a NEW paper, which handleCreate has just saved as
   * a draft: the same publish call a reopened draft makes, so the server runs the same checks
   * (the paper is yours, it has questions) and sends the same notifications and email.
   *
   * It never throws. If the publish fails the paper is still a draft, and the author is told what
   * the server actually holds - read back, not assumed, because a publish can fail after it has
   * saved (a lost response, a notification that could not be queued). A paper is either a draft
   * they can reopen and publish, or live; the message never leaves them guessing which.
   */
  const publishCreatedDraft = async (id: number) => {
    // No attachment here: it went up with the create, and resending it would turn this into a
    // multipart request, where the server reads no `is_active` and always activates.
    const { body } = buildPublishRequest(isActive);
    try {
      await adminAssessmentService.publishAssessment(config.clientId, id, body);
      showToast(
        isActive
          ? (t("assessmentPublish.published", { defaultValue: "Assessment published." }) as string)
          : (t("assessmentPublish.publishedInactive", {
              defaultValue:
                "Assessment published as inactive. Learners will not see it until it is activated.",
            }) as string),
        "success",
      );
      leaveTo(`/admin/assessment/${id}/edit`);
      return;
    } catch (e: unknown) {
      const reason = e instanceof Error && e.message ? e.message : "Failed to publish";
      let stillDraft: boolean | null = null;
      try {
        const detail = (await adminAssessmentService.getAssessmentById(config.clientId, id)) as {
          is_draft?: boolean;
        };
        stillDraft = detail.is_draft !== false;
      } catch {
        stillDraft = null;
      }
      if (stillDraft === true) {
        showToast(
          t("assessmentPublish.savedNotPublished", {
            defaultValue: "Saved as a draft, but not published: {{reason}}",
            reason,
          }) as string,
          "error",
        );
        // The draft editor, where "Publish assessment" is one click once the problem is fixed.
        // The buttons stay off until it has loaded; from then on they act on this paper.
        leaveTo(`/admin/assessment/create?fromDraft=${id}`, id);
      } else if (stillDraft === false) {
        showToast(
          t("assessmentPublish.publishedWithError", {
            defaultValue: "The assessment was published, but the server also reported: {{reason}}",
            reason,
          }) as string,
          "warning",
        );
        leaveTo(`/admin/assessment/${id}/edit`);
      } else {
        showToast(
          t("assessmentPublish.publishUnknown", {
            defaultValue:
              "The assessment is saved, but we could not confirm whether it was published: {{reason}}",
            reason,
          }) as string,
          "warning",
        );
        // The paper's own page shows whether it is a draft or live.
        leaveTo(`/admin/assessment/${id}/edit`);
      }
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <BasicInfoSection
              title={title}
              instructions={instructions}
              description={description}
              onTitleChange={setTitle}
              onInstructionsChange={setInstructions}
              onDescriptionChange={setDescription}
            />
            <AssessmentSettingsSection
              batchRequired={batchRequired}
              batchError={audienceAttempted ? audienceStepError(batchRequired, cohortIds) : null}
              durationMinutes={durationMinutes}
              startTime={startTime}
              endTime={endTime}
              isPaid={isPaid}
              price={price}
              currency={currency}
              isActive={isActive}
              retiredCourseTitles={retiredCourseTitles}
              cohortIds={cohortIds}
              cohorts={cohorts}
              loadingCohorts={loadingCohorts}
              onCohortIdsChange={setCohortIds}
              colleges={colleges}
              proctoringEnabled={proctoringEnabled}
              liveStreaming={liveStreaming}
              showLiveStreamingToggle={canConfigureLiveStreaming}
              sendCommunication={sendCommunication}
              emailNotificationEnabled={emailNotificationEnabled}
              onEmailEnabledChange={setEmailEditorHasData}
              emailRemindersEnabled={emailRemindersEnabled}
              emailReminderOffsets={emailReminderOffsets}
              onEmailRemindersEnabledChange={setEmailRemindersEnabled}
              onEmailReminderOffsetsChange={setEmailReminderOffsets}
              emailEditorRef={emailEditorRef}
              defaultEmailSubject={defaultEmailSubject}
              defaultEmailBody={defaultEmailBody}
              existingEmailAttachmentUrl={existingEmailAttachmentUrl}
              existingEmailAttachmentName={existingEmailAttachmentName}
              emailSchedule={emailSchedule}
              showResult={showResult}
              evaluationMode={evaluationMode}
              allowMovementAcrossSections={allowMovementAcrossSections}
              tabSwitchLimitEnabled={tabSwitchLimitEnabled}
              tabSwitchLimitCount={tabSwitchLimitCount}
              certificateAvailable={certificateAvailable}
              passBandLowerPercent={passBandLowerPercent}
              passBandUpperPercent={passBandUpperPercent}
              passBandLowerError={passBandFieldErrors.lower}
              passBandUpperError={passBandFieldErrors.upper}
              allowDesktop={allowDesktop}
              allowMobile={allowMobile}
              allowTablet={allowTablet}
              onDurationChange={setDurationMinutes}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onPaidChange={setIsPaid}
              onPriceChange={setPrice}
              onCurrencyChange={setCurrency}
              timezone={timezone}
              onTimezoneChange={setTimezone}
              onActiveChange={setIsActive}
              onCollegesChange={setColleges}
              onProctoringEnabledChange={setProctoringEnabled}
              onLiveStreamingChange={setLiveStreaming}
              onSendCommunicationChange={(value) => {
                setSendCommunication(value);
                if (value) {
                  // Toggling on must guarantee data is present so the
                  // visibility flag (which depends on data) flips true.
                  // No-op-safe: the ref may be null right before the editor
                  // mounts, in which case the editor's useState initializer
                  // will seed defaults on mount automatically.
                  emailEditorRef.current?.seedDefaults();
                }
              }}
              onShowResultChange={setShowResult}
              onEvaluationModeChange={setEvaluationMode}
              onAllowMovementAcrossSectionsChange={setAllowMovementAcrossSections}
              onTabSwitchLimitEnabledChange={setTabSwitchLimitEnabled}
              onTabSwitchLimitCountChange={setTabSwitchLimitCount}
              onCertificateAvailableChange={setCertificateAvailable}
              onPassBandLowerPercentChange={setPassBandLowerPercent}
              onPassBandUpperPercentChange={setPassBandUpperPercent}
              onAllowDesktopChange={setAllowDesktop}
              onAllowMobileChange={setAllowMobile}
              onAllowTabletChange={setAllowTablet}
            />
            <MultipleSectionsSection
              sections={sections}
              onSectionsChange={setSections}
              overallDurationMinutes={durationMinutes}
            />
          </Box>
        );

      case 1:
        return (
          <SectionBasedQuestionsInput
            sectionProjectIds={sectionProjectIds}
            onSectionProjectIdsChange={(sectionId, ids) =>
              setSectionProjectIds((prev) => ({ ...prev, [sectionId]: ids }))
            }
            evaluationMode={evaluationMode}
            onAddSection={handleOutlineAddSection}
            sections={sections}
            mcqInputMethodBySection={mcqInputMethodBySection}
            onMcqInputMethodChange={(sectionId, method) => {
              setMcqInputMethodBySection((prev) => ({ ...prev, [sectionId]: method }));
            }}
            sectionMcqIds={sectionMcqIds}
            onSectionMcqIdsChange={(sectionId, ids) => {
              setSectionMcqIds((prev) => ({ ...prev, [sectionId]: ids }));
            }}
            manualMCQs={manualMCQs}
            onManualMCQsChange={(sectionId, mcqs) => {
              setManualMCQs((prev) => ({ ...prev, [sectionId]: mcqs }));
            }}
            csvMCQs={csvMCQs}
            onCsvMCQsChange={(sectionId, mcqs) => {
              setCsvMCQs((prev) => ({ ...prev, [sectionId]: mcqs }));
            }}
            aiMCQs={aiMCQs}
            onAiMCQsChange={(sectionId, mcqs) => {
              setAiMCQs((prev) => ({ ...prev, [sectionId]: mcqs }));
            }}
            existingMCQs={existingMCQs}
            mcqServer={{
              facetOptions: mcqBankFacets,
              totalCount: mcqTotalCount,
              onQueryChange: loadMCQPage,
            }}
            loadingMCQs={loadingMCQs}
            codingInputMethodBySection={codingInputMethodBySection}
            onCodingInputMethodChange={(sectionId, method) => {
              setCodingInputMethodBySection((prev) => ({ ...prev, [sectionId]: method }));
            }}
            sectionCodingProblemIds={sectionCodingProblemIds}
            onSectionCodingProblemIdsChange={(sectionId, ids) => {
              setSectionCodingProblemIds((prev) => ({
                ...prev,
                [sectionId]: ids,
              }));
            }}
            aiCodingProblems={aiCodingProblems}
            onAiCodingProblemsChange={(sectionId, problems) => {
              setAiCodingProblems((prev) => ({
                ...prev,
                [sectionId]: problems,
              }));
            }}
            existingCodingProblems={existingCodingProblems}
            loadingCodingProblems={loadingCodingProblems}
            subjectiveInputMethodBySection={subjectiveInputMethodBySection}
            onSubjectiveInputMethodChange={(sectionId, method) => {
              setSubjectiveInputMethodBySection((prev) => ({
                ...prev,
                [sectionId]: method,
              }));
            }}
            manualSubjectiveQuestions={manualSubjectiveQuestions}
            onManualSubjectiveQuestionsChange={(sectionId, rows) => {
              setManualSubjectiveQuestions((prev) => ({
                ...prev,
                [sectionId]: rows,
              }));
            }}
            sectionSubjectiveQuestionIds={sectionSubjectiveQuestionIds}
            onSectionSubjectiveQuestionIdsChange={(sectionId, ids) => {
              setSectionSubjectiveQuestionIds((prev) => ({
                ...prev,
                [sectionId]: ids,
              }));
            }}
            existingSubjectiveQuestions={existingSubjectiveQuestions}
            loadingSubjectiveQuestions={loadingSubjectiveQuestions}
          />
        );

      case 2:
        const totalMCQsWithSections = getAllMCQsWithSections();
        const totalMCQs = getAllMCQs();
        const orderedSections = [...sections].sort((a, b) => a.order - b.order);
        const previewSectionTitle =
          orderedSections.find((s) => s.type === "quiz")?.title ??
          orderedSections.find((s) => s.type === "coding")?.title ??
          orderedSections.find((s) => s.type === "subjective")?.title ??
          "";

        return (
          <AssessmentPreviewSection
            title={title}
            durationMinutes={durationMinutes}
            isActive={isActive}
            isPaid={isPaid}
            price={price}
            currency={currency}
            sectionTitle={previewSectionTitle}
            totalMCQs={totalMCQs}
            totalMCQsWithSections={totalMCQsWithSections}
            sections={sections}
            getMCQsForSection={getMCQsForSection}
            getCodingProblemIdsForSection={getCodingProblemIdsForSection}
            getCodingProblemsForSection={getCodingProblemsForSection}
            getWrittenPromptsForSection={getWrittenPromptsForSection}
          />
        );

      default:
        return null;
    }
  };

  const hasProjectSection = sections.some((sec) => sec.type === "project");
  useEffect(() => {
    if (!hasProjectSection || projectBriefs.length) return;
    let cancelled = false;
    listProjects()
      .then((all) => !cancelled && setProjectBriefs(all))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hasProjectSection, projectBriefs.length]);

  const projectBriefsById = useMemo(
    () => Object.fromEntries(projectBriefs.map((b) => [b.id, b])) as Record<
      number,
      AdminProjectTemplate
    >,
    [projectBriefs]
  );

  // Live outline (Phase 4): per-section question counts from the existing helpers.
  const sectionQuestionCount = (s: Section): number => {
    if (s.type === "coding") return getTotalCodingProblemCountForSection(s.id);
    if (s.type === "subjective") return getTotalSubjectiveCountForSection(s.id);
    if (s.type === "project") {
      // What the learner is actually SET, not the size of the pool — the same clamp the
      // server's max-score roll-up applies.
      const picked = (sectionProjectIds[s.id] || []).length;
      const draw = s.number_of_questions_to_show;
      return draw && draw > 0 ? Math.min(draw, picked) : picked;
    }
    return getTotalMCQCountForSection(s.id);
  };
  const outlineSections = [...sections].sort((a, b) => a.order - b.order);
  const totalOutlineQuestions = sections.reduce((sum, s) => sum + sectionQuestionCount(s), 0);
  // Real difficulty roll-up + max score across every authored/selected question, mirroring
  // the per-section count conventions (all MCQ sources combined; subjective by method).
  const outlineStats = (() => {
    const balance = { easy: 0, medium: 0, hard: 0 };
    let maxScore = 0;
    const bucket = (d: unknown): "easy" | "medium" | "hard" => {
      const x = String(d ?? "").toLowerCase();
      return x.startsWith("e") ? "easy" : x.startsWith("h") ? "hard" : "medium";
    };
    for (const s of sections) {
      if (s.type === "quiz") {
        const picked = new Set(sectionMcqIds[s.id] ?? []);
        const qs = [
          ...(manualMCQs[s.id] ?? []),
          ...(csvMCQs[s.id] ?? []),
          ...(aiMCQs[s.id] ?? []),
          ...resolveSelectedMCQs(Array.from(picked)),
        ];
        for (const q of qs) {
          const k = bucket(q.difficulty_level);
          balance[k] += 1;
          maxScore += k === "easy" ? (s.easyScore ?? 1) : k === "hard" ? (s.hardScore ?? 3) : (s.mediumScore ?? 2);
        }
      } else if (s.type === "project") {
        // A project carries its marks on the brief rather than on a difficulty band, so it adds
        // to the paper's worth without moving the easy/medium/hard split — the same rule the
        // server's roll-up follows. Left out, the outline showed a project paper as worth 0 pts.
        const picked = sectionProjectIds[s.id] ?? [];
        const draw = s.number_of_questions_to_show;
        const chosen = draw && draw > 0 ? picked.slice(0, draw) : picked;
        for (const id of chosen) {
          const brief = projectBriefsById[id];
          maxScore += Number(brief?.max_marks ?? 0) || 0;
        }
      } else if (s.type === "coding") {
        const picked = new Set(sectionCodingProblemIds[s.id] ?? []);
        const seen = new Set<number>();
        const probs = [
          ...(aiCodingProblems[s.id] ?? []),
          ...existingCodingProblems.filter((p) => picked.has(p.id)),
        ].filter((p) => {
          if (p.id == null) return true;
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        for (const q of probs) {
          const k = bucket(q.difficulty_level);
          balance[k] += 1;
          maxScore += k === "easy" ? (s.easyScore ?? 10) : k === "hard" ? (s.hardScore ?? 30) : (s.mediumScore ?? 20);
        }
      } else {
        const method = subjectiveInputMethodBySection[s.id] ?? "manual";
        if (method === "existing") {
          const picked = new Set(sectionSubjectiveQuestionIds[s.id] ?? []);
          for (const q of existingSubjectiveQuestions.filter((x) => picked.has(x.id))) {
            maxScore += Number(q.max_marks ?? 0) || 0;
          }
        } else {
          for (const r of manualSubjectiveQuestions[s.id] ?? []) {
            maxScore += Number(r.max_marks ?? 0) || 0;
          }
        }
      }
    }
    const hasBalance = balance.easy + balance.medium + balance.hard > 0;
    return { balance, maxScore, hasBalance };
  })();
  const handleOutlineAddSection = () => {
    if (activeStep !== 0) setActiveStep(0);
    // let step 0 mount, then bring the sections builder into view
    setTimeout(() => {
      document.getElementById("sections-builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };
  const sectionTypeMeta = (t: string) =>
    t === "coding"
      ? { icon: "mdi:code-tags", label: "Coding" }
      : t === "subjective"
      ? { icon: "mdi:text-box-outline", label: "Written" }
      // Without a project case the final ternary's "else" claimed every project section was a
      // Quiz, and routed its count through the MCQ counter, which returned 0.
      : t === "project"
      ? { icon: "mdi:hammer-wrench", label: "Project" }
      : { icon: "mdi:format-list-checks", label: "Quiz" };

  return (
    <MainLayout>
      <PhoneFloor>
      <Box sx={{ p: { xs: 2, sm: 3 }, [PHONE]: { px: 0, pt: 0 } }}>
        <AssessmentBreadcrumb segments={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Assessments", href: "/admin/assessment" }, { label: "Create assessment" }]} />
        {/* Header - adaptive design (Phase 2 revamp) */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.back()}
            sx={{ mb: 2, color: "var(--accent-indigo)", textTransform: "none" }}
          >
            Back to Assessments
          </Button>
          <AssessmentSectionHero
            chapter={editingAssessmentId ? "EDIT · DRAFT" : "NEW ASSESSMENT"}
            title={editingAssessmentId ? "Edit draft assessment" : "Create Assessment"}
            subtitle={
              editingAssessmentId
                ? "Changes are stored as a draft until you publish. Use Save draft anytime; use Save assessment when sections are ready."
                : "Use Save draft to keep work in progress without publishing. Learners only see the assessment after you publish from the final step or the edit screen."
            }
            accent="indigo"
            icon="mdi:clipboard-plus-outline"
            rightSlot={
              /* One save-draft affordance only (declutter): the button's own label
                 already reflects the saving state. */
              renderSaveDraftButton()
            }
          />
        </Box>

        {/* Horizontal 3-step progress band (redesign mockup) */}
        <Paper
          elevation={0}
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            mb: 3,
            borderRadius: "16px",
            border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
            boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
            bgcolor: "var(--card-bg)",
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.25, md: 2 },
          }}
        >
          {steps.map((label, i) => {
            const state = i === activeStep ? "active" : i < activeStep ? "done" : "todo";
            const clickable = i < activeStep;
            return (
              <Fragment key={label}>
                {i > 0 ? (
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: "2px",
                      minWidth: 20,
                      borderRadius: 999,
                      bgcolor: i <= activeStep ? "var(--success-500)" : "var(--border-default)",
                    }}
                  />
                ) : null}
                <Box
                  onClick={() => { if (clickable) setActiveStep(i); }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.1,
                    flexShrink: 0,
                    cursor: clickable ? "pointer" : "default",
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      ...(state === "done"
                        ? { bgcolor: "var(--success-500)", color: "#fff" }
                        : state === "active"
                        ? { background: "var(--gradient-ai)", color: "#fff" }
                        : { bgcolor: "var(--surface)", color: "var(--font-tertiary)" }),
                    }}
                  >
                    {state === "done" ? <IconWrapper icon="mdi:check" size={18} /> : i + 1}
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: state === "active" ? 800 : 600,
                      fontFamily: "var(--font-jakarta)",
                      fontSize: "0.95rem",
                      color:
                        state === "active"
                          ? "var(--font-primary)"
                          : state === "done"
                          ? "var(--font-secondary)"
                          : "var(--font-tertiary)",
                      display: { xs: state === "active" ? "block" : "none", sm: "block" },
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              </Fragment>
            );
          })}
        </Paper>

        {/* Content grid: Live outline (left, steps 1 & 3 - step 2 brings its own section
            outline inside SectionBasedQuestionsInput) + step content on the canvas */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: activeStep === 1 ? "1fr" : "minmax(260px, 300px) 1fr",
            },
            gap: 3,
            alignItems: "start",
            // The canvas column is `1fr`, but a grid item's min-width defaults to its content's,
            // so a wide child (the review step's six KPI tiles) widened the column instead of
            // being contained by it.
            ...CARD_GRID_ITEM_SX,
          }}
        >
          {activeStep !== 1 ? (
            <Box sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
              <Box
                sx={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  bgcolor: "var(--card-bg)",
                  border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
                }}
              >
                {/* gradient header (mockup "Live outline / Updates as you build") */}
                <Box sx={{ px: 2.25, py: 1.75, background: "var(--gradient-ai)", color: "#fff", display: "flex", alignItems: "center", gap: 1 }}>
                  <IconWrapper icon="mdi:clipboard-text-outline" size={18} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontFamily: "var(--font-jakarta)", fontSize: "0.98rem", lineHeight: 1.2 }}>
                      Live outline
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" }, opacity: 0.85 }}>Updates as you build</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 2.25 }}>
                  <Typography
                    sx={{
                      fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" },
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "var(--font-tertiary)",
                      textTransform: "uppercase",
                      mb: 0.75,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title.trim() || "Untitled assessment"}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                    {proctoringEnabled ? (
                      <StatusChip label="Proctored" tone="proctored" icon="mdi:shield-check-outline" />
                    ) : null}
                    <StatusChip label={`${durationMinutes}m`} tone="info" icon="mdi:clock-outline" />
                    <StatusChip label={`${sections.length} section${sections.length === 1 ? "" : "s"}`} tone="neutral" />
                  </Box>
                  {outlineSections.length === 0 ? (
                    <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                      Add sections below. They&apos;ll appear here with live question counts.
                    </Typography>
                  ) : (
                    outlineSections.map((s) => {
                      const meta = sectionTypeMeta(s.type);
                      return (
                        <Box
                          key={s.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            px: 1.5,
                            py: 1.25,
                            mb: 1,
                            borderRadius: "12px",
                            bgcolor: "color-mix(in srgb, var(--ai-violet) 6%, var(--card-bg) 94%)",
                            border: "1px solid color-mix(in srgb, var(--ai-violet) 14%, var(--border-default) 86%)",
                          }}
                        >
                          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", flexShrink: 0, color: "var(--ai-violet)", bgcolor: "var(--card-bg)", border: "1px solid color-mix(in srgb, var(--ai-violet) 20%, var(--border-default) 80%)" }}>
                            <IconWrapper icon={meta.icon} size={18} />
                          </Box>
                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-jakarta)", color: "var(--font-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {s.title?.trim() || meta.label}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                              {meta.label} · {sectionQuestionCount(s)} question{sectionQuestionCount(s) === 1 ? "" : "s"}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                  <Box
                    onClick={handleOutlineAddSection}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOutlineAddSection(); } }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.75,
                      py: 1.4,
                      mt: 0.5,
                      borderRadius: "12px",
                      border: "1.5px dashed color-mix(in srgb, var(--font-tertiary) 55%, transparent)",
                      color: "var(--font-secondary)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease",
                      "&:hover": {
                        borderColor: "var(--ai-violet)",
                        color: "var(--ai-violet)",
                        bgcolor: "color-mix(in srgb, var(--ai-violet) 5%, transparent)",
                      },
                    }}
                  >
                    <IconWrapper icon="mdi:plus" size={18} /> Add section
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5, pt: 1.5, borderTop: "1px solid var(--border-default)" }}>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--font-primary)" }}>Total questions</Typography>
                    <Box sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.1rem", color: "var(--font-primary)" }}>
                      {totalOutlineQuestions}
                    </Box>
                  </Box>
                  {outlineStats.maxScore > 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.75 }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--font-primary)" }}>Max score</Typography>
                      <Box sx={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.1rem", color: "var(--font-primary)" }}>
                        {outlineStats.maxScore} pts
                      </Box>
                    </Box>
                  ) : null}
                  {outlineStats.hasBalance ? (
                    <Box sx={{ mt: 1.25 }}>
                      <DifficultyBalanceMeter balance={outlineStats.balance} legend={false} height={8} />
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>
          ) : null}

          {/* Step content sits directly on the canvas; each section renders its own cards */}
          <Box sx={{ minWidth: 0 }}>
            {loadingDraft ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress sx={{ color: "var(--ai-violet)" }} />
              </Box>
            ) : (
              renderStepContent()
            )}
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            gap: 2,
          }}
        >
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
              borderRadius: "12px",
              color: "var(--font-primary)",
              bgcolor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
              "&:hover": { bgcolor: "var(--card-bg)", borderColor: "var(--accent-indigo)" },
              "&.Mui-disabled": { color: "var(--font-tertiary)", bgcolor: "var(--surface)" },
            }}
          >
            Back
          </Button>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            {activeStep === steps.length - 1 ? (
              <>
                {/* The same pair on a new paper as on a reopened draft. A new paper used to offer
                    only "Create Assessment", which an instructor's create turns into a draft, so
                    the only way to publish was to leave, reopen the draft and come back here.
                    Publish is the filled, primary action and sits last; Save keeps a draft. On a
                    paper that is already live there is nothing to publish, and Save is the one
                    filled button. */}
                <Button
                  variant={showPublish ? "outlined" : "contained"}
                  onClick={() =>
                    // A new paper is saved as a draft; a reopened one keeps what it is.
                    void (editingAssessmentId ? handleCreate() : handleCreate({ forceDraft: true }))
                  }
                  disabled={saveDraftDisabled}
                  startIcon={
                    submitIntent === "save" ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <IconWrapper icon={showPublish ? "mdi:content-save-outline" : "mdi:check"} size={18} />
                    )
                  }
                  sx={showPublish ? SECONDARY_ACTION_SX : PRIMARY_ACTION_SX}
                >
                  {submitIntent === "save"
                    ? t("assessmentPublish.saving", { defaultValue: "Saving…" })
                    : "Save assessment"}
                </Button>
                {showPublish && (
                  <Button
                    variant="contained"
                    onClick={() =>
                      editingAssessmentId
                        ? handleDraftEditorPublish()
                        : void handleCreate({ publish: true })
                    }
                    disabled={saveDraftDisabled}
                    startIcon={
                      submitIntent === "publish" ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <IconWrapper icon="mdi:rocket-launch-outline" size={18} />
                      )
                    }
                    sx={PRIMARY_ACTION_SX}
                  >
                    {submitIntent === "publish"
                      ? t("assessmentPublish.publishing", { defaultValue: "Publishing…" })
                      : "Publish assessment"}
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isNextButtonDisabled || savingDraft}
                endIcon={<IconWrapper icon="mdi:arrow-right" size={18} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  borderRadius: "12px",
                  color: "#fff",
                  background: "var(--gradient-ai)",
                  boxShadow: "0 10px 22px -12px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
                  "&:hover": { filter: "brightness(1.05)" },
                  "&.Mui-disabled": {
                    color: "var(--font-secondary)",
                    background: "color-mix(in srgb, var(--ai-violet) 18%, var(--surface) 82%)",
                  },
                }}
              >
                Continue
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Picking more questions than a section serves is silent by design -- the extras are
          simply never drawn. This is the only point at which the author finds out. */}
      <SheetDialog
        open={extraQuestionPrompt !== null}
        onClose={() => setExtraQuestionPrompt(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Some questions will not be shown
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Each section shows a fixed number of questions, drawn at random from the ones you
            picked. Anything beyond that number is never shown, and a different student loses a
            different set.
          </Alert>
          <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
            {(extraQuestionPrompt ?? []).map((x) => (
              <Box component="li" key={`${x.title}-${x.order}`} sx={{ mb: 0.75 }}>
                <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                  <strong>{x.title}</strong> shows {x.serves} of the {x.picked} {x.noun} you
                  picked &mdash; {x.picked - (x.serves ?? 0)} left out.
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={() => setExtraQuestionPrompt(null)} sx={{ textTransform: "none" }}>
            Go back and edit
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setExtraQuestionPrompt(null);
              // Finish what was asked for: a publish stays a publish, a save stays a save.
              void handleCreate({ ...pendingSubmitRef.current, acknowledgeExtraQuestions: true });
            }}
            sx={{ textTransform: "none" }}
          >
            {pendingSubmitRef.current.publish
              ? t("assessmentPublish.publishAsConfigured", { defaultValue: "Publish as configured" })
              : t("assessmentPublish.saveAsConfigured", { defaultValue: "Save as configured" })}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // Raise each section's count to what was actually picked, so nothing is
              // dropped. The counts are the only thing changing; the picks stay as they are.
              const raise = new Map(
                (extraQuestionPrompt ?? []).map((x) => [`${x.title}|${x.order}`, x.picked]),
              );
              setSections((prev) =>
                prev.map((sec) => {
                  const next = raise.get(`${sec.title}|${sec.order}`);
                  return next === undefined
                    ? sec
                    : { ...sec, number_of_questions_to_show: next };
                }),
              );
              setExtraQuestionPrompt(null);
              showToast(
                "Question counts raised to include every question you picked.",
                "success",
              );
            }}
            sx={{ textTransform: "none" }}
          >
            Show them all
          </Button>
        </DialogActions>
      </SheetDialog>

      {/* Publish found edits this author may not save: they can publish the paper, not change
          it. Say plainly what will go live - the saved paper and the saved email - and let them
          choose, rather than publishing something other than what is on screen without a word. */}
      <SheetDialog
        open={lastSavedPrompt !== null}
        onClose={() => setLastSavedPrompt(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t("assessmentPublish.lastSavedTitle", {
            defaultValue: "Publish the last saved version?",
          })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "var(--font-primary)", mb: 1.5 }}>
            {t("assessmentPublish.lastSavedBody", {
              defaultValue:
                "Your unsaved changes will not be included. Learners get the assessment, and its notification email, exactly as they were last saved.",
            })}
          </Typography>
          {lastSavedPrompt?.reason ? (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              {t("assessmentPublish.lastSavedReason", {
                defaultValue: "Your changes could not be saved: {{reason}}",
                reason: lastSavedPrompt.reason,
              })}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={() => setLastSavedPrompt(null)} sx={{ textTransform: "none" }}>
            {t("assessmentPublish.keepEditing", { defaultValue: "Keep editing" })}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setLastSavedPrompt(null);
              void handlePublishAssessment({ lastSavedVersion: true });
            }}
            sx={{ textTransform: "none" }}
          >
            {t("assessmentPublish.publishLastSaved", {
              defaultValue: "Publish last saved version",
            })}
          </Button>
        </DialogActions>
      </SheetDialog>

      </PhoneFloor>
    </MainLayout>
  );
}

export default function CreateAssessmentPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
            <CircularProgress />
          </Box>
        </MainLayout>
      }
    >
      <CreateAssessmentPageContent />
    </Suspense>
  );
}
