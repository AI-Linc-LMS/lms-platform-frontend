import apiClient from "../api";
import { config } from "../../config";
import type { ScorecardData } from "@/lib/types/scorecard.types";
import { scorecardFromApiPayload } from "../scorecard/build-scorecard";

function getAdminBaseUrl(): string {
  return `/admin-dashboard/api/clients/${config.clientId}`;
}

/**
 * Fetch scorecard data for a student (admin view).
 * @param userProfileId - UserProfile (student) ID
 */
export async function getAdminScorecardForStudent(userProfileId: number): Promise<ScorecardData> {
  const response = await apiClient.get(`${getAdminBaseUrl()}/scorecard/`, {
    params: { user_id: userProfileId },
  });
  return scorecardFromApiPayload(response.data);
}

export interface ScorecardConfigResponse {
  enabled_modules: string[];
}

/**
 * Get scorecard config (enabled modules).
 */
export async function getAdminScorecardConfig(): Promise<ScorecardConfigResponse> {
  const response = await apiClient.get<ScorecardConfigResponse>(
    `${getAdminBaseUrl()}/scorecard-config/`
  );
  return response.data;
}

/**
 * Update scorecard config.
 */
export async function updateAdminScorecardConfig(data: {
  enabled_modules?: string[];
}): Promise<ScorecardConfigResponse> {
  const response = await apiClient.patch<ScorecardConfigResponse>(
    `${getAdminBaseUrl()}/scorecard-config/`,
    data
  );
  return response.data;
}
