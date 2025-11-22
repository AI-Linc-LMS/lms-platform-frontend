import { useQuery } from "@tanstack/react-query";
import { getEnrolledCourses } from "../../../services/enrolled-courses-content/coursesApis";

/**
 * Shared hook for fetching enrolled courses with optimized caching
 * Consolidates duplicate queries from Learn.tsx and EnrolledCourses.tsx
 */
export const useEnrolledCourses = (clientId: number | null) => {
  return useQuery({
    queryKey: ["Courses", clientId],
    queryFn: () => getEnrolledCourses(clientId as number),
    enabled: !!clientId,
    refetchOnWindowFocus: false, // Disabled to avoid unnecessary refetches
    refetchOnMount: false, // Only refetch if data is stale
    refetchOnReconnect: true, // Refetch on reconnect (network restored)
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 min
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache for 10 min
    // Only refetch when tab becomes visible (using visibility API in component)
  });
};

