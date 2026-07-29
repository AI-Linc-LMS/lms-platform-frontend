import apiClient from "./api";
import { config } from "../config";

/**
 * Shipped fallback list. The API returns its own ranked list, but if that request fails the picker
 * must still be usable — an empty dropdown that also says "Not set" is indistinguishable from a
 * tenant that genuinely has no zone, which is exactly how this shipped broken the first time.
 */
export const FALLBACK_TIMEZONES = [
  "Asia/Kolkata", "Asia/Riyadh", "Asia/Dubai", "Asia/Karachi", "Asia/Dhaka",
  "Asia/Colombo", "Asia/Kathmandu", "Asia/Singapore", "Asia/Kuala_Lumpur",
  "Asia/Jakarta", "Asia/Manila", "Asia/Bangkok", "Asia/Hong_Kong", "Asia/Tokyo",
  "Asia/Seoul", "Asia/Shanghai", "Asia/Tashkent", "Asia/Tehran", "Asia/Jerusalem",
  "Europe/London", "Europe/Dublin", "Europe/Paris", "Europe/Berlin", "Europe/Madrid",
  "Europe/Rome", "Europe/Amsterdam", "Europe/Warsaw", "Europe/Moscow", "Europe/Istanbul",
  "Africa/Cairo", "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Sao_Paulo", "America/Mexico_City",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Perth", "Pacific/Auckland",
  "UTC",
];

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
