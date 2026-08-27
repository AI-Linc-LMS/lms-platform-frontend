import { Box } from "@mui/material";

import { PageShell } from "@/components/common/PageShell";

/**
 * Route-level skeleton at the final layout's heights: a hero-sized block, then two
 * card-sized blocks, so the page does not reflow when the real content lands.
 */
export default function InterviewHubLoading() {
  return (
    <PageShell>
      {[168, 220, 132].map((height, i) => (
        <Box
          key={i}
          sx={{
            height,
            mb: i === 0 ? 3 : 2,
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            opacity: 0.7,
          }}
        />
      ))}
    </PageShell>
  );
}
