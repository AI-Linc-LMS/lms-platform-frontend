"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JobCreateUpdatePayload } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { formatJobPassoutYear } from "@/lib/services/jobs-v2.service";
import type { SelectedStudent } from "../SelectStudentsDialog";

/* ==========================================================================
 * The create/edit form's whole brain: hydration, validation, dirt and drafts.
 *
 * Three shipped bugs die here (spec 5.10 / 5.11):
 *   1. **Hydration identity.** The reset effect keys on a stable `initialKey` STRING, not on
 *      object identity, so a late-arriving course list can no longer reset `formData` and
 *      `activeStep` and wipe everything typed so far.
 *   2. **`mandatory_skills` stops being overwritten.** `mandatory_skills: formData.key_skills`
 *      in the old submit payload is the root of the duplicated-skills bug on the detail page.
 *      The two lists are now two separate chip bins and the payload sends each one once.
 *   3. **Validation is real.** Per-field errors with messages, URLs actually parsed, and the
 *      three percentages clamped 0-100 in `onChange` — the advisory `inputProps` they had let
 *      500% save fine.
 * ======================================================================== */

export type SkillBin = "mandatory_skills" | "key_skills";

/** Which step owns which field, so a validation failure marks the right stepper node. */
const FIELD_STEP: Record<string, number> = {
  job_title: 0,
  company_name: 0,
  company_logo: 0,
  apply_link: 0,
  location: 0,
  job_type: 0,
  employment_type: 0,
  industry_type: 0,
  role_category: 0,
  number_of_openings: 0,
  job_description: 1,
  role_process: 1,
  company_info: 1,
  mandatory_skills: 1,
  key_skills: 1,
  years_of_experience: 2,
  salary: 2,
  education: 2,
  department: 2,
  ug_requirements: 2,
  pg_requirements: 2,
  applicable_passout_year: 2,
  min_10th_percentage: 2,
  min_12th_percentage: 2,
  min_graduation_percentage: 2,
  course_ids: 3,
  adaptive_course_ids: 3,
  assigned_student_ids: 3,
  college_mappings: 3,
  question_ids: 3,
  is_published: 3,
  status: 3,
  application_deadline: 3,
};

export const STEP_COUNT = 4;

export const emptyPayload: JobCreateUpdatePayload = {
  job_title: "",
  company_name: "",
  company_logo: "",
  company_info: "",
  job_description: "",
  role_process: "",
  mandatory_skills: [],
  key_skills: [],
  industry_type: "",
  department: "",
  employment_type: "",
  role_category: "",
  education: "",
  ug_requirements: "",
  pg_requirements: "",
  location: "",
  years_of_experience: "",
  salary: "",
  apply_link: "",
  job_type: "job",
  is_published: false,
  status: "active",
  application_deadline: "",
  number_of_openings: null,
  applicable_passout_year: null,
  min_10th_percentage: null,
  min_12th_percentage: null,
  min_graduation_percentage: null,
  college_mappings: [],
  course_ids: [],
  adaptive_course_ids: [],
  assigned_student_ids: [],
  question_ids: [],
};

/** Positive integer or null - coerces API values; never keeps a string in state. */
export function parseNumberOfOpeningsInput(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    if (!Number.isFinite(v) || !Number.isInteger(v) || v < 1) return null;
    return v;
  }
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

/** `http(s)` only. A `javascript:` or protocol-relative "URL" is not a link we will publish. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Clamp a typed percentage into 0-100, in `onChange` — not by an advisory `inputProps`. */
export function clampPercentage(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

export function hydrateFromJob(initialData: Partial<JobV2> | null | undefined): {
  data: JobCreateUpdatePayload;
  students: SelectedStudent[];
} {
  if (!initialData) {
    return { data: { ...emptyPayload, question_ids: [] }, students: [] };
  }
  const extra = initialData as {
    college_mappings?: Array<{ college_name: string; department?: string; batch?: string }>;
    courses?: Array<{ id: number }>;
    adaptive_courses?: Array<{ id: number }>;
    question_ids?: number[];
    application_deadline?: string;
    status?: JobCreateUpdatePayload["status"];
    number_of_openings?: number | string | null;
    applicable_passout_year?: string | number | null;
    min_10th_percentage?: number | null;
    min_12th_percentage?: number | null;
    min_graduation_percentage?: number | null;
  };
  const rawDeadline = extra.application_deadline ?? initialData.application_deadline ?? "";
  const formattedDeadline =
    typeof rawDeadline === "string" && rawDeadline.trim()
      ? rawDeadline.includes("T")
        ? rawDeadline.split("T")[0]
        : rawDeadline.trim()
      : "";

  return {
    data: {
      job_title: initialData.job_title ?? "",
      company_name: initialData.company_name ?? "",
      company_logo: initialData.company_logo ?? "",
      company_info: initialData.company_info ?? "",
      job_description: initialData.job_description ?? "",
      role_process: initialData.role_process ?? "",
      mandatory_skills: initialData.mandatory_skills ?? [],
      key_skills: initialData.key_skills ?? [],
      industry_type: initialData.industry_type ?? "",
      department: initialData.department ?? "",
      employment_type: initialData.employment_type ?? "",
      role_category: initialData.role_category ?? "",
      education: initialData.education ?? "",
      ug_requirements: initialData.ug_requirements ?? "",
      pg_requirements: initialData.pg_requirements ?? "",
      location: initialData.location ?? "",
      years_of_experience: initialData.years_of_experience ?? "",
      salary: initialData.salary ?? "",
      apply_link: initialData.apply_link ?? "",
      job_type: initialData.job_type ?? "job",
      is_published: initialData.is_published ?? false,
      // Exhaustive: a job at `on_hold` opens with `on_hold` selected, so opening and saving it
      // can no longer silently reactivate it.
      status: extra.status ?? "active",
      application_deadline: formattedDeadline,
      number_of_openings: parseNumberOfOpeningsInput(extra.number_of_openings),
      applicable_passout_year: extra.applicable_passout_year ?? null,
      min_10th_percentage: extra.min_10th_percentage ?? null,
      min_12th_percentage: extra.min_12th_percentage ?? null,
      min_graduation_percentage: extra.min_graduation_percentage ?? null,
      college_mappings: (extra.college_mappings ?? []).map((m) => ({
        college_name: m.college_name,
        department: m.department,
        batch: m.batch,
      })),
      course_ids: (extra.courses ?? []).map((c) => c.id),
      adaptive_course_ids: (extra.adaptive_courses ?? []).map((c) => c.id),
      assigned_student_ids: (initialData.assigned_students ?? []).map((s) => s.id),
      question_ids: extra.question_ids ?? [],
    },
    students: initialData.assigned_students ?? [],
  };
}

interface DraftEnvelope {
  data: JobCreateUpdatePayload;
  students: SelectedStudent[];
  savedAt: number;
}

function draftKey(id: string) {
  return `jobs-v2:jobform:${id}`;
}

function readDraft(id: string): DraftEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope;
    if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
    return parsed;
  } catch {
    // A private window, a cleared store, or a browser that throws on access. Not an error.
    return null;
  }
}

function writeDraft(id: string, envelope: DraftEnvelope) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(draftKey(id), JSON.stringify(envelope));
  } catch {
    /* Quota or a blocked store. The form still works; it just has no safety net. */
  }
}

function clearDraft(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(draftKey(id));
  } catch {
    /* see writeDraft */
  }
}

/** Everything that counts as "the admin typed something". The File is compared by name+size. */
function snapshot(
  data: JobCreateUpdatePayload,
  students: SelectedStudent[],
  jdFile: File | null,
): string {
  return JSON.stringify([
    data,
    students.map((s) => s.id).sort((a, b) => a - b),
    jdFile ? `${jdFile.name}:${jdFile.size}` : null,
  ]);
}

export type FieldErrors = Partial<Record<keyof JobCreateUpdatePayload | "company_logo_preview", string>>;

export interface UseJobFormOptions {
  /**
   * A STABLE string identity for the record being edited ("new", "new:scraped:42", "job:17").
   * The reset effect keys on this, never on `initialData`'s object identity.
   */
  initialKey: string;
  initialData?: Partial<JobV2> | null;
  /** sessionStorage draft slot: `jobs-v2:jobform:{draftId}`. */
  draftId: string;
  /** Copy for the field messages, so this hook ships no hardcoded English. */
  messages: {
    required: string;
    invalidUrl: string;
    minOpenings: string;
    logoUnreachable: string;
  };
}

export interface JobFormApi {
  data: JobCreateUpdatePayload;
  setField: <K extends keyof JobCreateUpdatePayload>(
    field: K,
    value: JobCreateUpdatePayload[K],
  ) => void;
  setPercentage: (
    field: "min_10th_percentage" | "min_12th_percentage" | "min_graduation_percentage",
    raw: string,
  ) => void;
  setOpenings: (raw: string) => void;

  assignedStudents: SelectedStudent[];
  setAssignedStudents: (students: SelectedStudent[]) => void;

  jdFile: File | null;
  setJdFile: (file: File | null) => void;

  /** The logo URL failed to load an image. Set by the preview's `onError`. */
  logoBroken: boolean;
  setLogoBroken: (broken: boolean) => void;

  activeStep: number;
  goToStep: (index: number) => void;
  goNext: () => void;
  goBack: () => void;

  errors: FieldErrors;
  /** Errors are only shown once a step has been attempted or a save tried. */
  showErrors: boolean;
  stepHasError: (index: number) => boolean;
  validateStep: (index: number) => boolean;
  validateAll: () => boolean;
  firstInvalidStep: number | null;

  dirty: boolean;
  draftRestored: boolean;
  dismissDraftNotice: () => void;
  startOver: () => void;

  addSkill: (bin: SkillBin, value: string) => void;
  removeSkill: (bin: SkillBin, index: number) => void;
  addCollege: (name: string) => void;
  removeCollege: (index: number) => void;
  toggleQuestion: (id: number) => void;
  selectQuestion: (id: number) => void;

  buildPayload: () => JobCreateUpdatePayload;
  markSaved: () => void;
}

export function useJobForm({
  initialKey,
  initialData,
  draftId,
  messages,
}: UseJobFormOptions): JobFormApi {
  const hydrated = useMemo(() => hydrateFromJob(initialData), [initialData]);

  const [data, setData] = useState<JobCreateUpdatePayload>(hydrated.data);
  const [assignedStudents, setAssignedStudentsState] = useState<SelectedStudent[]>(
    hydrated.students,
  );
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [logoBroken, setLogoBroken] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  /**
   * The clean snapshot every edit is compared against. It is STATE, not a ref: `dirty` is
   * derived from it, so a ref would leave the form reading dirty forever after a save and keep
   * the `beforeunload` guard armed on a form with nothing left to lose.
   */
  const [baseline, setBaseline] = useState<string>(() =>
    snapshot(hydrated.data, hydrated.students, null),
  );
  const appliedKey = useRef<string | null>(null);

  // ---- hydration ---------------------------------------------------------
  // Keyed on the STABLE string. `initialData` is a fresh object on every parent render for the
  // scraped prefill path (it is a `useMemo` over three fetches), and keying on it is what wiped
  // typed input the moment the course list arrived.
  useEffect(() => {
    if (appliedKey.current === initialKey) return;
    appliedKey.current = initialKey;

    const fresh = hydrateFromJob(initialData);
    const draft = readDraft(draftId);
    if (draft) {
      setData(draft.data);
      setAssignedStudentsState(draft.students ?? []);
      setDraftRestored(true);
    } else {
      setData(fresh.data);
      setAssignedStudentsState(fresh.students);
      setDraftRestored(false);
    }
    // The baseline is always the SERVER state, so a restored draft correctly reads as dirty.
    setBaseline(snapshot(fresh.data, fresh.students, null));
    setActiveStep(0);
    setShowErrors(false);
    setLogoBroken(false);
    // `initialData` is intentionally read but not depended on: the key is the identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey, draftId]);

  const dirty = useMemo(
    () => snapshot(data, assignedStudents, jdFile) !== baseline,
    [assignedStudents, baseline, data, jdFile],
  );

  // ---- autosave ----------------------------------------------------------
  // Only a dirty form has anything worth keeping, so a saved form stops writing on its own.
  useEffect(() => {
    if (!dirty) return undefined;
    const timer = setTimeout(() => {
      writeDraft(draftId, { data, students: assignedStudents, savedAt: Date.now() });
    }, 1000);
    return () => clearTimeout(timer);
  }, [data, assignedStudents, dirty, draftId]);

  // ---- mutation ----------------------------------------------------------
  const setField = useCallback(
    <K extends keyof JobCreateUpdatePayload>(field: K, value: JobCreateUpdatePayload[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));
      if (field === "company_logo") setLogoBroken(false);
    },
    [],
  );

  const setPercentage = useCallback(
    (
      field: "min_10th_percentage" | "min_12th_percentage" | "min_graduation_percentage",
      raw: string,
    ) => {
      setData((prev) => ({ ...prev, [field]: clampPercentage(raw) }));
    },
    [],
  );

  const setOpenings = useCallback((raw: string) => {
    setData((prev) => ({ ...prev, number_of_openings: parseNumberOfOpeningsInput(raw) }));
  }, []);

  const setAssignedStudents = useCallback((students: SelectedStudent[]) => {
    setAssignedStudentsState(students);
    setData((prev) => ({ ...prev, assigned_student_ids: students.map((s) => s.id) }));
  }, []);

  const addSkill = useCallback((bin: SkillBin, value: string) => {
    const skill = value.trim();
    if (!skill) return;
    setData((prev) => {
      const list = prev[bin] ?? [];
      // Case-folded de-duplication, so the detail page cannot show the same skill twice.
      if (list.some((s) => s.trim().toLowerCase() === skill.toLowerCase())) return prev;
      return { ...prev, [bin]: [...list, skill] };
    });
  }, []);

  const removeSkill = useCallback((bin: SkillBin, index: number) => {
    setData((prev) => {
      const list = [...(prev[bin] ?? [])];
      list.splice(index, 1);
      return { ...prev, [bin]: list };
    });
  }, []);

  const addCollege = useCallback((name: string) => {
    const college = name.trim();
    if (!college) return;
    setData((prev) => {
      const list = prev.college_mappings ?? [];
      if (list.some((m) => m.college_name.trim().toLowerCase() === college.toLowerCase())) {
        return prev;
      }
      return { ...prev, college_mappings: [...list, { college_name: college }] };
    });
  }, []);

  const removeCollege = useCallback((index: number) => {
    setData((prev) => {
      const list = [...(prev.college_mappings ?? [])];
      list.splice(index, 1);
      return { ...prev, college_mappings: list };
    });
  }, []);

  const toggleQuestion = useCallback((id: number) => {
    setData((prev) => {
      const ids = prev.question_ids ?? [];
      return ids.includes(id)
        ? { ...prev, question_ids: ids.filter((q) => q !== id) }
        : { ...prev, question_ids: [...ids, id] };
    });
  }, []);

  const selectQuestion = useCallback((id: number) => {
    setData((prev) => {
      const ids = prev.question_ids ?? [];
      return ids.includes(id) ? prev : { ...prev, question_ids: [...ids, id] };
    });
  }, []);

  // ---- validation --------------------------------------------------------
  const errors = useMemo<FieldErrors>(() => {
    const next: FieldErrors = {};
    if (!data.job_title.trim()) next.job_title = messages.required;
    if (!data.company_name.trim()) next.company_name = messages.required;
    // The logo is OPTIONAL now: CompanyLogo's initials fallback is a good default, and a public
    // image URL was the hardest field on the form while blocking step 1 entirely.
    if (data.company_logo?.trim() && !isHttpUrl(data.company_logo)) {
      next.company_logo = messages.invalidUrl;
    } else if (data.company_logo?.trim() && logoBroken) {
      next.company_logo = messages.logoUnreachable;
    }
    if (data.apply_link?.trim() && !isHttpUrl(data.apply_link)) {
      next.apply_link = messages.invalidUrl;
    }
    if (data.number_of_openings != null && data.number_of_openings < 1) {
      next.number_of_openings = messages.minOpenings;
    }
    return next;
  }, [data, logoBroken, messages]);

  const stepHasError = useCallback(
    (index: number) =>
      Object.keys(errors).some((field) => (FIELD_STEP[field] ?? 0) === index),
    [errors],
  );

  const firstInvalidStep = useMemo(() => {
    const steps = Object.keys(errors).map((field) => FIELD_STEP[field] ?? 0);
    return steps.length ? Math.min(...steps) : null;
  }, [errors]);

  const validateStep = useCallback(
    (index: number) => {
      setShowErrors(true);
      return !stepHasError(index);
    },
    [stepHasError],
  );

  const validateAll = useCallback(() => {
    setShowErrors(true);
    return Object.keys(errors).length === 0;
  }, [errors]);

  // ---- navigation --------------------------------------------------------
  const goToStep = useCallback((index: number) => {
    setActiveStep(Math.min(Math.max(index, 0), STEP_COUNT - 1));
  }, []);

  const goNext = useCallback(() => {
    setShowErrors(true);
    setActiveStep((prev) => {
      if (Object.keys(errors).some((f) => (FIELD_STEP[f] ?? 0) === prev)) return prev;
      return Math.min(prev + 1, STEP_COUNT - 1);
    });
  }, [errors]);

  const goBack = useCallback(() => setActiveStep((prev) => Math.max(prev - 1, 0)), []);

  // ---- drafts ------------------------------------------------------------
  const dismissDraftNotice = useCallback(() => setDraftRestored(false), []);

  const startOver = useCallback(() => {
    clearDraft(draftId);
    const fresh = hydrateFromJob(initialData);
    setData(fresh.data);
    setAssignedStudentsState(fresh.students);
    setJdFile(null);
    setLogoBroken(false);
    setShowErrors(false);
    setDraftRestored(false);
    setActiveStep(0);
    setBaseline(snapshot(fresh.data, fresh.students, null));
  }, [draftId, initialData]);

  // ---- submit ------------------------------------------------------------
  /**
   * The payload shape is UNCHANGED from the shipped form — same keys, same coercions — with one
   * correction the spec names explicitly: `mandatory_skills` carries the must-have list instead
   * of a copy of `key_skills`.
   */
  const buildPayload = useCallback((): JobCreateUpdatePayload => {
    return {
      ...data,
      company_logo: data.company_logo?.trim() ?? "",
      mandatory_skills: data.mandatory_skills ?? [],
      key_skills: data.key_skills ?? [],
      course_ids: data.course_ids ?? [],
      adaptive_course_ids: data.adaptive_course_ids ?? [],
      // Always sent, even when empty: [] is how the admin clears a curated list.
      assigned_student_ids: data.assigned_student_ids ?? [],
      question_ids: data.question_ids ?? [],
      is_published: Boolean(data.is_published),
      status: data.status ?? "active",
      application_deadline: data.application_deadline?.trim()
        ? data.application_deadline.trim()
        : null,
      number_of_openings: parseNumberOfOpeningsInput(data.number_of_openings),
      applicable_passout_year: formatJobPassoutYear(data.applicable_passout_year),
      min_10th_percentage: data.min_10th_percentage ?? null,
      min_12th_percentage: data.min_12th_percentage ?? null,
      min_graduation_percentage: data.min_graduation_percentage ?? null,
    };
  }, [data]);

  const markSaved = useCallback(() => {
    clearDraft(draftId);
    setBaseline(snapshot(data, assignedStudents, jdFile));
    setDraftRestored(false);
  }, [assignedStudents, data, draftId, jdFile]);

  return {
    data,
    setField,
    setPercentage,
    setOpenings,
    assignedStudents,
    setAssignedStudents,
    jdFile,
    setJdFile,
    logoBroken,
    setLogoBroken,
    activeStep,
    goToStep,
    goNext,
    goBack,
    errors,
    showErrors,
    stepHasError,
    validateStep,
    validateAll,
    firstInvalidStep,
    dirty,
    draftRestored,
    dismissDraftNotice,
    startOver,
    addSkill,
    removeSkill,
    addCollege,
    removeCollege,
    toggleQuestion,
    selectQuestion,
    buildPayload,
    markSaved,
  };
}
