import { Box } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import {
  DataTableSkeleton,
  HairlineStripSkeleton,
  HeroSkeleton,
  JobsScope,
} from "@/components/jobs-v2/ui";

/** The reports route shell: the same strip-then-table shape the report itself mounts with. */
export default function Loading() {
  return (
    <PageShell>
      <JobsScope surface="admin">
        <HeroSkeleton />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <HairlineStripSkeleton columns={6} />
          <HairlineStripSkeleton columns={4} />
          <DataTableSkeleton columns={8} rows={8} />
        </Box>
      </JobsScope>
    </PageShell>
  );
}
