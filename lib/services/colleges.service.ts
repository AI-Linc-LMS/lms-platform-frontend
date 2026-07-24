import apiClient from "./api";

export interface CollegeOption {
  id: number;
  name: string;
  city?: string;
  state?: string;
}

/**
 * Global college / university master-data used by the profile "college"
 * dropdown. Backed by GET /accounts/colleges/?search=&limit= (not tenant
 * scoped). The profile still stores the college NAME as free text, so this is
 * only a source of search suggestions - if the endpoint is unavailable the
 * caller falls back to free typing.
 */
export const collegesService = {
  search: async (query: string, limit = 20): Promise<CollegeOption[]> => {
    const res = await apiClient.get(`/accounts/colleges/`, {
      params: { search: query.trim(), limit },
    });
    return res.data?.colleges ?? [];
  },
};
