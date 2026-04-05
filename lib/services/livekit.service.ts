import apiClient from "./api";
import { config } from "../config";

export interface LiveKitTokenRequest {
  assessment_id: number;
  role: "publisher" | "subscriber";
}

export interface LiveKitTokenResponse {
  token: string;
  room: string;
  livekit_url: string;
  identity: string;
}

export interface LiveParticipant {
  identity: string;
  name: string;
  email?: string;
  user_id?: number;
  joined_at: number;
  is_publishing_video: boolean;
  is_publishing_audio: boolean;
  connection_quality: number;
}

export interface LiveParticipantsResponse {
  room: string;
  participant_count: number;
  participants: LiveParticipant[];
}

export const livekitService = {
  /** Fallback when backend omits `livekit_url` on token response */
  getLivekitUrl(): string {
    return (config.livekitUrl || "").trim();
  },

  async getToken(
    params: LiveKitTokenRequest
  ): Promise<LiveKitTokenResponse> {
    const response = await apiClient.post<LiveKitTokenResponse>(
      `/proctoring/api/clients/${config.clientId}/livekit/token/`,
      {
        assessment_id: params.assessment_id,
        role: params.role,
      }
    );
    return response.data;
  },

  async getLiveParticipants(
    assessmentId: number
  ): Promise<LiveParticipantsResponse> {
    const response = await apiClient.get<LiveParticipantsResponse>(
      `/proctoring/api/clients/${config.clientId}/assessments/${assessmentId}/live-participants/`
    );
    return response.data;
  },
};
