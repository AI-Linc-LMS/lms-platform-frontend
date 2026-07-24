import apiClient from "./api";
import { config } from "../config";
import { AxiosError } from "axios";

export type PostType = "question" | "poll" | "resource" | "humorous" | "discussion";

export interface PostTypeConfig {
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const POST_TYPE_CONFIG: Record<PostType, PostTypeConfig> = {
  question: {
    label: "Question",
    icon: "mdi:help-circle-outline",
    color: "#6366f1",
    description: "Ask the community",
  },
  poll: {
    label: "Poll",
    icon: "mdi:chart-bar",
    color: "#8b5cf6",
    description: "Get community opinion",
  },
  resource: {
    label: "Resource",
    icon: "mdi:book-open-outline",
    color: "#0ea5e9",
    description: "Share a useful resource",
  },
  humorous: {
    label: "Humorous",
    icon: "mdi:emoticon-happy-outline",
    color: "#f59e0b",
    description: "Share something fun",
  },
  discussion: {
    label: "Discussion",
    icon: "mdi:forum-outline",
    color: "#10b981",
    description: "Start a conversation",
  },
};

interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const error = err as AxiosError<ApiErrorPayload>;
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.response?.data?.detail ||
    fallback
  );
}

export interface Author {
  id: number;
  user_name: string;
  name: string;
  profile_pic_url: string;
  role: string;
  xp_tier?: "bronze" | "silver" | "gold" | "platinum";
}

export interface UserXP {
  balance: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  tier_display: string;
  next_tier_threshold: number | null;
  progress_pct: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface BountyInfo {
  id: number;
  points: number;
  status: "active" | "claimed" | "ai_answered";
}

export interface BountyItem {
  thread_id: number;
  thread_title: string;
  author: Author;
  points: number;
  has_bounty: boolean;
  hours_unanswered: number;
  bounty_status?: "active" | "claimed" | "ai_answered" | null;
  comment_count?: number;
  claimed_by?: {
    id: number;
    name: string;
    profile_pic_url: string;
  } | null;
  claimed_at?: string | null;
}

export type BountyListStatus = "active" | "resolved" | "all" | "strip";

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
  post_type?: PostType;
  poll_options?: string[];
  poll_results?: number[];
  user_poll_vote?: number | null;
  image_urls?: string[];
  bounty?: BountyInfo | null;
  current_user_is_author?: boolean;
  current_user_role?: string | null;
  is_pinned?: boolean;
  is_locked?: boolean;
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
  is_accepted?: boolean;
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThreadDetail extends Thread {
  comments: Comment[];
  is_pinned?: boolean;
  is_locked?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  page: number;
  total_pages: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  results: T[];
}

export interface CommunityUserProfile {
  id: number;
  user_name: string;
  name: string;
  profile_pic_url: string;
  role: string;
  is_self: boolean;
  is_followed_by_me?: boolean;
  follower_count?: number;
  following_count?: number;
  xp: UserXP;
  stats: {
    threads: number;
    comments: number;
    upvotes_received: number;
    accepted_answers: number;
    bounties_won: number;
  };
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "offtopic"
  | "misinfo"
  | "plagiarism"
  | "other";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam or promotional",
  harassment: "Harassment or hate",
  offtopic: "Off-topic / wrong category",
  misinfo: "Misinformation",
  plagiarism: "Plagiarism / not original",
  other: "Other",
};

export interface FollowedUser {
  id: number;
  follower: Author;
  following: Author;
  created_at: string;
}

export interface FollowedTag {
  id: number;
  tag: Tag;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: Author;
  xp: number;
  period: "all" | "week" | "month";
}

export interface LeaderboardResponse {
  period: "all" | "week" | "month";
  results: LeaderboardEntry[];
}

export interface BadgeItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  kind: "milestone" | "quality" | "community" | "special";
  earned: boolean;
  earned_at: string | null;
}

export interface XPHistoryEntry {
  id: number;
  source: string;
  source_label: string;
  amount: number;
  description: string;
  thread: { id: number; title: string } | null;
  comment_id: number | null;
  created_at: string;
}

export type RoomStatus = "scheduled" | "live" | "ended";
export type RoomRole = "host" | "moderator" | "participant" | "banned" | null;

export interface RoomParticipant {
  id: number;
  user: Author;
  role: "participant" | "moderator" | "banned";
  joined_at: string;
  left_at: string | null;
  last_active_at: string;
  is_active: boolean;
}

export interface Room {
  id: number;
  title: string;
  description: string;
  host: Author;
  slug: string;
  status: RoomStatus;
  max_participants: number;
  is_audio_only: boolean;
  scheduled_for: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  participant_count: number;
  active_count: number;
  /** Daily-provisioned identifiers. Empty when the row was created before
   *  Daily was configured, or while the API was unavailable. */
  daily_room_name: string;
  daily_room_url: string;
  current_user_role: RoomRole;
}

export interface RoomDetail extends Room {
  participants: RoomParticipant[];
  /** Only present on the response to POST /join/ - short-lived JWT. */
  meeting_token?: string;
}

export interface CreateRoomRequest {
  title: string;
  description?: string;
  max_participants?: number;
  is_audio_only?: boolean;
  scheduled_for?: string | null;
  start_now?: boolean;
}

export interface UserCommentItem {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  is_accepted: boolean;
  thread: { id: number; title: string };
  upvotes: number;
  downvotes: number;
}

export interface ThreadListParams {
  post_type?: PostType;
  tags?: number[];
  search?: string;
  sort?: "recent" | "popular" | "trending";
  my_posts?: boolean;
  bookmarked_by_me?: boolean;
  author_id?: number;
  page?: number;
  page_size?: number;
}

export interface CreateThreadRequest {
  title: string;
  body: string;
  tag_ids: number[];
  post_type?: PostType;
  poll_options?: string[];
  image_urls?: string[];
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

function buildThreadQuery(params?: ThreadListParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.post_type) q.set("post_type", params.post_type);
  if (params.tags && params.tags.length) q.set("tags", params.tags.join(","));
  if (params.search) q.set("search", params.search);
  if (params.sort) q.set("sort", params.sort);
  if (params.my_posts) q.set("my_posts", "1");
  if (params.bookmarked_by_me) q.set("bookmarked_by_me", "1");
  if (params.author_id) q.set("author_id", String(params.author_id));
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const communityService = {
  // Thread Management - returns a plain array (back-compat). For paginated
  // results use getThreadsPaginated() which targets the same endpoint with ?page=.
  getThreads: async (params?: Omit<ThreadListParams, "page" | "page_size">): Promise<Thread[]> => {
    try {
      const response = await apiClient.get<Thread[]>(
        `/community-forum/api/clients/${config.clientId}/threads/${buildThreadQuery(params)}`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch threads"));
    }
  },

  getThreadsPaginated: async (
    params: ThreadListParams = { page: 1 }
  ): Promise<PaginatedResponse<Thread>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Thread>>(
        `/community-forum/api/clients/${config.clientId}/threads/${buildThreadQuery({ page: 1, ...params })}`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch threads"));
    }
  },

  getThreadDetail: async (threadId: number): Promise<ThreadDetail> => {
    try {
      const response = await apiClient.get<ThreadDetail>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch thread"));
    }
  },

  createThread: async (data: CreateThreadRequest): Promise<Thread> => {
    try {
      const response = await apiClient.post<Thread>(
        `/community-forum/api/clients/${config.clientId}/threads/`,
        data
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to create thread"));
    }
  },

  updateThread: async (
    threadId: number,
    data: Partial<CreateThreadRequest>
  ): Promise<Thread> => {
    try {
      const response = await apiClient.put<Thread>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/`,
        data
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to update thread"));
    }
  },

  deleteThread: async (threadId: number): Promise<void> => {
    try {
      await apiClient.delete(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to delete thread"));
    }
  },

  // Comment Management
  getThreadComments: async (threadId: number): Promise<Comment[]> => {
    try {
      const response = await apiClient.get<Comment[]>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch comments"));
    }
  },

  createComment: async (
    threadId: number,
    data: CreateCommentRequest
  ): Promise<Comment> => {
    try {
      const response = await apiClient.post<Comment>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/`,
        data
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to create comment"));
    }
  },

  updateComment: async (
    threadId: number,
    commentId: number,
    data: Partial<CreateCommentRequest>
  ): Promise<Comment> => {
    try {
      const response = await apiClient.put<Comment>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/`,
        data
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to update comment"));
    }
  },

  deleteComment: async (threadId: number, commentId: number): Promise<void> => {
    try {
      await apiClient.delete(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to delete comment"));
    }
  },

  // Voting
  voteThread: async (
    threadId: number,
    voteType: "upvote" | "downvote"
  ): Promise<VoteResponse> => {
    try {
      const response = await apiClient.post<VoteResponse>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/vote/`,
        { vote_type: voteType }
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to vote"));
    }
  },

  voteComment: async (
    threadId: number,
    commentId: number,
    voteType: "upvote" | "downvote"
  ): Promise<VoteResponse> => {
    try {
      const response = await apiClient.post<VoteResponse>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/vote/`,
        { vote_type: voteType }
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to vote on comment"));
    }
  },

  // Poll voting
  votePoll: async (
    threadId: number,
    optionIndex: number
  ): Promise<{ user_poll_vote: number | null; poll_results: number[] }> => {
    try {
      const response = await apiClient.post(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/poll-vote/`,
        { option_index: optionIndex }
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to vote on poll"));
    }
  },

  // Bookmarks
  bookmarkThread: async (
    threadId: number
  ): Promise<{ id: number; message: string }> => {
    try {
      const response = await apiClient.post<{ id: number; message: string }>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/bookmark/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to bookmark thread"));
    }
  },

  // File uploads
  uploadFile: async (file: File): Promise<{ id: number; url: string; storage_path: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("module", "community_forum");
      const response = await apiClient.post(
        `/api/clients/${config.clientId}/upload/`,
        formData
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to upload file"));
    }
  },

  // Bounties
  getBounties: async (status?: BountyListStatus): Promise<BountyItem[]> => {
    try {
      const q = status ? `?status=${status}` : "";
      const response = await apiClient.get<BountyItem[]>(
        `/community-forum/api/clients/${config.clientId}/bounties/${q}`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch bounties"));
    }
  },

  createBounty: async (threadId: number, points: number): Promise<BountyInfo> => {
    try {
      const response = await apiClient.post<BountyInfo>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/bounty/`,
        { points }
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to create bounty"));
    }
  },

  claimBounty: async (threadId: number, commentId: number): Promise<BountyItem> => {
    try {
      const response = await apiClient.post<BountyItem>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/bounty/claim/`,
        { comment_id: commentId }
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to claim bounty"));
    }
  },

  // Accept answer
  acceptComment: async (threadId: number, commentId: number): Promise<Comment> => {
    try {
      const response = await apiClient.post<Comment>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/accept/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to accept answer"));
    }
  },

  // User XP
  getUserXP: async (): Promise<UserXP> => {
    try {
      const response = await apiClient.get<UserXP>(
        `/community-forum/api/clients/${config.clientId}/xp/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch XP"));
    }
  },

  // Tags
  getTags: async (): Promise<Tag[]> => {
    try {
      const response = await apiClient.get<Tag[]>(
        `/community-forum/api/clients/${config.clientId}/tags/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch tags"));
    }
  },

  createTag: async (name: string): Promise<Tag> => {
    try {
      const response = await apiClient.post<Tag>(
        `/community-forum/api/clients/${config.clientId}/tags/`,
        { name }
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to create tag"));
    }
  },

  // User bookmarks (the list of threads I have bookmarked)
  getMyBookmarks: async (): Promise<Thread[]> => {
    try {
      const response = await apiClient.get<Thread[]>(
        `/community-forum/api/clients/${config.clientId}/user/bookmarks/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch bookmarks"));
    }
  },

  // Community user profile (any user)
  getCommunityUserProfile: async (userId: number): Promise<CommunityUserProfile> => {
    try {
      const response = await apiClient.get<CommunityUserProfile>(
        `/community-forum/api/clients/${config.clientId}/users/${userId}/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch profile"));
    }
  },

  getUserThreads: async (userId: number): Promise<Thread[]> => {
    try {
      const response = await apiClient.get<Thread[]>(
        `/community-forum/api/clients/${config.clientId}/users/${userId}/threads/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch user's threads"));
    }
  },

  getUserComments: async (userId: number): Promise<UserCommentItem[]> => {
    try {
      const response = await apiClient.get<UserCommentItem[]>(
        `/community-forum/api/clients/${config.clientId}/users/${userId}/comments/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch user's comments"));
    }
  },

  // Admin / instructor moderation
  pinThread: async (threadId: number): Promise<{ is_pinned: boolean }> => {
    try {
      const response = await apiClient.post<{ is_pinned: boolean }>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/pin/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to pin thread"));
    }
  },

  lockThread: async (threadId: number): Promise<{ is_locked: boolean }> => {
    try {
      const response = await apiClient.post<{ is_locked: boolean }>(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/lock/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to lock thread"));
    }
  },

  // Username → profile resolver (used for @mentions navigation)
  getCommunityUserByUsername: async (username: string): Promise<CommunityUserProfile> => {
    try {
      const response = await apiClient.get<CommunityUserProfile>(
        `/community-forum/api/clients/${config.clientId}/users/by-username/${encodeURIComponent(username)}/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "User not found"));
    }
  },

  // Follow / unfollow users
  followUser: async (userId: number): Promise<void> => {
    try {
      await apiClient.post(
        `/community-forum/api/clients/${config.clientId}/users/${userId}/follow/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to follow user"));
    }
  },

  unfollowUser: async (userId: number): Promise<void> => {
    try {
      await apiClient.delete(
        `/community-forum/api/clients/${config.clientId}/users/${userId}/follow/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to unfollow user"));
    }
  },

  getMyFollowing: async (): Promise<FollowedUser[]> => {
    try {
      const response = await apiClient.get<FollowedUser[]>(
        `/community-forum/api/clients/${config.clientId}/user/following/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch following list"));
    }
  },

  // Follow / unfollow tags
  followTag: async (tagId: number): Promise<void> => {
    try {
      await apiClient.post(
        `/community-forum/api/clients/${config.clientId}/tags/${tagId}/follow/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to follow tag"));
    }
  },

  unfollowTag: async (tagId: number): Promise<void> => {
    try {
      await apiClient.delete(
        `/community-forum/api/clients/${config.clientId}/tags/${tagId}/follow/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to unfollow tag"));
    }
  },

  getMyFollowedTags: async (): Promise<FollowedTag[]> => {
    try {
      const response = await apiClient.get<FollowedTag[]>(
        `/community-forum/api/clients/${config.clientId}/user/followed-tags/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch followed tags"));
    }
  },

  // Personalized "Following" feed
  getFollowingFeed: async (): Promise<Thread[]> => {
    try {
      const response = await apiClient.get<Thread[]>(
        `/community-forum/api/clients/${config.clientId}/feed/following/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch personalized feed"));
    }
  },

  // Reporting
  reportThread: async (
    threadId: number,
    payload: { reason: ReportReason; details?: string }
  ): Promise<void> => {
    try {
      await apiClient.post(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/report/`,
        payload
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to submit report"));
    }
  },

  reportComment: async (
    threadId: number,
    commentId: number,
    payload: { reason: ReportReason; details?: string }
  ): Promise<void> => {
    try {
      await apiClient.post(
        `/community-forum/api/clients/${config.clientId}/threads/${threadId}/comments/${commentId}/report/`,
        payload
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to submit report"));
    }
  },

  // Leaderboard
  getLeaderboard: async (period: "all" | "week" | "month" = "all"): Promise<LeaderboardResponse> => {
    try {
      const response = await apiClient.get<LeaderboardResponse>(
        `/community-forum/api/clients/${config.clientId}/leaderboard/?period=${period}`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch leaderboard"));
    }
  },

  // Badges
  getBadges: async (userId?: number): Promise<BadgeItem[]> => {
    try {
      const q = userId ? `?user_id=${userId}` : "";
      const response = await apiClient.get<BadgeItem[]>(
        `/community-forum/api/clients/${config.clientId}/badges/${q}`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch badges"));
    }
  },

  // XP transaction history (current user only)
  getXPHistory: async (): Promise<XPHistoryEntry[]> => {
    try {
      const response = await apiClient.get<XPHistoryEntry[]>(
        `/community-forum/api/clients/${config.clientId}/user/xp-history/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch XP history"));
    }
  },

  // ─── Live voice/video Rooms (Jitsi-backed) ─────────────────────────────────
  getRooms: async (status?: RoomStatus): Promise<Room[]> => {
    try {
      const q = status ? `?status=${status}` : "";
      const response = await apiClient.get<Room[]>(
        `/community-forum/api/clients/${config.clientId}/rooms/${q}`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch rooms"));
    }
  },

  getActiveRooms: async (): Promise<Room[]> => {
    try {
      const response = await apiClient.get<Room[]>(
        `/community-forum/api/clients/${config.clientId}/rooms/active/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch live rooms"));
    }
  },

  getRoom: async (roomId: number): Promise<RoomDetail> => {
    try {
      const response = await apiClient.get<RoomDetail>(
        `/community-forum/api/clients/${config.clientId}/rooms/${roomId}/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to fetch room"));
    }
  },

  createRoom: async (data: CreateRoomRequest): Promise<RoomDetail> => {
    try {
      const response = await apiClient.post<RoomDetail>(
        `/community-forum/api/clients/${config.clientId}/rooms/`,
        data
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to create room"));
    }
  },

  deleteRoom: async (roomId: number): Promise<void> => {
    try {
      await apiClient.delete(
        `/community-forum/api/clients/${config.clientId}/rooms/${roomId}/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to delete room"));
    }
  },

  startRoom: async (roomId: number): Promise<RoomDetail> => {
    try {
      const response = await apiClient.post<RoomDetail>(
        `/community-forum/api/clients/${config.clientId}/rooms/${roomId}/start/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to start room"));
    }
  },

  endRoom: async (roomId: number): Promise<RoomDetail> => {
    try {
      const response = await apiClient.post<RoomDetail>(
        `/community-forum/api/clients/${config.clientId}/rooms/${roomId}/end/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to end room"));
    }
  },

  joinRoom: async (roomId: number): Promise<RoomDetail> => {
    try {
      const response = await apiClient.post<RoomDetail>(
        `/community-forum/api/clients/${config.clientId}/rooms/${roomId}/join/`
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to join room"));
    }
  },

  leaveRoom: async (roomId: number): Promise<void> => {
    try {
      await apiClient.post(
        `/community-forum/api/clients/${config.clientId}/rooms/${roomId}/leave/`
      );
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to leave room"));
    }
  },

  moderateRoomParticipant: async (
    roomId: number,
    userId: number,
    action: "kick" | "ban" | "unban"
  ): Promise<RoomDetail> => {
    try {
      const response = await apiClient.post<RoomDetail>(
        `/community-forum/api/clients/${config.clientId}/rooms/${roomId}/participants/${userId}/`,
        { action }
      );
      return response.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, "Failed to moderate participant"));
    }
  },

  /**
   * Fetches the narration MP3 for a tour step from the OpenAI TTS proxy.
   * Returns a blob URL the caller can hand to an <audio> element. Throws if
   * the server has no API key configured - callers should catch and fall back
   * to the browser's built-in speechSynthesis.
   */
  fetchTourNarration: async (
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova"
  ): Promise<string> => {
    try {
      const response = await apiClient.post<Blob>(
        `/community-forum/api/clients/${config.clientId}/tour/tts/`,
        { text, voice },
        { responseType: "blob" }
      );
      return URL.createObjectURL(response.data);
    } catch (err) {
      throw new Error(extractErrorMessage(err, "TTS request failed"));
    }
  },
};
