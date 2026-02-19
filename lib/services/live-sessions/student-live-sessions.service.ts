/**
 * Student live-sessions API (list + recording).
 * Note: The backend does not currently expose these endpoints (neither under
 * /activity/ nor under /live-class/api/). Calls will 404 until the backend
 * adds student live-session routes. Do not point this service to
 * /live-class/api/... for these two routes—they do not exist there.
 */
import apiClient from "../api";
import { config } from "../../config";
import type {
  StudentLiveSession,
  LiveSessionRecordingResponse,
} from "./types";

const BASE = `/activity/clients/${config.clientId}`;

function isZoomSession(item: StudentLiveSession): boolean {
  return item.is_zoom === true || Boolean(item.zoom_join_url?.trim());
}

export const studentLiveSessionsService = {
  getSessions: async (): Promise<StudentLiveSession[]> => {
    const response = await apiClient.get<StudentLiveSession[]>(
      `${BASE}/student/live-sessions/`
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
