"use client";

import { Box, Typography } from "@mui/material";

const LEADIN =
  /^\s*((?:Job\s+)?Summary|Requirements|Responsibilities|Qualifications|Benefits|Overview|Role\s+overview|Key\s+responsibilities|What\s+you(?:'|’)?ll\s+do)\s*:\s*(.*)$/i;

const bodySx = {
  whiteSpace: "pre-wrap" as const,
  lineHeight: 1.8,
  color: "#334155",
  fontSize: "0.9375rem",
};

type Props = {
  text: string;
  /** Bold common section labels (external JSON feed / scraped JDs). */
  highlightLeadins?: boolean;
};

export function JobDescriptionWithLeadins({ text, highlightLeadins }: Props) {
  if (!highlightLeadins) {
    return (
      <Typography variant="body1" component="div" sx={{ ...bodySx, "& p": { mb: 1.5 } }}>
        {text}
      </Typography>
    );
  }

  const lines = text.split("\n");
  return (
    <Box sx={bodySx}>
      {lines.map((line, i) => {
        const m = line.match(LEADIN);
        if (m) {
          return (
            <Typography key={i} component="p" variant="body1" sx={{ mb: 1.5, ...bodySx }}>
              <Box component="span" sx={{ fontWeight: 700, color: "#1e293b" }}>
                {m[1]}:
              </Box>{" "}
              {m[2]}
            </Typography>
          );
        }
        return (
          <Typography key={i} component="p" variant="body1" sx={{ mb: line ? 1 : 0.5, ...bodySx }}>
            {line || "\u00a0"}
          </Typography>
        );
      })}
    </Box>
  );
}
