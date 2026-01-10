import apiClient from './api';

export interface Job {
  id: number;
  job_title: string;
  company_name: string;
  company_logo?: string;
  rating?: string;
  reviews?: string;
  experience?: string;
  salary?: string;
  location: string;
  job_description: string;
  tags: string[];
  job_post_date: string;
  job_url: string;
  job_type: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobFilters {
  location?: string;
  job_type?: string;
  search?: string;
  skills?: string[];
  page?: number;
  page_size?: number;
}

export interface JobsResponse {
  results: Job[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export const jobsService = {
  // Get jobs with optional filters (NO pagination - fetch all)
  getJobs: async (filters?: JobFilters): Promise<JobsResponse> => {
    const params = new URLSearchParams();
    if (filters?.location) params.append('location', filters.location);
    if (filters?.job_type) params.append('job_type', filters.job_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.skills && filters.skills.length > 0) {
      filters.skills.forEach(skill => params.append('skills', skill));
    }
    // Removed pagination parameters - fetch all jobs

    const queryString = params.toString();
    const url = `/jobs/api/getjobs/${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await apiClient.get<any>(url);
      
      // Handle paginated response
      if (response.data && typeof response.data === 'object') {
        const dataObj = response.data;
        
        // Check if it's a paginated response
        if ('results' in dataObj && Array.isArray(dataObj.results)) {
          return {
            results: dataObj.results,
            count: dataObj.count || dataObj.results.length,
            next: dataObj.next || null,
            previous: dataObj.previous || null,
          };
        }
        
        // Check if it's a direct array (backward compatibility)
        if (Array.isArray(dataObj)) {
          return {
            results: dataObj,
            count: dataObj.length,
            next: null,
            previous: null,
          };
        }
        
        // Check if it's wrapped in a 'data' property
        if ('data' in dataObj && Array.isArray(dataObj.data)) {
          return {
            results: dataObj.data,
            count: dataObj.count || dataObj.data.length,
            next: dataObj.next || null,
            previous: dataObj.previous || null,
          };
        }
      }
      
      return {
        results: [],
        count: 0,
        next: null,
        previous: null,
      };
    } catch (error) {
      return {
        results: [],
        count: 0,
        next: null,
        previous: null,
      };
    }
  },
};


