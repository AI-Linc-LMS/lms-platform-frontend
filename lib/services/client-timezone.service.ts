import apiClient from "./api";
import { config } from "../config";

export interface ClientTimezoneResponse {
  timezone: string;
  /** Ranked shortlist for the picker. Not a whitelist — the API accepts any valid IANA zone. */
  common_timezones: string[];
}

const url = () => `/accounts/clients/${config.clientId}/timezone/`;

export const clientTimezoneService = {
  get: async (): Promise<ClientTimezoneResponse> => (await apiClient.get<ClientTimezoneResponse>(url())).data,
  set: async (timezone: string): Promise<ClientTimezoneResponse> =>
    (await apiClient.patch<ClientTimezoneResponse>(url(), { timezone })).data,
};
