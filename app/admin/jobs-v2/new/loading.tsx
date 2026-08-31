import { PageShell } from "@/components/common/PageShell";
import { FormSkeleton, HeroSkeleton, JobsScope } from "@/components/jobs-v2/ui";

/**
 * A hard load of `/admin/jobs-v2/new?scraped_job_id=...` used to paint a completely blank page:
 * the route's `<Suspense fallback>` was `null`. It is a form-shaped skeleton now, here and in
 * the page's own Suspense boundary.
 */
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
