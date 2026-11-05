import type { InstructorListStatus, InstructorRow } from "@/lib/services/admin/admin-instructors.service";

export type TriState = "any" | "yes" | "no";
export type JoinedWindow = "any" | "7" | "30" | "90";

export interface InstructorFilters {
  /** Has at least one course assigned, across BOTH the classic and adaptive tables. */
  courses: TriState;
  /** Has a public instructor code, which is how a student finds them. */
  code: TriState;
  /** Uploaded a CV at signup. The thing an admin reviews before approving. */
  cv: TriState;
  joined: JoinedWindow;
  /** A single `courseKey` ("classic:14" / "adaptive:14"), or "" for no course filter. */
  course: string;
}

export const EMPTY_FILTERS: InstructorFilters = {
  courses: "any",
  code: "any",
  cv: "any",
  joined: "any",
  course: "",
};

/**
 * Which facets mean anything on a given tab.
 *
 * Course and code only exist once someone is approved: offering "has courses" on the pending
 * queue would be a control that can only ever return everything or nothing, which reads as a
 * broken filter rather than an empty result.
 */
export function facetsForTab(tab: InstructorListStatus): Array<keyof InstructorFilters> {
  if (tab === "approved") return ["courses", "code", "course", "joined"];
  return ["cv", "joined"];
}

export function activeFilterCount(
  filters: InstructorFilters,
  tab: InstructorListStatus
): number {
  return facetsForTab(tab).filter((k) => {
    const v = filters[k];
    return v !== "any" && v !== "";
  }).length;
}

/**
 * Drop any facet the current tab does not offer.
 *
 * Without this, a filter set on the approved tab keeps narrowing the pending tab from a
 * control the admin can no longer see — an empty table with no visible reason for it.
 */
export function scopeFiltersToTab(
  filters: InstructorFilters,
  tab: InstructorListStatus
): InstructorFilters {
  const allowed = new Set(facetsForTab(tab));
  return {
    courses: allowed.has("courses") ? filters.courses : "any",
    code: allowed.has("code") ? filters.code : "any",
    cv: allowed.has("cv") ? filters.cv : "any",
    joined: allowed.has("joined") ? filters.joined : "any",
    course: allowed.has("course") ? filters.course : "",
  };
}

function matchTri(state: TriState, has: boolean): boolean {
  if (state === "any") return true;
  return state === "yes" ? has : !has;
}

export interface MatchContext {
  /** Public instructor codes by profile id, which live outside InstructorRow. */
  codeById: Record<number, string>;
  /** Fixed "now" for the joined-window comparison, so one pass over a list is consistent. */
  now: number;
  assignedKeys: (row: InstructorRow) => string[];
}

export function matchesFilters(
  row: InstructorRow,
  filters: InstructorFilters,
  ctx: MatchContext
): boolean {
  const keys = ctx.assignedKeys(row);

  if (!matchTri(filters.courses, keys.length > 0)) return false;
  if (!matchTri(filters.code, Boolean(ctx.codeById[row.id]))) return false;
  if (!matchTri(filters.cv, Boolean(row.instructor_cv_url))) return false;

  if (filters.course && !keys.includes(filters.course)) return false;

  if (filters.joined !== "any") {
    const days = Number(filters.joined);
    const ts = Date.parse(row.created_at ?? "");
    // An unparseable or missing created_at must NOT pass a "last 7 days" filter: NaN
    // comparisons are false either way, so say so explicitly rather than relying on that.
    if (!Number.isFinite(ts)) return false;
    if (ctx.now - ts > days * 24 * 60 * 60 * 1000) return false;
  }

  return true;
}
