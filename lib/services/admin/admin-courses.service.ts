import apiClient from "../api";
import { config } from "../../config";

export const adminCoursesService = {
  // Get courses with pagination
  getCourses: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const url = `/admin-dashboard/api/clients/${config.clientId}/courses/${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient.get(url);
    return response.data;
  },
};


