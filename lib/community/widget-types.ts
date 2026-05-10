/** Types for optional Django community widget API (`NEXT_PUBLIC_COMMUNITY_WIDGET_API`). */

export type LiveSessionDto = {
  id: number;
  title: string;
  meet_url: string;
  starts_at: string;
  ends_at: string;
  active_count?: number;
  host_name?: string;
  /** True when join URL is this app’s LiveKit room (`/community/live/:id`). */
  builtin_livekit?: boolean;
};

export type ArenaTopicDto = {
  id: number;
  title: string;
  side_a_label: string;
  side_b_label: string;
  ends_at: string | null;
  /** Vote totals for the active topic (optional; from widget API). */
  side_a_total_votes?: number;
  side_b_total_votes?: number;
  /** Percent for side A (0–100); optional. */
  side_a_percent?: number;
};

export type ArenaTopicDetailDto = {
  topic: ArenaTopicDto;
  arguments_a: ArenaArgumentDto[];
  arguments_b: ArenaArgumentDto[];
};

export type ArenaArgumentDto = {
  id: number;
  side: "a" | "b";
  body: string;
  upvotes: number;
  author_name: string;
};

export type ArenaActiveDto = {
  topic: ArenaTopicDto | null;
  top_side_a: ArenaArgumentDto | null;
  top_side_b: ArenaArgumentDto | null;
};

export type DailyQuestDto = {
  id: number | null;
  title: string;
  description: string;
  starts_at: string | null;
  ends_at: string | null;
  participant_count: number;
  progress_percent: number;
  joined_today?: boolean;
  /** False when the API returns an empty quest slot (no active quest for this client). */
  active?: boolean;
};

export type BountyThreadDto = {
  thread_id: number;
  title: string;
  author_name: string;
  age_hours: number;
  reward_ip: number;
  age_label: string;
};

export type TrendingKeywordDto = {
  keyword: string;
  count: number;
};
