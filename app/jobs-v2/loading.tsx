import { PageShell } from "@/components/common/PageShell";
import { JobsScope } from "@/components/jobs-v2/ui";
import { BoardShellSkeleton } from "@/components/jobs-v2/board/BoardShellSkeleton";

/**
 * The route-segment shell.
 *
 * It renders the board's OWN skeleton, not `PageShimmerLayout variant="list"` — whose six
 * generic avatar rows share no layout with a dark hero, a pill tab track, a filter rail and a
 * two-column card grid, and therefore reflowed the entire page on swap.
 */
export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="student">
        <BoardShellSkeleton />
      </JobsScope>
    </PageShell>
  );
}
