import apiClient from "./api";
import { config } from "../config";
import type {
  ArenaActiveDto,
  ArenaArgumentDto,
  ArenaTopicDetailDto,
  BountyThreadDto,
  DailyQuestDto,
  LiveSessionDto,
  TrendingKeywordDto,
} from "../community/widget-types";

export interface Author {
  id: number;
  user_name: string;
  name: string;
  profile_pic_url: string;
  role: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Thread {
  id: number;
  title: string;
  body: string;
  author: Author;
  tags: Tag[];
  upvotes: number;
  downvotes: number;
  user_vote?: "upvote" | "downvote" | null;
  bookmarks_count: number;
  user_bookmarked?: boolean | null;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  body: string;
  author: Author;
  parent: number | null;
  upvotes: number;
  downvotes: number;
  user_vote?: "upvote" | "downvote" | null;
  replies: Comment[];
  created_at: string;
  updated_at: string;
  /** Present when loaded from API (helpful mark on this comment). */
  helpful_marked?: boolean;
}

export interface ThreadDetail extends Thread {
  comments: Comment[];
}

export interface CreateThreadRequest {
  title: string;
  body: string;
  tag_ids: number[];
}

export interface CreateCommentRequest {
  body: string;
  parent_id?: number;
}

export interface VoteRequest {
  vote_type: "upvote" | "downvote";
}

export interface VoteResponse {
  id: number;
  vote_type: string;
  message: string;
}

export interface ImpactBalanceData {
  balance: number;
  daily_caps_snapshot?: {
    community_query?: { used: number; limit: number };
    community_interaction?: { used: number; limit: number };
    community_validation?: { used: number; limit: number };
    community_reply?: { used: number; limit: number };
  };
}

export type ImpactEventResponse = {
  ok: boolean;
  capped?: boolean;
  balance?: number;
  delta?: number;
  reason_code?: string;
  already_applied?: boolean;
  code?: string;
};

export type CreateLiveSessionRequest =
  | {
      title: string;
      starts_at: string;
      ends_at: string;
      builtin_livekit_room: true;
    }
  | {
      title: string;
      meet_url: string;
      starts_at: string;
      ends_at: string;
    };

export interface TopContributorDto {
  user_id: number;
  user_name: string;
  name: string;
  role: string;
  profile_pic_url: string;
  impact_points: number;
}

export interface ThreadPollStateResponse {
  counts: Record<string, number>;
  my_vote_index: number | null;
}

export const communityService = {
  // Thread Management
  getThreads: async (): Promise<Thread[]> => {
    const response = await apiClient.get<Thread[]>(
      `/community-forum/api/clients/${config.clientId}/threads/`
    );
    return response.data;
  },

  getThreadDetail: async (threadId: number): Promise<ThreadDetail> => {
    const response = await apiClient.get<ThreadDetail>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/`
    );
    return response.data;
  },

  createThread: async (data: CreateThreadRequest): Promise<Thread> => {
    const response = await apiClient.post<Thread>(
      `/community-forum/api/clients/${config.clientId}/threads/`,
      data
    );
    return response.data;
  },

  updateThread: async (
    threadId: number,
    data: Partial<CreateThreadRequest>
  ): Promise<Thread> => {
    const response = await apiClient.put<Thread>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/`,
      data
    );
    return response.data;
  },

  deleteThread: async (threadId: number): Promise<void> => {
    await apiClient.delete(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/`
    );
  },

  // Comment Management
  getThreadComments: async (threadId: number): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/`
    );
    return response.data;
  },

  createComment: async (
    threadId: number,
    data: CreateCommentRequest
  ): Promise<Comment> => {
    const response = await apiClient.post<Comment>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/`,
      data
    );
    return response.data;
  },

  updateComment: async (
    threadId: number,
    commentId: number,
    data: Partial<CreateCommentRequest>
  ): Promise<Comment> => {
    const response = await apiClient.put<Comment>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/`,
      data
    );
    return response.data;
  },

  deleteComment: async (threadId: number, commentId: number): Promise<void> => {
    await apiClient.delete(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/`
    );
  },

  // Voting
  voteThread: async (
    threadId: number,
    voteType: "upvote" | "downvote"
  ): Promise<VoteResponse> => {
    const response = await apiClient.post<VoteResponse>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/vote/`,
      { vote_type: voteType }
    );
    return response.data;
  },

  voteComment: async (
    threadId: number,
    commentId: number,
    voteType: "upvote" | "downvote"
  ): Promise<VoteResponse> => {
    const response = await apiClient.post<VoteResponse>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/vote/`,
      { vote_type: voteType }
    );
    return response.data;
  },

  // Bookmarks
  bookmarkThread: async (
    threadId: number
  ): Promise<{ id: number; message: string }> => {
    const response = await apiClient.post<{ id: number; message: string }>(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/bookmark/`
    );
    return response.data;
  },

  // Tags
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>(
      `/community-forum/api/clients/${config.clientId}/tags/`
    );
    return response.data;
  },

  /** Widget API: single live session (requires auth). */
  getLiveSession: async (
    sessionId: number
  ): Promise<{ ok: boolean; data?: LiveSessionDto }> => {
    try {
      const response = await apiClient.get<LiveSessionDto>(
        `/community-forum/api/clients/${config.clientId}/widgets/live-sessions/${sessionId}/`
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false };
    }
  },

  /** Widget API: LiveKit join token for built-in community live rooms. */
  postCommunityLiveKitToken: async (
    sessionId: number
  ): Promise<{
    ok: boolean;
    data?: { token: string; livekit_url?: string; room?: string; identity?: string };
  }> => {
    try {
      const response = await apiClient.post<{
        token: string;
        livekit_url?: string;
        room?: string;
        identity?: string;
      }>(
        `/community-forum/api/clients/${config.clientId}/widgets/live-sessions/${sessionId}/livekit-token/`,
        {}
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false };
    }
  },

  createLiveSession: async (
    data: CreateLiveSessionRequest
  ): Promise<{ ok: boolean; data?: LiveSessionDto }> => {
    try {
      let response;
      if ("meet_url" in data) {
        response = await apiClient.post<LiveSessionDto>(
          `/community-forum/api/clients/${config.clientId}/widgets/live-sessions/`,
          {
            title: data.title,
            meet_url: data.meet_url,
            starts_at: data.starts_at,
            ends_at: data.ends_at,
          }
        );
      } else {
        response = await apiClient.post<LiveSessionDto>(
          `/community-forum/api/clients/${config.clientId}/widgets/live-sessions/`,
          {
            title: data.title,
            starts_at: data.starts_at,
            ends_at: data.ends_at,
            builtin_livekit_room: true,
          }
        );
      }
      return { ok: true, data: response.data };
    } catch {
      return { ok: false };
    }
  },

  getUpcomingSessions: async (
    limit: number
  ): Promise<{ ok: boolean; data: LiveSessionDto[] }> => {
    try {
      const response = await apiClient.get<LiveSessionDto[]>(
        `/community-forum/api/clients/${config.clientId}/widgets/upcoming-sessions/`,
        { params: { limit } }
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false, data: [] };
    }
  },

  getTopContributors: async (
    limit: number
  ): Promise<{ ok: boolean; data: TopContributorDto[] }> => {
    try {
      const response = await apiClient.get<TopContributorDto[]>(
        `/community-forum/api/clients/${config.clientId}/widgets/top-contributors/`,
        { params: { limit } }
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false, data: [] };
    }
  },

  getArenaActive: async (): Promise<{ ok: boolean; data?: ArenaActiveDto }> => {
    try {
      const response = await apiClient.get<ArenaActiveDto>(
        `/community-forum/api/clients/${config.clientId}/widgets/arena/active/`
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false };
    }
  },

  getArenaTopicDetail: async (
    topicId: number
  ): Promise<{ ok: boolean; data?: ArenaTopicDetailDto }> => {
    try {
      const response = await apiClient.get<ArenaTopicDetailDto>(
        `/community-forum/api/clients/${config.clientId}/widgets/arena/topics/${topicId}/`
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false };
    }
  },

  postArenaArgument: async (
    topicId: number,
    body: { side: "a" | "b"; body: string }
  ): Promise<{ ok: boolean; data?: ArenaArgumentDto }> => {
    try {
      const response = await apiClient.post<ArenaArgumentDto>(
        `/community-forum/api/clients/${config.clientId}/widgets/arena/topics/${topicId}/arguments/`,
        body
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false };
    }
  },

  postArenaArgumentVote: async (
    argumentId: number
  ): Promise<
    | { ok: true; data: { upvotes: number; voted: boolean } }
    | { ok: false; data?: undefined }
  > => {
    try {
      const response = await apiClient.post<{ upvotes: number; voted: boolean }>(
        `/community-forum/api/clients/${config.clientId}/widgets/arena/arguments/${argumentId}/vote/`,
        {}
      );
      return { ok: true, data: response.data };
    } catch {
      return { ok: false };
    }
  },

  getPollState: async (
    threadId: number
  ): Promise<ThreadPollStateResponse | null> => {
    try {
      const response = await apiClient.get<{
        counts: Record<string, number>;
        my_vote_index: number | null;
      }>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/poll/`
      );
      return {
        counts: response.data.counts ?? {},
        my_vote_index: response.data.my_vote_index ?? null,
      };
    } catch {
      return null;
    }
  },

  postPollVote: async (
    threadId: number,
    optionIndex: number
  ): Promise<ThreadPollStateResponse | null> => {
    try {
      const response = await apiClient.post<{
        counts: Record<string, number>;
        my_vote_index: number;
      }>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/poll/vote/`,
        { option_index: optionIndex }
      );
      return {
        counts: response.data.counts ?? {},
        my_vote_index: response.data.my_vote_index ?? null,
      };
    } catch {
      return null;
    }
  },

  getImpactBalance: async (): Promise<ImpactBalanceData | null> => {
    try {
      const response = await apiClient.get<ImpactBalanceData>(
        `/community-forum/api/clients/${config.clientId}/impact/balance/`
      );
      return response.data;
    } catch {
      return null;
    }
  },

  postImpactEvent: async (body: {
    reason_code: string;
    idempotency_key?: string;
  }): Promise<ImpactEventResponse | null> => {
    try {
      const response = await apiClient.post<ImpactEventResponse>(
        `/community-forum/api/clients/${config.clientId}/impact/event/`,
        body
      );
      return response.data;
    } catch {
      return null;
    }
  },

  /** Active daily quest for the client, or null when none is scheduled. */
  getDailyQuestCurrent: async (): Promise<{ ok: boolean; data: DailyQuestDto | null }> => {
    if (!config.communityWidgetApi) {
      return { ok: false, data: null };
    }
    try {
      const response = await apiClient.get<DailyQuestDto>(
        `/community-forum/api/clients/${config.clientId}/widgets/daily-quest/current/`
      );
      const d = response.data;
      if (!d || d.active === false || d.id == null) {
        return { ok: true, data: null };
      }
      return { ok: true, data: d };
    } catch {
      return { ok: false, data: null };
    }
  },

  postDailyQuestJoin: async (): Promise<{ ok: boolean; message?: string }> => {
    try {
      const response = await apiClient.post<{ ok: boolean; message?: string }>(
        `/community-forum/api/clients/${config.clientId}/widgets/daily-quest/join/`,
        {}
      );
      return response.data;
    } catch {
      return { ok: false };
    }
  },

  getWidgetBounties: async (): Promise<{ ok: boolean; data: BountyThreadDto[] }> => {
    if (!config.communityWidgetApi) {
      return { ok: false, data: [] };
    }
    try {
      const response = await apiClient.get<BountyThreadDto[]>(
        `/community-forum/api/clients/${config.clientId}/widgets/bounties/`
      );
      return { ok: true, data: response.data ?? [] };
    } catch {
      return { ok: false, data: [] };
    }
  },

  getWidgetTrending: async (): Promise<{ ok: boolean; data: TrendingKeywordDto[] }> => {
    if (!config.communityWidgetApi) {
      return { ok: false, data: [] };
    }
    try {
      const response = await apiClient.get<TrendingKeywordDto[]>(
        `/community-forum/api/clients/${config.clientId}/widgets/trending/`
      );
      return { ok: true, data: response.data ?? [] };
    } catch {
      return { ok: false, data: [] };
    }
  },

  getLiveSessionsActive: async (): Promise<{ ok: boolean; data: LiveSessionDto[] }> => {
    if (!config.communityWidgetApi) {
      return { ok: false, data: [] };
    }
    try {
      const response = await apiClient.get<LiveSessionDto[]>(
        `/community-forum/api/clients/${config.clientId}/widgets/live-sessions/active/`
      );
      return { ok: true, data: response.data ?? [] };
    } catch {
      return { ok: false, data: [] };
    }
  },
};

