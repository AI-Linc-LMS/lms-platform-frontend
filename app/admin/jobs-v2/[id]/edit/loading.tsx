import { PageShell } from "@/components/common/PageShell";
import { FormSkeleton, HeroSkeleton, JobsScope } from "@/components/jobs-v2/ui";

export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="admin">
        <HeroSkeleton />
        <FormSkeleton sections={2} fields={5} />
      </JobsScope>
    </PageShell>
  );
}
