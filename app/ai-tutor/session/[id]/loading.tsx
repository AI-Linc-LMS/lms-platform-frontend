import { Box } from "@mui/material";

/**
 * The room's route-segment shimmer.
 *
 * Deliberately NOT `PageShimmerLayout`: that renders light grey blocks, and flashing a light
 * skeleton before a dark room is more jarring than a beat of nothing. This paints the room's
 * exact ground and chrome, so the transition reads as the room arriving rather than as a page
 * swap. The learner clicked "Start talking" and should feel the room open immediately, even
 * though the session POST and the microphone prompt are still ahead.
 */
export default function Loading() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // The full viewport. The room hides the global app bar, so subtracting its 64px left a
        // strip of the light page background below the shimmer - a white band across the bottom
        // of an otherwise dark screen, and the same defect the room itself had.
        height: "100dvh",
        background:
          "radial-gradient(115% 90% at 50% 8%, #241653 0%, #170d38 42%, #0b0619 100%)",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ ...block, width: 40, height: 40, borderRadius: "10px" }} />
        <Box>
          <Box sx={{ ...block, width: 160, height: 15, mb: 0.75 }} />
          <Box sx={{ ...block, width: 70, height: 11 }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Plan rail */}
        <Box
          sx={{
            width: 250,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.1)",
            p: 2.5,
            display: { xs: "none", lg: "block" },
          }}
        >
          <Box sx={{ ...block, width: 110, height: 11, mb: 3 }} />
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: "flex", gap: 1.25, mb: 2 }}>
              <Box sx={{ ...block, width: 16, height: 16, borderRadius: "50%" }} />
              <Box sx={{ ...block, width: 140 - i * 14, height: 13 }} />
            </Box>
          ))}
        </Box>

        {/* Stage: a soft violet bloom where the ribbon is about to appear. */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Box
            sx={{
              flexShrink: 0,
              height: { xs: 300, md: "min(52vh, 460px)" },
              display: "grid",
              placeItems: "center",
            }}
          >
            <Box
              sx={{
                width: "min(70%, 560px)",
                height: 3,
                borderRadius: 9999,
                background:
                  "linear-gradient(90deg, transparent, rgba(168,85,247,0.85), transparent)",
                animation: "tutorBoot 1.6s ease-in-out infinite",
                "@keyframes tutorBoot": {
                  "0%, 100%": { opacity: 0.25, transform: "scaleX(0.6)" },
                  "50%": { opacity: 1, transform: "scaleX(1)" },
                },
                "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 0.6 },
              }}
            />
          </Box>
          <Box sx={{ display: "grid", placeItems: "center", pt: 2.5 }}>
            <Box sx={{ ...block, width: 260, height: 15 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const block = {
  bgcolor: "rgba(255,255,255,0.09)",
  borderRadius: "6px",
} as const;
