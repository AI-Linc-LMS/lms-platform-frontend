import { Box, Skeleton } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";

/**
 * The route-segment fallback. It must render the SAME chrome as the page
 * (PageShell -> MainLayout) or the sidebar and app bar visibly disappear and
 * snap back during the transition, and it must have the page's own SHAPE -
 * hero, stat strip, tab track, design grid - so nothing jumps when the hub
 * mounts. The generic list shimmer is a different layout in both respects.
 */
export default function Loading() {
  return (
    <PageShell>
      <Box aria-busy="true">
        <Skeleton variant="rounded" height={168} sx={{ borderRadius: 4, mb: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 1.5,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                height: 72,
                borderRadius: "var(--radius-card)",
                bgcolor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
                opacity: 0.6,
              }}
            />
          ))}
        </Box>

        <Skeleton
          variant="rounded"
          height={46}
          width={420}
          sx={{ borderRadius: 999, mt: 3, mb: 2, maxWidth: "100%" }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 2.5,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={280}
              sx={{ borderRadius: "var(--radius-card)" }}
            />
          ))}
        </Box>
      </Box>
    </PageShell>
  );
}
