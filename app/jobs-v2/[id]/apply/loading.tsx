import { PageShell } from "@/components/common/PageShell";
import { JobsScope, HeroSkeleton, ApplyStepSkeleton } from "@/components/jobs-v2/ui";

/** Hero, stepper and one card — the shape `ApplyFlow` mounts with. */
export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="student">
        <HeroSkeleton />
        <ApplyStepSkeleton />
      </JobsScope>
    </PageShell>
  );
}
