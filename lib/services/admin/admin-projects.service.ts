import apiClient from "@/lib/services/api";
import type { ProjectRuntime, ProjectTier } from "@/lib/services/project-workspace.service";

const BASE = "/assessment/api/projects";

/**
 * The project brief library — where an author writes the HTML/CSS/JS (or Python) project a cohort
 * will build, and proves it is solvable before anyone is set it.
 *
 * This is the ONLY place `grader_files` and `reference_solution` exist on the client. They are
 * served by an instructor-gated endpoint and must never be passed into anything a learner
 * renders; the learner's own endpoint returns a different, allowlisted shape that omits them.
 */

export interface RubricCriterion {
  criterion: string;
  weight: number;
  guidance?: string;
}

export interface ProjectVerification {
  status?: "passed" | "failed" | string;
  passed?: number;
  total?: number;
  at?: string;
  log?: string;
}

export interface AdminProjectTemplate {
  id: number;
  title: string;
  brief_html: string;
  runtime: ProjectRuntime;
  tier: ProjectTier;
  max_marks: number;
  starter_files: Record<string, string>;
  editable_paths: string[];
  /** Hidden from learners. Instructor-only. */
  grader_files: Record<string, string>;
  reference_solution: Record<string, string>;
  rubric: RubricCriterion[];
  verification: ProjectVerification | null;
  is_active: boolean;
  owner_cohort?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type ProjectTemplateDraft = Partial<
  Omit<AdminProjectTemplate, "id" | "created_at" | "updated_at" | "verification">
> & { title: string };

export const RUNTIME_LABELS: Record<ProjectRuntime, string> = {
  web_static: "HTML / CSS / JS",
  web_js: "JavaScript (Node)",
  react: "React",
  python: "Python",
  java: "Java",
};

/**
 * Runtimes the server's harness can execute, so `tier: "auto"` is available for them. The others
 * are marked against a rubric — the harness runs `python3 grade.py` and cannot drive them, and
 * offering auto-grading it cannot deliver means every learner run 503s forever.
 */
export const AUTO_GRADEABLE: ProjectRuntime[] = ["web_static", "python"];

/** Runtimes whose output we can render live in the browser with no server involved. */
export const PREVIEWABLE: ProjectRuntime[] = ["web_static", "web_js", "react"];

export async function listProjects(): Promise<AdminProjectTemplate[]> {
  const { data } = await apiClient.get(`${BASE}/templates/`);
  return Array.isArray(data) ? data : [];
}

export async function getProject(id: number): Promise<AdminProjectTemplate> {
  const { data } = await apiClient.get(`${BASE}/templates/${id}/`);
  return data;
}

export async function createProject(draft: ProjectTemplateDraft): Promise<AdminProjectTemplate> {
  const { data } = await apiClient.post(`${BASE}/templates/`, draft);
  return data;
}

/** Saving invalidates any existing verification — the server clears it, and so should the UI. */
export async function updateProject(
  id: number,
  draft: Partial<ProjectTemplateDraft>
): Promise<AdminProjectTemplate> {
  const { data } = await apiClient.patch(`${BASE}/templates/${id}/`, draft);
  return data;
}

export class ProjectInUseError extends Error {
  constructor() {
    super("Learners already hold workspaces for this project, so it cannot be deleted.");
    this.name = "ProjectInUseError";
  }
}

export async function deleteProject(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE}/templates/${id}/`);
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 409) {
      throw new ProjectInUseError();
    }
    throw err;
  }
}

/** The server's stored verdict, exactly as it comes back. */
export interface VerificationPayload {
  status?: "passed" | "failed" | string;
  passed?: number;
  total?: number;
  log?: string;
}

export interface VerifyResult {
  /**
   * DERIVED, not sent. The endpoint returns the stored `verification` object, whose verdict
   * lives in `status` — there is no `verified` field on the wire. Reading one meant this was
   * always `undefined`, so a passing verification took the failure branch and every author who
   * verified a working brief was told their own solution had failed.
   */
  verified: boolean;
  passed: number;
  total: number;
  log?: string;
}

/** The runner was unavailable. Nothing was recorded — this is not a failed verification. */
export class VerifierUnavailableError extends Error {
  constructor() {
    super("The runner is unavailable, so this project could not be verified. Nothing was recorded.");
    this.name = "VerifierUnavailableError";
  }
}

/**
 * Run the brief's own reference solution through the harness the learner will be graded by.
 *
 * This is what makes "solvable" a measured claim rather than the author's belief, and the server
 * refuses to put an unverified auto-graded brief on an assessment. A 503 records nothing; a 422
 * means the reference solution genuinely did not pass its own checks.
 */
export function verificationToResult(
  payload: VerificationPayload | undefined,
  httpOk: boolean
): VerifyResult {
  const passed = Number(payload?.passed ?? 0);
  const total = Number(payload?.total ?? 0);
  // Trust the server's own verdict first; fall back to the HTTP status (200 passed / 422 failed)
  // when an older deployment omits it. Never infer from passed === total alone: a brief with
  // zero checks would read as a pass.
  const verified = payload?.status
    ? payload.status === "passed"
    : httpOk && total > 0 && passed === total;
  return { verified, passed, total, log: payload?.log };
}

export async function verifyProject(id: number): Promise<VerifyResult> {
  try {
    const { data } = await apiClient.post<VerificationPayload>(
      `${BASE}/templates/${id}/verify/`
    );
    return verificationToResult(data, true);
  } catch (err) {
    const res = (err as { response?: { status?: number; data?: VerificationPayload } })?.response;
    if (res?.status === 503) throw new VerifierUnavailableError();
    if (res?.status === 422) return verificationToResult(res.data, false);
    throw err;
  }
}

// --- Rubric marking ----------------------------------------------------------

export interface RubricMarkCriterion {
  criterion: string;
  weight: number;
  awarded: number | null;
  comment?: string;
}

export interface ProjectMark {
  status: "not_drafted" | "draft" | "confirmed" | "unavailable";
  criteria: RubricMarkCriterion[];
  summary?: string;
  reason?: string;
  confirmed_by_name?: string;
  confirmed_at?: string;
}

export interface ProjectMarkView {
  submission_id: number;
  template: {
    id: number;
    title: string;
    tier: ProjectTier;
    brief_html: string;
    max_marks: number;
    rubric: RubricCriterion[];
  };
  files: Record<string, string>;
  mark: ProjectMark;
}

export async function getProjectMark(
  submissionId: number,
  templateId: number
): Promise<ProjectMarkView> {
  const { data } = await apiClient.get(
    `${BASE}/submissions/${submissionId}/projects/${templateId}/mark/`
  );
  return data;
}

/**
 * Record the instructor's marks. These are what count — the AI draft is advisory and earns the
 * learner nothing until this call is made.
 */
export async function confirmProjectMark(
  submissionId: number,
  templateId: number,
  criteria: { criterion: string; awarded: number; comment?: string }[],
  summary?: string
): Promise<{ mark: ProjectMark; score: string | number | null; review_status: string }> {
  const { data } = await apiClient.patch(
    `${BASE}/submissions/${submissionId}/projects/${templateId}/mark/`,
    { criteria, summary }
  );
  return data;
}
