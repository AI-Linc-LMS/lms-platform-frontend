import apiClient from "./api";
import { config } from "../config";

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
  post_type?: PostType;
  poll_options?: string[];
  poll_results?: number[];
  user_poll_vote?: number | null;
  image_urls?: string[];
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

  // Poll voting
  votePoll: async (
    threadId: number,
    optionIndex: number
  ): Promise<{ user_poll_vote: number | null; poll_results: number[] }> => {
    const response = await apiClient.post(
      `/community-forum/api/clients/${config.clientId}/threads/${threadId}/poll-vote/`,
      { option_index: optionIndex }
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

  // File uploads
  uploadFile: async (file: File): Promise<{ id: number; url: string; storage_path: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("module", "community_forum");
    const response = await apiClient.post(
      `/api/clients/${config.clientId}/upload/`,
      formData
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
};

