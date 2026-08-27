"use client";

import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * Route error boundary. Without one, a render error here unmounts the whole layout and the
 * candidate loses the sidebar too; with it, the failure is one page wide and recoverable.
 */
export default function InterviewHubError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh", px: 3 }}>
      <Box sx={{ textAlign: "center", maxWidth: 420 }}>
        <Icon icon="solar:confounded-square-line-duotone" width={40} color="var(--font-tertiary)" />
        <Typography sx={{ mt: 2, fontWeight: 600, fontSize: "1.05rem", color: "var(--font-primary)" }}>
          Something went wrong loading interviews.
        </Typography>
        <Typography sx={{ mt: 1, fontSize: "0.9rem", color: "var(--font-secondary)" }}>
          Your attempts and results are safe. Try again, and if this keeps happening, tell
          your administrator.
        </Typography>
        <Button
          onClick={reset}
          variant="contained"
          disableElevation
          sx={{ mt: 2.5, textTransform: "none", borderRadius: 2, fontWeight: 600 }}
        >
          Try again
        </Button>
      </Box>
    </Box>
  );
}
