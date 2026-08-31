import { PageShell } from "@/components/common/PageShell";
import { JobsScope, HeroSkeleton, JobDetailSkeleton } from "@/components/jobs-v2/ui";

/**
 * The route shell for a job detail.
 *
 * It renders the SAME skeleton components the page mounts with, so the shimmer-to-content
 * transition is a crossfade rather than two unrelated loading designs in sequence.
 * `PageShimmerLayout variant="list"` — six generic avatar rows that share no layout with a dark
 * hero and a two-column detail — is not used here.
 */
export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="student">
        <HeroSkeleton />
        <JobDetailSkeleton />
      </JobsScope>
    </PageShell>
  );
}
