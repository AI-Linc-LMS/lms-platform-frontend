"use client";

import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import type { AskResult } from "@/lib/services/adaptive-video.service";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Ask-at-this-moment Q&A (spec §3.3c): a question pinned to the exact second the
 * student is watching, answered with on-screen context, plus what others asked here.
 */
export function TimestampQA({
  currentTime,
  onAsk,
}: {
  currentTime: number;
  onAsk: (question: string, timestamp: number) => Promise<AskResult>;
}) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    try {
      setResult(await onAsk(question.trim(), currentTime));
      setQuestion("");
    } catch (e) {
      // A rejected (malicious/abusive) question comes back as a 400 with a reason; surface it.
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Couldn't answer that just now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 2.5, pt: 2, borderTop: "1px solid var(--border-default, #ececf1)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <AIPill icon={<Icon icon="mdi:comment-question-outline" />}>Ask at this moment</AIPill>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, ml: "auto", px: 1, py: 0.3, borderRadius: 999,
          background: "color-mix(in srgb, #6366f1 12%, transparent)", color: "#6366f1", fontSize: "0.7rem", fontWeight: 800 }}>
          <Icon icon="mdi:pin" width={12} /> {fmt(currentTime)}
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask about what's on screen right now…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "var(--card-bg, #fff)" } }}
        />
        <Button
          variant="contained"
          disabled={loading || !question.trim()}
          onClick={submit}
          sx={{ borderRadius: 2.5, px: 2.5, fontWeight: 700, textTransform: "none",
            background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : "Ask"}
        </Button>
      </Box>

      {error && (
        <Box sx={{ mt: 1.25, display: "flex", alignItems: "flex-start", gap: 0.6, color: "#b91c1c" }}>
          <Icon icon="mdi:shield-alert-outline" width={15} style={{ marginTop: 2, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{error}</Typography>
        </Box>
      )}

      {result && (
        <Box sx={{ mt: 1.5, p: 1.75, borderRadius: 2.5, bgcolor: "var(--card-bg, #fff)",
          border: "1px solid color-mix(in srgb, #6366f1 14%, transparent)" }}>
          <Typography sx={{ fontSize: "0.83rem", fontWeight: 800, mb: 0.5, display: "flex", gap: 0.5, alignItems: "center" }}>
            <Icon icon="mdi:account-question" width={15} style={{ color: "#6366f1" }} />
            {result.question}
          </Typography>
          <Typography sx={{ fontSize: "0.87rem", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{result.answer}</Typography>
        </Box>
      )}

      {result?.others_asked?.length ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.secondary", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Others asked here
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {result.others_asked.map((q, i) => (
              <Box key={i} sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                <Icon icon="mdi:chat-outline" width={14} style={{ color: "#94a3b8", marginTop: 3, flexShrink: 0 }} />
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{q.question}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
