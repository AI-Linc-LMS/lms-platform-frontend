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
  dropoff: Array<{ course_id: number; week: number; students: number }>;
  definitions?: Record<string, string>;
  note?: string;
}

export interface PeoplePayload {
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

function base(path: string, range: RangeKey) {
  return `/admin-dashboard/api/clients/${config.clientId}/insights/${path}/?range=${range}`;
}

export const adminInsightsService = {
  getPulse: async (range: RangeKey): Promise<PulsePayload> => {
    const res = await apiClient.get<PulsePayload>(base("pulse", range));
    return res.data;
  },

  getAtRisk: async (limit = 10): Promise<{ results: AtRiskRow[]; rules: Record<string, string> }> => {
    const res = await apiClient.get<{ results: AtRiskRow[]; rules: Record<string, string> }>(
      `/admin-dashboard/api/clients/${config.clientId}/insights/at-risk/?limit=${limit}`
    );
    return res.data;
  },

  getEngagement: async (range: RangeKey): Promise<EngagementPayload> => {
    const res = await apiClient.get<EngagementPayload>(base("engagement", range));
    return res.data;
  },

  getLearning: async (range: RangeKey): Promise<LearningPayload> => {
    const res = await apiClient.get<LearningPayload>(base("learning", range));
    return res.data;
  },

  getPeople: async (range: RangeKey): Promise<PeoplePayload> => {
    const res = await apiClient.get<PeoplePayload>(base("people", range));
    return res.data;
  },
};
