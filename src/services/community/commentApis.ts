import { CreateComment } from "../../features/community/types";
import axiosInstance from "../axiosInstance";

export const addBookmark = async (clientId: number, threadId: number ) => {
  try {
    const response = await axiosInstance.post(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/bookmark/`
    );
    return response.data;
  } catch (error) {
    console.error("Error creating bookmark:", error);
    throw error;
  }
};

export const removeBookmark = async (clientId: number, threadId: number) => {
  try {
    const response = await axiosInstance.delete(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/bookmarks/`
    );
    return response.data;
  } catch (error) {
    console.error("Error removing bookmark:", error);
    throw error;
  }
};

export const getAllComments = async (clientId: number, threadId: string) => {
  try {
    const response = await axiosInstance.get(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/comments/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

export const createComment = async (clientId: number, threadId: string, commentData: CreateComment) => {
  try {
    const response = await axiosInstance.post(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/comments/`,
      commentData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

export const updateComment = async (clientId: number, threadId: string, commentId: string, commentData: Partial<CreateComment>) => {
  try {
    const response = await axiosInstance.put(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/comments/${commentId}/`,
      commentData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

export const deleteComment = async (clientId: number, threadId: string, commentId: string) => {
  try {
    const response = await axiosInstance.delete(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/comments/${commentId}/`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

export const addVoteOnComment = async (clientId: number, threadId: string, commentId: string) => {
  try {
    const response = await axiosInstance.post(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/comments/${commentId}/vote/`
    );
    return response.data;
  } catch (error) {
    console.error("Error adding vote on comment:", error);
    throw error;
  }
};

export const removeVoteOnComment = async (clientId: number, threadId: string, commentId: string) => {
  try {
    const response = await axiosInstance.delete(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/comments/${commentId}/vote/`
    );
    return response.data;
  } catch (error) {
    console.error("Error removing vote on comment:", error);
    throw error;
  }
};
