import apiClient from "../api";

/** One section in the AI-generated blueprint. */
export interface ComposerBlueprintSection {
  id: string;
  type: "mcq" | "coding";
  title: string;
  topic: string;
  count: number;
  difficulty_split: { easy: number; medium: number; hard: number };
  time_limit_minutes?: number | null;
  programming_language?: string;
}

export interface ComposerBlueprint {
  title?: string;
  instructions?: string;
  duration_minutes?: number;
  proctoring_enabled?: boolean;
  evaluation_mode?: "auto" | "manual";
  show_result?: boolean;
  sections?: ComposerBlueprintSection[];
}

export type ComposerStatus =
  | "pending"
  | "generating_blueprint"
  | "blueprint_ready"
  | "generating_questions"
  | "assembling"
  | "completed"
  | "failed";

/** One generated question, tagged with its blueprint section + difficulty. */
export interface ComposerQuestion {
  _section_ref?: string | null;
  _question_type?: "mcq" | "coding";
  _difficulty?: string | null;
  [key: string]: unknown;
}

export interface ComposerJobResponse {
  job_id: string;
  status: ComposerStatus;
  brief: string;
  preset: string;
  progress_percentage: number;
  question_progress: { total: number; completed: number; percentage: number };
  blueprint: ComposerBlueprint;
  questions: ComposerQuestion[];
  generated_assessment_id: number | null;
  error_log: Array<{ type?: string; message?: string }>;
  created_at: string | null;
}

export type ComposerPreset =
  | "proctored_screening"
  | "final_exam"
  | "coding_challenge"
  | "";

export interface StartAssessmentComposerBody {
  brief?: string;
  preset?: ComposerPreset;
  attach_course_id?: number;
  /** Company-prep path: curated catalog blueprint (no brief needed). */
  company?: string;
  round_key?: string;
}

/** One company in the curated prep catalog (real hiring-round patterns). */
export interface CompanyPrepRound {
  key: string;
  title: string;
  summary: string;
  duration_minutes: number;
  has_coding: boolean;
  question_count: number;
  section_titles: string[];
}

export interface CompanyPrepEntry {
  id: string;
  name: string;
  /** Chip-length label (falls back to name when the BE omits it). */
  short_name?: string;
  category: string;
  exam_name: string;
  pattern_year: string;
  rounds: CompanyPrepRound[];
}

/** Curated company-prep catalog for the composer's blueprint picker. */
export const getAssessmentCompanyCatalog = async (
  clientId: string | number
): Promise<CompanyPrepEntry[]> => {
  const response = await apiClient.get(
    `/admin-dashboard/api/clients/${clientId}/assessment-company-catalog/`
  );
  return response.data?.companies ?? [];
};

/** Start the AI Assessment Composer — one brief → whole draft assessment (background). */
export const startAssessmentComposer = async (
  clientId: string | number,
  body: StartAssessmentComposerBody
): Promise<ComposerJobResponse> => {
  const response = await apiClient.post(
    `/admin-dashboard/api/clients/${clientId}/assessment-composer/`,
    body
  );
  return response.data;
};

/** Poll a composer job for live progress, the blueprint, and generated questions. */
export const getAssessmentComposerJob = async (
  clientId: string | number,
  jobId: string
): Promise<ComposerJobResponse> => {
  const response = await apiClient.get(
    `/admin-dashboard/api/clients/${clientId}/assessment-composer/${jobId}/`
  );
  return response.data;
};

/** One-shot AI helper for the builder's Instructions/Description fields (BE #336). */
export const generateAssessmentCopy = async (
  clientId: string | number,
  body: {
    field: "instructions" | "description";
    title?: string;
    current_text?: string;
    duration_minutes?: number;
  }
): Promise<string> => {
  const response = await apiClient.post(
    `/admin-dashboard/api/clients/${clientId}/assessment-copy-assist/`,
    body
  );
  return String(response.data?.text ?? "");
};

/** Latest human-readable reason from a composer job's error_log (or ""). */
export function composerErrorMessage(job: Pick<ComposerJobResponse, "error_log">): string {
  const entries = job.error_log || [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const m = entries[i]?.message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return "";
}

/** True for the two terminal states. */
export function isComposerTerminal(status: ComposerStatus): boolean {
  return status === "completed" || status === "failed";
}
