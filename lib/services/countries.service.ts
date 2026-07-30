import apiClient from "./api";

export interface CountryOption {
  code: string;
  code3: string;
  name: string;
}

/**
 * ISO 3166-1 countries for the profile "country" dropdown.
 *
 * Served from the same module the backend validator reads, so the picker can never offer a value
 * the validator would then reject. Backed by GET /accounts/countries/ (global, not tenant-scoped).
 *
 * Unlike the college list this is small and static, so it is fetched once and filtered in the
 * browser rather than round-tripping on every keystroke.
 */
export const countriesService = {
  list: async (): Promise<CountryOption[]> => {
    const res = await apiClient.get(`/accounts/countries/`, { params: { limit: 250 } });
    return res.data?.countries ?? [];
  },
};
