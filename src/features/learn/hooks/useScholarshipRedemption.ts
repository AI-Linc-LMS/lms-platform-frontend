import { useQuery } from "@tanstack/react-query";
import { getScholarshipRedemptionDetails, ScholarshipRedemptionData } from "../../../services/assesment/scholarshipApis";

export const useScholarshipRedemption = (
  clientId: string,
  assessmentId: string,
  enabled: boolean = true
) => {
  return useQuery<ScholarshipRedemptionData, Error>({
    queryKey: ["scholarshipRedemption", clientId, assessmentId],
    queryFn: () => getScholarshipRedemptionDetails(clientId, assessmentId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}; 