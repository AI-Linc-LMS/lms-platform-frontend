import { Box } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import {
  DataTableSkeleton,
  HairlineStripSkeleton,
  HeroSkeleton,
  JobsScope,
} from "@/components/jobs-v2/ui";

/**
 * The route shell renders the **same** skeletons the client mounts with, so the shimmer-to-
 * content swap is a crossfade rather than a relayout.
 *
 * `PageShimmerLayout variant="list"` is deleted here: its ten avatar rows share no layout with
 * a dark hero and a nine-column table, and its `rows={6}` prop actually rendered ten.
 */
export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="admin">
        <HeroSkeleton />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <HairlineStripSkeleton columns={5} />
          <DataTableSkeleton columns={9} rows={8} />
        </Box>
      </JobsScope>
    </PageShell>
  );
}
