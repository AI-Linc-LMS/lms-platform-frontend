import { CreateThread, VoteType } from "../../features/community/types";
import axiosInstance from "../axiosInstance";

export const getAllThreads = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/community-forum/api/clients/${clientId}/threads/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching threads:", error);
    throw error;
  }
};

export const createThread = async (
  clientId: number,
  threadData: CreateThread
) => {
  try {
    const response = await axiosInstance.post(
      `/community-forum/api/clients/${clientId}/threads/`,
      threadData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error;
  }
};

export const getAllTags = async (clientId: number) => {
  try {
    const response = await axiosInstance.get(
      `/community-forum/api/clients/${clientId}/tags/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
};

export const getThreadData = async (clientId: number, threadId: number) => {
  try {
    const response = await axiosInstance.get(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching thread data:", error);
    throw error;
  }
};


export const updateThread = async (
  clientId: number,
  threadId: string,
  threadData: Partial<CreateThread>
) => {
  try {
    const response = await axiosInstance.put(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/`,
      threadData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating thread:", error);
    throw error;
  }
};

export const deleteThread = async (clientId: number, threadId: string) => {
  try {
    const response = await axiosInstance.delete(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting thread:", error);
    throw error;
  }
};

export const addVoteOnThread = async (clientId: number, threadId: number, voteType: VoteType) => {
  try {
    const response = await axiosInstance.post(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/vote/`,
      { vote_type: voteType }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding vote on thread:", error);
    throw error;
  }
};

export const removeVoteOnThread = async (clientId: number, threadId: number) => {
  try {
    const response = await axiosInstance.delete(
      `/community-forum/api/clients/${clientId}/threads/${threadId}/vote/`,
    );
    return response.data;
  } catch (error) {
    console.error("Error removing vote on thread:", error);
    throw error;
  }
};
