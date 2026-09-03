import apiClient from "@/lib/services/api";

const BASE = "/assessment/api/projects";

// --- Wire types --------------------------------------------------------------

export type ProjectRuntime =
  | "web_static"
  | "web_js"
  | "react"
  | "python"
  | "java";

export type ProjectTier = "auto" | "rubric";

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
}

/**
 * Autosave. Only files under the brief's `editable_paths` are kept - the server merges rather
 * than replaces, so sending a read-only path is silently ignored rather than rejected. That is
 * deliberate: a learner should not lose a burst of typing because one file in the payload was
 * out of bounds.
 */
export async function saveWorkspace(
  workspaceId: number,
  files: Record<string, string>
): Promise<SaveResult> {
  const { data } = await apiClient.patch(`${BASE}/workspaces/${workspaceId}/`, { files });
  return data;
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
    if (status === 503) {
      throw new RunnerUnavailableError(
        (err as { response?: { data?: ProjectRun } })?.response?.data ?? null
      );
    }
    throw err;
  }
}

// --- Helpers -----------------------------------------------------------------

/** Whether a path may be edited, mirroring the server's fnmatch check. */
export function isEditable(path: string, editablePaths: string[]): boolean {
  if (!editablePaths || editablePaths.length === 0) return true;
  return editablePaths.some((pattern) => globMatch(path, pattern));
}

/** Minimal glob: `*` within a segment, `?` for one character. Mirrors fnmatch closely enough
 *  for the patterns a brief actually uses (`*.css`, `src/*.js`, `index.html`). */
function globMatch(path: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`).test(path);
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
