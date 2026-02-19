import apiClient from "../api";
import { config } from "../../config";
import type {
  StudentLiveSession,
  LiveSessionRecordingResponse,
} from "./types";

const BASE = `/live-class/api/clients/${config.clientId}`;

function isZoomSession(item: StudentLiveSession): boolean {
  return item.is_zoom === true || Boolean(item.zoom_join_url?.trim());
}

export const studentLiveSessionsService = {
  getSessions: async (): Promise<StudentLiveSession[]> => {
    const response = await apiClient.get<StudentLiveSession[]>(
      `${BASE}/live-activities/`
    );
    const data = response.data;
    const list = Array.isArray(data) ? data : [];
    return list.filter(isZoomSession);
  },

  getRecording: async (
    activityId: number
  ): Promise<LiveSessionRecordingResponse> => {
    const response = await apiClient.get<LiveSessionRecordingResponse>(
      `${BASE}/student/live-sessions/${activityId}/recording/`
    );
    return response.data;
  },
};
