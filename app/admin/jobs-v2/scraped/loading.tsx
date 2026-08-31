import { Box } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { HeroSkeleton, JobsScope, ScrapedTableSkeleton } from "@/components/jobs-v2/ui";

/**
 * The scraped queue's route shell. Without one the previous page sat frozen until this route's
 * client bundle mounted; with one the shimmer is the same shape the queue itself mounts with.
 */
export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="admin">
        <HeroSkeleton />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ScrapedTableSkeleton rows={8} />
        </Box>
      </JobsScope>
    </PageShell>
  );
}
