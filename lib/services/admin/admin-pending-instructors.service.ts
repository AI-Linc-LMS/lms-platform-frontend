import apiClient from "../api";
import { config } from "../../config";

export interface PendingInstructor {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export const adminPendingInstructorsService = {
  listPendingInstructors: async (): Promise<PendingInstructor[]> => {
    const response = await apiClient.get<unknown>(
      `/admin-dashboard/api/clients/${config.clientId}/pending-instructors/`
    );
    return normalizeList<PendingInstructor>(response.data);
  },

  approvePendingInstructor: async (
    profileId: number
  ): Promise<{ detail: string; profile?: unknown }> => {
    const response = await apiClient.post<{
      detail: string;
      profile?: unknown;
    }>(
      `/admin-dashboard/api/clients/${config.clientId}/pending-instructors/${profileId}/approve/`,
      {}
    );
    return response.data;
  },
};
