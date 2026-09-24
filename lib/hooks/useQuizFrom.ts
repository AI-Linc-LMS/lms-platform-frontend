"use client";

import { useSearchParams } from "next/navigation";
import { safeFrom } from "@/lib/utils/return-to";

/**
 * The page that launched the quiz runtime (`?from=`), or null.
 *
 * Every hop inside the runtime - start, live session, results, a re-quiz, another attempt in the
 * chain, the source attempt's results - must pass it on with `withFrom`. A hop that dropped it is
 * how a learner who started in a course finished on the standalone quiz library.
 */
export function useQuizFrom(): string | null {
  const params = useSearchParams();
  return safeFrom(params?.get("from"));
}
