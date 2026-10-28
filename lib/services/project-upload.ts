import { isEditable } from "./project-workspace.service";

/**
 * Bringing a project that was built elsewhere into the workspace.
 *
 * A learner handed a one-file starter cannot type a React app into it, and nobody is going to
 * retype twelve files they already have on disk. So the workspace accepts an upload - a set of
 * files, or a whole project folder - and this module decides what of it may land.
 *
 * It has to decide, because a real project folder is mostly things that must NOT land:
 * `node_modules` alone is tens of thousands of files, which would blow the 200-file cap before a
 * single source file was stored, and `.env` is where a learner keeps a key they should not be
 * publishing to their instructor. Everything refused is reported back by name: silently dropping
 * a file somebody asked us to take is how work goes missing.
 *
 * The caps mirror `assessment/projects/views.py` (MAX_FILES, MAX_FILE_BYTES, MAX_TREE_BYTES) so
 * the learner is told what will happen before the server refuses the save rather than after.
 */

export const PROJECT_LIMITS = {
  maxFiles: 200,
  maxFileBytes: 512 * 1024,
  maxTreeBytes: 4 * 1024 * 1024,
} as const;

/** Directories a build produces or a package manager owns. None of it is the learner's work. */
export const SKIPPED_DIRECTORIES = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".cache",
  ".turbo",
  ".venv",
  "venv",
  "__pycache__",
  ".idea",
  ".vscode",
];

/** Files that are large, generated, or nobody's business but the learner's. */
const SKIPPED_FILES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".ds_store"];

export interface UploadEntry {
  path: string;
  content: string;
}

export interface SkippedUpload {
  path: string;
  reason: string;
}

export interface UploadPlan {
  files: Record<string, string>;
  /** Paths that were stored for the first time. */
  added: string[];
  /** Paths that already existed and were overwritten by the upload. */
  replaced: string[];
  skipped: SkippedUpload[];
}

/**
 * A workspace path, or null when the string cannot be one.
 *
 * Leading `./` and `/` go, `..` is refused outright (the server stores a flat map, so a path that
 * climbs is either a mistake or an attempt at one), and backslashes become slashes so a Windows
 * upload lands in the same shape as everyone else's.
 */
export function normaliseProjectPath(raw: string): string | null {
  const cleaned = String(raw ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/\/{2,}/g, "/")
    .trim();
  if (!cleaned || cleaned.endsWith("/")) return null;
  const segments = cleaned.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) return null;
  return cleaned;
}

/**
 * The common first directory shared by every path, or null.
 *
 * A folder upload arrives as `quiz-app/src/App.jsx`; the learner means `src/App.jsx`, because the
 * workspace IS the project root. Only applied to a directory pick: for a hand-picked set of files
 * `src/App.jsx` means what it says.
 */
export function commonRoot(paths: string[]): string | null {
  if (paths.length === 0) return null;
  const first = paths[0].split("/");
  if (first.length < 2) return null;
  const root = first[0];
  return paths.every((p) => p.split("/")[0] === root && p.split("/").length >= 2) ? root : null;
}

/**
 * Whether this content is binary rather than text.
 *
 * The workspace stores strings, so an image or a zip read as text is both useless and large. A NUL
 * byte settles it; otherwise a high proportion of control characters does.
 */
export function isProbablyBinary(content: string): boolean {
  if (content.includes("\u0000")) return true;
  const sample = content.slice(0, 4096);
  if (!sample) return false;
  let control = 0;
  for (const ch of sample) {
    const code = ch.charCodeAt(0);
    if (code === 9 || code === 10 || code === 13) continue;
    if (code < 32 || code === 127) control += 1;
  }
  return control / sample.length > 0.1;
}

function byteLength(content: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(content).length;
  return content.length;
}

function junkReason(path: string): string | null {
  const segments = path.split("/");
  const directory = segments.slice(0, -1).find((s) => SKIPPED_DIRECTORIES.includes(s));
  if (directory) return `${directory}/ is not uploaded - it is generated, not your work`;
  const name = segments[segments.length - 1].toLowerCase();
  if (SKIPPED_FILES.includes(name)) return `${name} is generated, so it is not uploaded`;
  if (name === ".env" || name.startsWith(".env.")) {
    return "environment files are not uploaded - they usually hold keys";
  }
  return null;
}

export interface UploadOptions {
  /** Globs the brief allows the learner to write. Empty means everything. */
  editablePaths?: string[];
  /** True when the learner picked a folder, so a single wrapping directory is stripped. */
  fromDirectory?: boolean;
}

/**
 * What an upload would do to the workspace, without doing it.
 *
 * Deterministic in path order so the same upload always keeps the same files, and so a tree that
 * runs past the caps drops a predictable tail rather than whichever file the browser handed over
 * last.
 */
export function planUpload(
  existing: Record<string, string>,
  entries: UploadEntry[],
  { editablePaths = [], fromDirectory = false }: UploadOptions = {}
): UploadPlan {
  const files = { ...existing };
  const added: string[] = [];
  const replaced: string[] = [];
  const skipped: SkippedUpload[] = [];

  const normalised: UploadEntry[] = [];
  for (const entry of entries) {
    const path = normaliseProjectPath(entry.path);
    if (!path) {
      skipped.push({ path: String(entry.path), reason: "that is not a usable file path" });
      continue;
    }
    normalised.push({ path, content: entry.content });
  }

  const root = fromDirectory ? commonRoot(normalised.map((e) => e.path)) : null;
  const trimmed = normalised
    .map((e) => ({
      path: root ? e.path.slice(root.length + 1) : e.path,
      content: e.content,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  let treeBytes = Object.values(files).reduce((sum, body) => sum + byteLength(body), 0);

  for (const { path, content } of trimmed) {
    const junk = junkReason(path);
    if (junk) {
      skipped.push({ path, reason: junk });
      continue;
    }
    if (editablePaths.length > 0 && !isEditable(path, editablePaths)) {
      skipped.push({ path, reason: "the brief does not allow changes there" });
      continue;
    }
    if (isProbablyBinary(content)) {
      skipped.push({ path, reason: "it looks like a binary file, and the editor stores text" });
      continue;
    }
    const size = byteLength(content);
    if (size > PROJECT_LIMITS.maxFileBytes) {
      skipped.push({
        path,
        reason: `it is larger than ${PROJECT_LIMITS.maxFileBytes / 1024} KB`,
      });
      continue;
    }
    const isReplacement = files[path] !== undefined;
    if (!isReplacement && Object.keys(files).length >= PROJECT_LIMITS.maxFiles) {
      skipped.push({
        path,
        reason: `a project may hold at most ${PROJECT_LIMITS.maxFiles} files`,
      });
      continue;
    }
    const nextTreeBytes = treeBytes - (isReplacement ? byteLength(files[path]) : 0) + size;
    if (nextTreeBytes > PROJECT_LIMITS.maxTreeBytes) {
      skipped.push({
        path,
        reason: `the project would pass ${PROJECT_LIMITS.maxTreeBytes / (1024 * 1024)} MB in total`,
      });
      continue;
    }
    treeBytes = nextTreeBytes;
    files[path] = content;
    (isReplacement ? replaced : added).push(path);
  }

  return { files, added, replaced, skipped };
}

/**
 * Read picked files as text, keeping the path the browser reports.
 *
 * `webkitRelativePath` is what a directory pick fills in, and it is the only way to learn that
 * `App.jsx` lives in `src/`. A file that cannot be read is reported rather than dropped.
 */
export async function readUploadEntries(
  picked: File[]
): Promise<{ entries: UploadEntry[]; unreadable: SkippedUpload[] }> {
  const entries: UploadEntry[] = [];
  const unreadable: SkippedUpload[] = [];
  for (const file of picked) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    // Refuse the obviously-too-large before reading it into memory.
    if (file.size > PROJECT_LIMITS.maxFileBytes) {
      unreadable.push({
        path,
        reason: `it is larger than ${PROJECT_LIMITS.maxFileBytes / 1024} KB`,
      });
      continue;
    }
    try {
      entries.push({ path, content: await file.text() });
    } catch {
      unreadable.push({ path, reason: "it could not be read" });
    }
  }
  return { entries, unreadable };
}
