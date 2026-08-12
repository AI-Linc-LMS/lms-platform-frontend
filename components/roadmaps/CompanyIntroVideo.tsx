"use client";

import { Box, Typography } from "@mui/material";
import { toEmbedUrl } from "@/lib/utils/video-embed";
import { RM } from "./roadmapTokens";

/**
 * The company overview video.
 *
 * The URL is stored as pasted (a `vimeo.com/N` share link), so it goes through the shared
 * `toEmbedUrl` rather than being reformatted here: that helper already knows every provider
 * form this product accepts, and a second private copy of that logic is how the two drift.
 *
 * Lazy-loaded and not autoplaying. It sits above the map, and a video that starts itself on a
 * page the learner opened to read a hiring process is an interruption, not a feature.
 */
export function CompanyIntroVideo({ url, title }: { url: string; title: string }) {
  const embed = toEmbedUrl(url);
  if (!embed) return null;

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 3,
          overflow: "hidden",
          border: RM.border,
          boxShadow: RM.shadow(3),
          bgcolor: "#0f172a",
        }}
      >
        <Box
          component="iframe"
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </Box>
      <Typography sx={{ mt: 1, fontSize: 13, fontWeight: 600, color: "#475569" }}>
        {title}
      </Typography>
    </Box>
  );
}
