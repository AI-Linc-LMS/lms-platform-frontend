import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getStreakTableData,
  type StreakData,
} from "../../../services/dashboardApis";

export const STREAK_QUERY_KEY = "streak" as const;

type StreakQueryKey = [typeof STREAK_QUERY_KEY, number];

type StreakQueryOptions = Omit<
  UseQueryOptions<StreakData, Error, StreakData, StreakQueryKey>,
  "queryKey" | "queryFn"
>;

export const useStreakData = (
  clientId: number | null,
  options?: StreakQueryOptions
) => {
  return useQuery<StreakData, Error, StreakData, StreakQueryKey>({
    queryKey: [STREAK_QUERY_KEY, clientId ?? 0],
    queryFn: () => getStreakTableData(clientId ?? 0),
    enabled: (clientId !== null && clientId !== undefined) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};


