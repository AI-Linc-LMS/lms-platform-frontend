import { PageShell } from "@/components/common/PageShell";
import { JobsScope, HeroSkeleton, JobDetailSkeleton } from "@/components/jobs-v2/ui";

/** Hero plus the two-column detail shape the application page mounts with. */
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
