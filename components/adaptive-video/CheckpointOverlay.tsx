"use client";

import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import type { AskResult } from "@/lib/services/adaptive-video.service";

interface Props {
  timestamp: number;
  onAsk: (question: string, ts: number) => Promise<AskResult>;
  onResume: () => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * The "Pause & ask every 60s" checkpoint (watch mode `pause_60s`). Every minute of playback the
 * player pauses and surfaces this reflection prompt - the student can ask about the moment they're
 * on (reusing the timestamp Q&A) or resume. A lightweight comprehension nudge between the fixed,
 * concept-boundary check-ins.
 */
export function CheckpointOverlay({ timestamp, onAsk, onResume }: Props) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true);
    try {
      const r = await onAsk(question, timestamp);
      setAnswer(r.answer);
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setAnswer(detail || "Couldn't answer just now - resume and try the Ask box any time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(15, 12, 41, 0.82)", backdropFilter: "blur(6px)", zIndex: 20, p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 480, bgcolor: "var(--card-bg, #fff)", borderRadius: 3, p: 2.5,
        boxShadow: "0 24px 60px -24px rgba(0,0,0,0.5)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <AIPill icon={<Icon icon="mdi:timer-sand" />}>Checkpoint</AIPill>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>Paused at {fmt(timestamp)}</Typography>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", mb: 0.5 }}>Still with it?</Typography>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1.5 }}>
          Anything unclear about this part? Ask now, or resume.
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth size="small" placeholder="Ask about this moment…" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void ask(); }}
            disabled={loading}
          />
          <Button
            onClick={() => void ask()} disabled={loading || !q.trim()} variant="contained"
            sx={{ borderRadius: 2, background: "linear-gradient(135deg,#6366f1,#a855f7)", minWidth: 64, fontWeight: 800 }}
          >
            {loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Ask"}
          </Button>
        </Box>
        {answer && (
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "color-mix(in srgb,#a855f7 8%,transparent)",
            border: "1px solid color-mix(in srgb,#a855f7 18%,transparent)" }}>
            <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{answer}</Typography>
          </Box>
        )}
        <Button fullWidth onClick={onResume} variant="text" sx={{ mt: 1.5, fontWeight: 800, color: "#6366f1", gap: 0.5 }}>
          <Icon icon="mdi:play" width={18} /> Resume
        </Button>
      </Box>
    </Box>
  );
}
