// Shared types + constants for the Adaptive Course "Generate" surface. Kept in
// one place so the page orchestrator and the mode panels never drift on the
// canonical content-type / difficulty ordering.

import type { CsvCoursePlan } from "@/lib/services/admin/admin-adaptive-course.service";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type ContentType = "quiz" | "article" | "coding" | "video";

export const ALL_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
// Canonical generation order shared with the backend (quiz → article → coding → video).
export const ALL_CONTENT_TYPES: ContentType[] = ["quiz", "article", "coding", "video"];

export type GenerateMode = "describe" | "csv";

/** Result of a client-side header-mode CSV parse, before AI analysis. */
export interface ParsedCsv {
  fileName: string;
  columns: string[];
  rows: Array<Record<string, string>>;
  /** Total data rows in the file (before the client-side cap). */
  totalRows: number;
  /** True when more rows existed than we kept (rows is capped). */
  truncated: boolean;
  /** First non-fatal parser warning, if any. */
  parseWarning: string | null;
}

/** Max rows sent to the backend - the AI re-caps, the serializer hard-caps too. */
export const CSV_ROW_CAP = 500;

// --- Stable row keys for the editable plan -----------------------------------
// Modules/submodules have no server id at preview time, so we tag each row with a
// monotonic client uid. This keeps React keys stable across delete/add (an index
// key reuses the wrong DOM node on a mid-list delete → focus/cursor jumps). The
// backend serializer ignores the extra `_uid` field, so it's safe to send.

let _rowSeq = 0;
export function makeRowUid(): string {
  _rowSeq += 1;
  return `row-${_rowSeq}`;
}

/** Tag every module/submodule in a freshly-parsed plan with a stable uid. */
export function withRowUids(plan: CsvCoursePlan): CsvCoursePlan {
  return {
    ...plan,
    modules: plan.modules.map((m) => ({
      ...m,
      _uid: m._uid ?? makeRowUid(),
      submodules: m.submodules.map((s) => ({ ...s, _uid: s._uid ?? makeRowUid() })),
    })),
  };
}
