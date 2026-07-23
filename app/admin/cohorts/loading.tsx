import { Box, Skeleton } from "@mui/material";

export default function Loading() {
  return (
    <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
      <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4, mb: 3 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 4 }} />
        ))}
      </Box>
    </Box>
  );
}
