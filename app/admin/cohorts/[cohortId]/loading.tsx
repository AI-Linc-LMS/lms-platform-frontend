import { Box, Skeleton } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";

/**
 * Must render the SAME chrome as the page (MainLayout fullWidthContent). Without it the sidebar and
 * app bar visibly disappeared and snapped back during the transition into this route.
 */
export default function Loading() {
  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 4, mb: 2 }} />
        <Skeleton variant="rounded" height={44} sx={{ borderRadius: 999, mb: 3, maxWidth: 420 }} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
      </Box>
    </MainLayout>
  );
}
