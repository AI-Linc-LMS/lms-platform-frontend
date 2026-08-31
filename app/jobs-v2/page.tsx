"use client";

import { Suspense } from "react";
import { PageShell } from "@/components/common/PageShell";
import { JobsScope } from "@/components/jobs-v2/ui";
import { JobBoard } from "@/components/jobs-v2/board/JobBoard";
import { BoardShellSkeleton } from "@/components/jobs-v2/board/BoardShellSkeleton";

/**
 * The student job board.
 *
 * The route is the shell and nothing else: `PageShell` then `JobsScope` then the board. It used
 * to be 755 lines holding two complete copies of the same page — one for `lg+`, one for below —
 * plus the experience parser, the row component, six pieces of filter state and four loading
 * dialects. All of that now lives in `components/jobs-v2/board/*` as ONE tree.
 *
 * `JobBoard` reads `useSearchParams` (the URL is the filter state, spec 5.1.1), so it mounts
 * inside a Suspense boundary whose fallback is the SAME skeleton `loading.tsx` renders — the
 * shimmer-to-content swap is therefore a crossfade, not a relayout.
 */
export default function JobsV2Page() {
  return (
    <PageShell>
      <JobsScope surface="student">
        <Suspense fallback={<BoardShellSkeleton />}>
          <JobBoard />
        </Suspense>
      </JobsScope>
    </PageShell>
  );
}
