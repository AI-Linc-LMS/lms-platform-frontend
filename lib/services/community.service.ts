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
  post_type?: PostType;
  poll_options?: string[];
  poll_results?: number[];
  user_poll_vote?: number | null;
  image_urls?: string[];
  bounty?: BountyInfo | null;
  current_user_is_author?: boolean;
  current_user_role?: string | null;
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

export const communityService = {
  // Thread Management
  getThreads: async (): Promise<Thread[]> => {
    try {
      const response = await apiClient.get<Thread[]>(
        `/community-forum/api/clients/${config.clientId}/threads/`
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
  getBounties: async (): Promise<BountyItem[]> => {
    try {
      const response = await apiClient.get<BountyItem[]>(
        `/community-forum/api/clients/${config.clientId}/bounties/`
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
};
