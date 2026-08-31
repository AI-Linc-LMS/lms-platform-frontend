"use client";

import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import { CompanionCard } from "./CompanionCard";
import type { ReExplainResult, ReExplainStyle } from "@/lib/services/adaptive-video.service";

interface Props {
  /** Re-explain the last ~30s ending at the player's current time. */
  onReExplain: (style: ReExplainStyle) => Promise<ReExplainResult>;
}

const STYLES: { key: ReExplainStyle; label: string; icon: string }[] = [
  { key: "plain", label: "Plain English", icon: "mdi:translate" },
  { key: "analogy", label: "Analogies", icon: "mdi:lightbulb-on-outline" },
  { key: "code", label: "Code", icon: "mdi:code-tags" },
  { key: "formal", label: "Formal", icon: "mdi:script-text-outline" },
];

/**
 * "Feeling lost?" - the headline rescue (spec §3.4b). Re-narrates the last 30s in
 * the chosen register without losing the student's place.
 *
 * Three things were wrong here and all three read to a student as "the button does nothing":
 *  - a failed call was swallowed (`catch { setResult(null) }`) and rendered NOTHING, so a backend
 *    error, an unauthenticated session or a clip with no transcript window all looked identical
 *    to a dead button. Errors are now shown.
 *  - the headline button was hardcoded to `run("formal")` while the copy underneath promised
 *    "your chosen style". The pills now SELECT the style and the headline button runs it.
 *  - the four style pills were `flex: 1` in a single row, so "Plain English" wrapped to two lines
 *    while its neighbours stayed on one and its icon sat off-centre against the taller label.
 *    They are a 2-up grid now, which gives every label a single line at rail width.
 */
export function ReExplainPanel({ onReExplain }: Props) {
  const [loading, setLoading] = useState<ReExplainStyle | null>(null);
  const [style, setStyle] = useState<ReExplainStyle>("plain");
  const [result, setResult] = useState<ReExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (next: ReExplainStyle) => {
    setStyle(next);
    setLoading(next);
    setError(null);
    try {
      setResult(await onReExplain(next));
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setResult(null);
      setError(detail || "Couldn't re-explain this clip just now. Play a little further and try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <CompanionCard accent="#ec4899" title="Feeling lost?" icon="mdi:lifebuoy">
      <Button
        fullWidth
        variant="contained"
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:sparkles" />}
        disabled={!!loading}
        onClick={() => run(style)}
        sx={{
          textTransform: "none",
          fontWeight: 800,
          fontSize: "0.92rem",
          borderRadius: 2.5,
          py: 1.25,
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)",
          boxShadow: "0 16px 32px -16px rgba(168,85,247,0.6)",
          "&:hover": { transform: "translateY(-1px)", boxShadow: "0 20px 40px -18px rgba(236,72,153,0.65)" },
          transition: "all 140ms ease",
        }}
      >
        {loading ? "Re-narrating…" : "Re-explain this clip"}
      </Button>
      <Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mt: 1.25, mb: 1.25, lineHeight: 1.5 }}>
        We&apos;ll re-narrate the last 30s in your chosen style.
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75 }}>
        {STYLES.map((s) => {
          const selected = style === s.key;
          return (
            <Button
              key={s.key}
              size="small"
              variant="outlined"
              disabled={!!loading}
              startIcon={<Icon icon={s.icon} width={14} />}
              onClick={() => run(s.key)}
              sx={{
                textTransform: "none", borderRadius: 999, fontSize: "0.74rem", fontWeight: 700,
                minWidth: 0, px: 1, justifyContent: "center", whiteSpace: "nowrap",
                borderColor: selected ? "#a855f7" : "color-mix(in srgb, #a855f7 30%, transparent)",
                background: selected ? "color-mix(in srgb, #a855f7 10%, transparent)" : "transparent",
                color: "text.primary",
                "& .MuiButton-startIcon": { mr: 0.4, ml: 0 },
                "&:hover": { borderColor: "#a855f7", background: "color-mix(in srgb, #a855f7 8%, transparent)" },
              }}
            >
              {s.label}
            </Button>
          );
        })}
      </Box>
      {error && (
        <Box sx={{ mt: 1.75, p: 1.5, borderRadius: 2.5, display: "flex", gap: 1, alignItems: "flex-start",
          background: "color-mix(in srgb, #ef4444 7%, transparent)",
          border: "1px solid color-mix(in srgb, #ef4444 22%, transparent)" }}>
          <Icon icon="mdi:alert-circle-outline" width={16} style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
          <Typography sx={{ fontSize: "0.8rem", lineHeight: 1.5, color: "text.secondary" }}>{error}</Typography>
        </Box>
      )}
      {result && (
        <Box sx={{ mt: 1.75, p: 1.75, borderRadius: 2.5, position: "relative", overflow: "hidden",
          background: "color-mix(in srgb, #a855f7 8%, transparent)",
          border: "1px solid color-mix(in srgb, #a855f7 20%, transparent)" }}>
          <Box sx={{ display: "flex", gap: 1, mb: 0.75, alignItems: "center" }}>
            <AIPill icon={<Icon icon="mdi:sparkles" />}>{result.style}</AIPill>
            {result.cached && (
              <Typography sx={{ fontSize: "0.64rem", color: "text.secondary", alignSelf: "center" }}>instant · cached</Typography>
            )}
          </Box>
          <Typography sx={{ fontSize: "0.87rem", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{result.content}</Typography>
        </Box>
      )}
    </CompanionCard>
  );
}
