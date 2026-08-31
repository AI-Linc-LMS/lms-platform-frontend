import { PageShell } from "@/components/common/PageShell";
import { HeroSkeleton, JobDetailSkeleton, JobsScope } from "@/components/jobs-v2/ui";

/**
 * The route shell renders the SAME skeleton the client mounts with, so the shimmer-to-content
 * transition is a crossfade rather than two unrelated loading designs in sequence.
 */
export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="admin">
        <HeroSkeleton />
        <JobDetailSkeleton />
      </JobsScope>
    </PageShell>
  );
}
