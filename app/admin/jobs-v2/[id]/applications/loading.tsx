import { PageShell } from "@/components/common/PageShell";
import {
  DataTableSkeleton,
  HairlineStripSkeleton,
  HeroSkeleton,
  JobsScope,
} from "@/components/jobs-v2/ui";

export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="admin">
        <HeroSkeleton />
        <HairlineStripSkeleton columns={6} />
        <DataTableSkeleton columns={7} rows={8} />
      </JobsScope>
    </PageShell>
  );
}
