import apiClient from "./api";
import { config } from "../config";

const BASE = `/live-class/api/clients/${config.clientId}`;

export interface LiveClassSession {
  id: number;
  topic_name?: string;
  title?: string;
  description?: string;
  class_datetime?: string;
  scheduled_time?: string;
  duration_minutes: number;
  instructor?: { id: number; name?: string } | number;
  status?: string;
  meeting_link?: string;
}

export interface CreateLiveClassSessionPayload {
  topic_name: string;
  description?: string;
  class_datetime: string;
  duration_minutes: number;
  instructor_id?: number;
  instructor?: number;
}

export interface UpdateLiveClassSessionPayload {
  topic_name?: string;
  description?: string;
  class_datetime?: string;
  duration_minutes?: number;
  meeting_link?: string;
  status?: string;
}

export const liveClassService = {
  getSessions: async (params?: {
    status?: string;
    upcoming?: boolean;
  }): Promise<LiveClassSession[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.upcoming != null)
      query.append("upcoming", String(params.upcoming));
    const url = `${BASE}/sessions/${query.toString() ? `?${query}` : ""}`;
    const response = await apiClient.get<LiveClassSession[]>(url);
    return response.data;
  },

  createSession: async (
    payload: CreateLiveClassSessionPayload
  ): Promise<LiveClassSession> => {
    const response = await apiClient.post<LiveClassSession>(
      `${BASE}/sessions/create/`,
      payload
    );
    return response.data;
  },

  updateSession: async (
    classId: number,
    payload: UpdateLiveClassSessionPayload
  ): Promise<LiveClassSession> => {
    const response = await apiClient.patch<LiveClassSession>(
      `${BASE}/sessions/${classId}/update/`,
      payload
    );
    return response.data;
  },
};
