"use client";

import { useEffect } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Route-level error boundary for everything under /mock-interview (take page, result page,
 * courses, etc.). Next.js App Router renders this client component whenever a descendant
 * throws during render. Before this existed, an unguarded throw (e.g. a result page reading
 * a missing evaluation field) produced a blank/broken screen - especially on the user side.
 * Now any residual throw degrades to a friendly card with a retry + a way back.
 */
export default function MockInterviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console (and any wired error reporter) for diagnosis.
    console.error("Mock-interview route error:", error);
  }, [error]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          mx: "auto",
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--error-surface, #fef2f2)",
        }}
      >
        <IconWrapper icon="mdi:alert-circle-outline" size={36} color="var(--ats-error, #ef4444)" />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: "var(--font-primary-dark)" }}>
        Something went wrong
      </Typography>
      <Typography variant="body1" sx={{ color: "var(--font-secondary)", mb: 4, lineHeight: 1.6 }}>
        We hit a snag loading this page. Your interview progress and results are saved - try
        again, or head back to your interviews.
      </Typography>
      <Box sx={{ display: "inline-flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
        <Button
          variant="contained"
          onClick={() => reset()}
          startIcon={<IconWrapper icon="mdi:refresh" size={18} />}
          sx={{
            px: 2.5,
            py: 1.25,
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "var(--accent-indigo)",
            color: "var(--font-light)",
            "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
          }}
        >
          Try again
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            window.location.href = "/mock-interview";
          }}
          sx={{
            px: 2.5,
            py: 1.25,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "var(--border-default)",
            color: "var(--font-primary)",
          }}
        >
          Back to interviews
        </Button>
      </Box>
    </Container>
  );
}
