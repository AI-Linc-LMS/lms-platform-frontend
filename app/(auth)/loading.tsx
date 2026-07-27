import { Box, CircularProgress } from "@mui/material";

/**
 * Loading UI for the unauthenticated routes (login / signup / forgot / reset / verify).
 *
 * Without this file these routes fell back to the ROOT app/loading.tsx, which renders
 * `PageShimmerLayout` — and that wraps MainLayout. So a LOGGED-OUT visitor briefly saw the full app
 * chrome (sidebar + app bar) shimmering before the login form appeared, which is both wrong and an
 * extra visual phase. A bare centered spinner on the auth background is the honest shape here.
 */
export default function AuthLoading() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
      }}
    >
      <CircularProgress size={36} />
    </Box>
  );
}
