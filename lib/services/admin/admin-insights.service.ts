import apiClient from "../api";
import { config } from "../../config";

/**
 * Admin insights API.
 *
 * One request per page rather than one per widget: the endpoints return a whole section's
 * payload, because the previous dashboard fired a request per card and each one re-ran the
 * same tenant-wide student scan.
 *
 * Every number the API returns arrives with a `definition` string. That is deliberate — these
 * figures get quoted in meetings, and a metric whose page cannot say what it counted will be
 * read with whichever meaning is most flattering.
 */

export type RangeKey = "7d" | "30d" | "60d" | "90d" | "6m" | "12m";

export const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; short: string }> = [
  { key: "7d", label: "Last 7 days", short: "7D" },
  { key: "30d", label: "Last 30 days", short: "30D" },
  { key: "60d", label: "Last 60 days", short: "60D" },
  { key: "90d", label: "Last 90 days", short: "90D" },
  { key: "6m", label: "Last 6 months", short: "6M" },
  { key: "12m", label: "Last 12 months", short: "12M" },
];

/** The adaptive course filter. `course_id: null` means every adaptive course on the tenant. */
export interface InsightsScope {
  course_id: number | null;
  label: string;
}

export interface AdaptiveCourseOption {
  id: number;
  title: string;
  is_published: boolean;
}

export interface LeaderboardRow {
  rank: number;
  student_id: number;
  name: string;
  email: string;
  profile_pic_url: string | null;
  points: number;
  activities: number;
}

export interface LeaderboardPayload {
  rows: LeaderboardRow[];
  scope: InsightsScope;
  total_ranked: number;
  definition?: string;
  degraded?: boolean;
}

export interface ResolvedRange {
  key: string;
  label: string;
  grain: "day" | "week" | "month";
  days: number;
  start?: string;
  end?: string;
}

export interface DeltaTile {
  value: number;
  previous: number;
  diff: number;
  /** Null when there is no baseline to divide by — render "no comparison", never "0%". */
  pct: number | null;
  definition: string;
  denominator?: number;
  per_active_student?: number;
}

export interface PlainTile {
  value: number;
  definition: string;
  as_of?: string;
}

export interface PulsePayload {
  scope: InsightsScope;
  range: ResolvedRange;
  tiles: {
    active_students: DeltaTile;
    items_completed: DeltaTile;
    median_minutes: PlainTile;
    stale_tickets: PlainTile;
  };
  trend: Array<{ bucket: string; active_students: number; items_completed: number }>;
  freshness: { computed_at: string; note: string };
}

export interface AtRiskRow {
  student_id: number;
  name: string;
  email: string;
  rules: string[];
  reason: string;
  severity: number;
}

export interface EngagementPayload {
  scope: InsightsScope;
  range: ResolvedRange;
  mix_over_time: { keys: string[]; series: Array<Record<string, string | number>> };
  mix_total: Array<{ label: string; value: number; pct: number }>;
  hour_matrix: {
    matrix: Array<{ day: string; hours: number[] }>;
    max: number;
    peak: { day: string; hour: number; count: number; label: string } | null;
    timezone: string;
  };
  consistency: {
    bins: Array<{ label: string; students: number }>;
    median_active_days: number;
    students: number;
    of_days?: number;
  };
}

export interface LearningPayload {
  range?: ResolvedRange;
  courses: Array<{
    course_id: number;
    title: string;
    is_published: boolean;
    enrolled: number;
    started: number;
    never_started: number;
    nodes: number;
    completion_pct: number;
    activation_pct: number;
  }>;
  scope?: InsightsScope;
  dropoff: Array<{ course_id: number; week: number; students: number }>;
  definitions?: Record<string, string>;
  note?: string;
}

export interface PeoplePayload {
  scope: InsightsScope;
  /** Always false: cohorts, tickets and instructor feedback have no course dimension. */
  course_scoped: boolean;
  range: ResolvedRange;
  cohorts: Array<{
    cohort_id: number;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    members: number;
    active: number;
    completed: number;
    capacity: number | null;
    fill_pct: number | null;
  }>;
  tickets: {
    opened: number;
    resolved: number;
    open_now: number;
    median_resolution_hours: number | null;
    by_category: Array<{ label: string; value: number }>;
    by_status: Array<{ label: string; value: number }>;
    definitions: Record<string, string>;
  };
  instructors: {
    rows: Array<{
      instructor: string;
      instructor_profile_id: number | null;
      responses: number;
      instructor_rating: number | null;
      content_rating: number | null;
      pace_rating: number | null;
      overall_rating: number | null;
    }>;
    suppressed: number;
    min_responses: number;
    note: string;
  };
}

function base(path: string, range: RangeKey, courseId?: number | null) {
  const qs = new URLSearchParams({ range });
  // Omitted rather than sent as "all", so the server's default and the client's agree.
  if (courseId != null) qs.set("course_id", String(courseId));
  return `/admin-dashboard/api/clients/${config.clientId}/insights/${path}/?${qs.toString()}`;
}

export const adminInsightsService = {
  getPulse: async (range: RangeKey, courseId?: number | null): Promise<PulsePayload> => {
    const res = await apiClient.get<PulsePayload>(base("pulse", range, courseId));
    return res.data;
  },

  getAtRisk: async (
    limit = 10,
    courseId?: number | null
  ): Promise<{ results: AtRiskRow[]; rules: Record<string, string> }> => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (courseId != null) qs.set("course_id", String(courseId));
    const res = await apiClient.get<{ results: AtRiskRow[]; rules: Record<string, string> }>(
      `/admin-dashboard/api/clients/${config.clientId}/insights/at-risk/?${qs.toString()}`
    );
    return res.data;
  },

  getEngagement: async (range: RangeKey, courseId?: number | null): Promise<EngagementPayload> => {
    const res = await apiClient.get<EngagementPayload>(base("engagement", range, courseId));
    return res.data;
  },

  getLearning: async (range: RangeKey, courseId?: number | null): Promise<LearningPayload> => {
    const res = await apiClient.get<LearningPayload>(base("learning", range, courseId));
    return res.data;
  },

  /** People is never course-scoped; the param is deliberately not accepted. */
  getPeople: async (range: RangeKey): Promise<PeoplePayload> => {
    const res = await apiClient.get<PeoplePayload>(base("people", range));
    return res.data;
  },

  getLeaderboard: async (
    courseId?: number | null,
    topN = 10
  ): Promise<LeaderboardPayload> => {
    const qs = new URLSearchParams({ top_n: String(topN) });
    if (courseId != null) qs.set("course_id", String(courseId));
    const res = await apiClient.get<LeaderboardPayload>(
      `/admin-dashboard/api/clients/${config.clientId}/insights/leaderboard/?${qs.toString()}`
    );
    return res.data;
  },

  /**
   * Downloads the whole dashboard as one CSV, under the filters currently on screen.
   *
   * Goes through apiClient rather than `window.open` so the auth header is attached; the
   * endpoint is admin-only and a bare link would 401. The server names the file, so the
   * filename says which course and period it was taken under.
   */
  exportCsv: async (range: RangeKey, courseId?: number | null): Promise<void> => {
    const qs = new URLSearchParams({ range });
    if (courseId != null) qs.set("course_id", String(courseId));

    const res = await apiClient.get(
      `/admin-dashboard/api/clients/${config.clientId}/insights/export/?${qs.toString()}`,
      { responseType: "blob" }
    );

    const disposition = String(res.headers?.["content-disposition"] ?? "");
    const named = /filename="?([^"]+)"?/.exec(disposition)?.[1];
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = named || "dashboard.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking immediately cancels the download in Safari; one tick is enough.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  /** Adaptive courses only. The legacy dropdown listed ids that match nothing here. */
  getCourseOptions: async (): Promise<AdaptiveCourseOption[]> => {
    const res = await apiClient.get<{ results: AdaptiveCourseOption[] }>(
      `/admin-dashboard/api/clients/${config.clientId}/insights/courses/`
    );
    return res.data.results ?? [];
  },
};
