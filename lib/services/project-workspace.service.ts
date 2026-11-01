import apiClient from "@/lib/services/api";
import { config } from "@/lib/config";

const BASE = "/assessment/api/projects";

// --- Wire types --------------------------------------------------------------

export type ProjectRuntime =
  | "web_static"
  | "web_js"
  | "react"
  | "python"
  | "java";

/** Runtimes the server's harness can actually grade. Everything else is marked against a rubric. */
export const AUTO_GRADEABLE_RUNTIMES: ProjectRuntime[] = ["web_static", "python"];

export type ProjectTier = "auto" | "rubric";

/**
 * How the learner produces the code.
 *
 * `manual` is the original exercise: type HTML, CSS and JS into the editor. `prompt` is the
 * same brief and the same hidden checks, but the learner briefs an AI and is assessed on the
 * brief they wrote — so the editor goes read-only and the generations are metered.
 */
export type ProjectAuthoringMode = "manual" | "prompt";

/**
 * The brief as the learner receives it.
 *
 * `grader_files`, `reference_solution` and `rubric` are deliberately absent: the backend
 * serializer is an allowlist, so they are not merely filtered out here - they never leave the
 * server. Do not add them to this type "for completeness"; their absence is the contract.
 */
export interface ProjectTemplate {
  id: number;
  title: string;
  brief_html: string;
  runtime: ProjectRuntime;
  tier: ProjectTier;
  /** The scaffold the learner opens, as { path: contents }. */
  starter_files: Record<string, string>;
  /** Globs the learner may edit. Empty means the whole tree is theirs. */
  editable_paths: string[];
  max_marks: number;
  authoring_mode: ProjectAuthoringMode;
  /**
   * The allowance, for the first paint. NOT how many are left — that comes from
   * `getGenerations`, which counts rows on the server. Rendering this as "left" is the bug the
   * assessment page already has at `app/assessments/[slug]/page.tsx`, where "1 / 2" is derived
   * from a boolean and is a fiction.
   */
  prompt_attempts_allowed: number;
}

export type GenerationStatus = "pending" | "running" | "succeeded" | "failed";

export interface ProjectGeneration {
  id: number;
  attempt_index: number;
  /** The learner's own prompt. This is the work being assessed, so it stays readable. */
  prompt: string;
  status: GenerationStatus;
  /** What the model says it built, plus any file the brief would not let it write. */
  notes: string;
  /** Why it failed, in words for the learner. A failed attempt does not count against them. */
  error: string;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export interface AttemptState {
  used: number;
  allowed: number;
  remaining: number;
  /**
   * Staff are not metered. Their `used` never moves, so a UI that renders "2 of 2 left" for
   * them is indistinguishable from a meter that has stopped counting — which is how the tutor
   * minutes bug was reported. Branch on this, do not infer it from the numbers.
   */
  unmetered: boolean;
}

export interface GenerationsResponse {
  attempts: AttemptState;
  generations: ProjectGeneration[];
}

export interface ProjectRun {
  id: number;
  attempt_no: number;
  passed: number;
  total: number;
  /**
   * True when the runner could not execute the work at all. This is NOT a wrong answer, and the
   * UI must not present it as a score of zero - the backend deliberately records no mark for it
   * and answers 503.
   */
  infra_error: boolean;
  log: string;
  created_at: string;
}

export interface ProjectWorkspace {
  id: number;
  template: ProjectTemplate;
  files: Record<string, string>;
  save_count: number;
  last_saved_at: string;
  latest_run: ProjectRun | null;
}

// --- Calls -------------------------------------------------------------------

export async function getWorkspace(workspaceId: number): Promise<ProjectWorkspace> {
  const { data } = await apiClient.get(`${BASE}/workspaces/${workspaceId}/`);
  return data;
}

export interface SaveResult {
  saved: boolean;
  save_count: number;
  last_saved_at: string;
  /** Paths the brief marks read-only. Present so the editor can say so instead of lying. */
  rejected_paths?: string[];
}

/** The attempt is submitted; the server refuses further saves and runs. */
export class AttemptClosedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttemptClosedError";
  }
}

/**
 * Autosave.
 *
 * The server MERGES the files it is sent into the stored tree, so a partial save - which is what
 * an autosave is - keeps every file it did not mention. Deletions are therefore explicit: a path
 * only disappears if it is named in `deleted`.
 *
 * Paths the brief marks read-only come back in `rejected_paths` rather than being dropped in
 * silence. Show them. Telling a learner their work was saved while discarding it is the worst
 * behaviour available here.
 */
export async function saveWorkspace(
  workspaceId: number,
  files: Record<string, string>,
  deleted?: string[]
): Promise<SaveResult> {
  const { data } = await apiClient.patch(`${BASE}/workspaces/${workspaceId}/`, {
    files,
    ...(deleted?.length ? { deleted } : {}),
  });
  return data;
}

/** Every generation for this brief has been used. The learner submits what they have. */
export class AttemptsExhaustedError extends Error {
  readonly attempts: AttemptState | null;
  constructor(message: string, attempts: AttemptState | null) {
    super(message);
    this.name = "AttemptsExhaustedError";
    this.attempts = attempts;
  }
}

/**
 * OUR ceiling, not theirs — the tenant's daily cap, or the model being unreachable.
 *
 * Deliberately a separate error from `AttemptsExhaustedError`. Showing a learner "you have used
 * your attempts" when the real cause is our own backstop sends them to an instructor to ask for
 * an attempt they still have.
 */
export class GenerationUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationUnavailableError";
  }
}

export async function getGenerations(workspaceId: number): Promise<GenerationsResponse> {
  const { data } = await apiClient.get(`${BASE}/workspaces/${workspaceId}/generate/`);
  return data;
}

/**
 * Ask an AI to write the project.
 *
 * Returns as soon as the slot is claimed (202); the files land asynchronously, so the caller
 * polls `getGenerations` until the attempt leaves `pending`/`running`. The attempt count in the
 * reply is the server's, counted from rows — never computed on the client, because the client
 * cannot see the other tab.
 */
export async function generateProject(
  workspaceId: number,
  prompt: string
): Promise<{ generation: ProjectGeneration; attempts: AttemptState }> {
  try {
    const { data } = await apiClient.post(`${BASE}/workspaces/${workspaceId}/generate/`, {
      prompt,
    });
    return data;
  } catch (err) {
    const res = (err as {
      response?: { status?: number; data?: { error?: string; attempts?: AttemptState } };
    })?.response;
    const message = res?.data?.error;
    if (res?.status === 429) {
      throw new AttemptsExhaustedError(
        message || "You have used all of your generations for this project.",
        res?.data?.attempts ?? null
      );
    }
    if (res?.status === 409) {
      throw new AttemptClosedError(
        message || "This attempt has been submitted, so it can no longer be changed."
      );
    }
    if (res?.status === 503) {
      throw new GenerationUnavailableError(
        message || "We could not generate this just now. Your attempts have not been used."
      );
    }
    throw err;
  }
}

export class RunnerUnavailableError extends Error {
  readonly run: ProjectRun | null;
  constructor(run: ProjectRun | null) {
    super("The runner could not grade this attempt.");
    this.name = "RunnerUnavailableError";
    this.run = run;
  }
}

/**
 * Run the hidden checks and return which passed.
 *
 * A 503 means the runner had a problem, not that the learner failed - it is raised as a distinct
 * error so the UI can say "we couldn't run this" instead of showing a zero. Conflating the two
 * marks correct work incorrect, which is the exact failure this platform has already paid for.
 */
export async function runWorkspace(workspaceId: number): Promise<ProjectRun> {
  try {
    const { data } = await apiClient.post(`${BASE}/workspaces/${workspaceId}/run/`);
    return data;
  } catch (err) {
    const status = (err as { response?: { status?: number; data?: ProjectRun } })?.response?.status;
    if (status === 409) {
      throw new AttemptClosedError(
        "This attempt has been submitted, so it can no longer be run."
      );
    }
    if (status === 503) {
      throw new RunnerUnavailableError(
        (err as { response?: { data?: ProjectRun } })?.response?.data ?? null
      );
    }
    throw err;
  }
}

export interface MyProjectsResponse {
  assessment: {
    id: number;
    slug: string;
    title: string;
    /** ISO deadline, or null when the brief has no deadline at all. */
    end_time: string | null;
    is_take_home: boolean;
  };
  submission: {
    id: number;
    status: string;
    /** False once submitted — every save and run is then refused with a 409. */
    is_open: boolean;
  };
  workspaces: ProjectWorkspace[];
}

/**
 * The learner's way in: which projects am I set on this assessment, and are they still open?
 *
 * Workspaces are addressed by an integer id, so without this call there is no path from the
 * product to a project at all.
 */
export async function getMyProjects(slug: string): Promise<MyProjectsResponse> {
  const { data } = await apiClient.get(`${BASE}/assessments/${slug}/mine/`);
  return data;
}

/**
 * Hand in a take-home project.
 *
 * The sheet is deliberately empty: a project has no MCQ, coding or written answers to carry, and
 * the whole mark lives in `project_results`, which the server wrote itself from the runs. The
 * server accepts `{}` for a take-home specifically (a genuinely absent sheet is still refused).
 *
 * After this the attempt is closed: every save and run answers 409.
 */
export async function submitProjectAttempt(slug: string): Promise<void> {
  await apiClient.put(
    `/assessment/api/client/${config.clientId}/assessment-submission/${slug}/final/`,
    { response_sheet: {} }
  );
}

// --- Helpers -----------------------------------------------------------------

/** Whether a path may be edited, mirroring the server's fnmatch check. */
export function isEditable(path: string, editablePaths: string[]): boolean {
  if (!editablePaths || editablePaths.length === 0) return true;
  return editablePaths.some((pattern) => globMatch(path, pattern));
}

/**
 * Glob match, mirroring the server exactly: `*` stops at a directory boundary, `**` spans them,
 * `?` is one non-slash character, and `.` is a literal dot.
 *
 * The parity matters. This decides whether the editor shows a file as writable; the server
 * decides whether the write is kept. If the two disagree, a learner types into a file that looks
 * editable and loses it on save.
 */
function globMatch(path: string, pattern: string): boolean {
  let out = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === "*") {
      if (pattern[i + 1] === "*") {
        out += ".*";
        i += 1;
      } else {
        out += "[^/]*";
      }
    } else if (ch === "?") {
      out += "[^/]";
    } else {
      out += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${out}$`).test(path);
}

/** Monaco language id for a path, so the editor highlights correctly. */
export function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "html", htm: "html", css: "css", js: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript", json: "json", py: "python",
    java: "java", md: "markdown", txt: "plaintext",
  };
  return map[ext] ?? "plaintext";
}

/** Runtimes we can preview live in the browser, with no server involved. */
export function isPreviewable(runtime: ProjectRuntime): boolean {
  return runtime === "web_static" || runtime === "react" || runtime === "web_js";
}
