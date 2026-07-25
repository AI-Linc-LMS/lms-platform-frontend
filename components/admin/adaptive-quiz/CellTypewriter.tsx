"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { AdminMcq } from "@/lib/services/admin/admin-adaptive-quiz.service";

interface CellTypewriterProps {
  mcqs: AdminMcq[];
  /** Characters per second - 60 ≈ 17 ms per char, matches the cadence
   *  ChatGPT-style streams feel like. */
  charsPerSec?: number;
  /** Fired the moment a single MCQ finishes typing - used to push that one
   *  MCQ into the parent draft so the bank counter ticks up live. */
  onMcqComplete: (mcq: AdminMcq) => void;
  /** Fired after every MCQ has finished. Parent flips cell to "done" here. */
  onAllComplete: () => void;
}

const PAUSE_BETWEEN_MCQS_MS = 220;

/**
 * Character-by-character reveal of an MCQ's question text. Renders inline
 * inside a "generating" cell card so the AI's output appears to be typed out
 * live the moment the network response lands. Uses an elapsed-time derived
 * cursor (not setInterval count++), so a tab-out/tab-in resyncs cleanly
 * instead of falling behind.
 */
export function CellTypewriter({
  mcqs,
  charsPerSec = 60,
  onMcqComplete,
  onAllComplete,
}: CellTypewriterProps) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  // Refs let callbacks stay stable across renders without retriggering effects.
  const completionFiredRef = useRef(false);
  const onCompleteRef = useRef(onAllComplete);
  const onMcqRef = useRef(onMcqComplete);
  onCompleteRef.current = onAllComplete;
  onMcqRef.current = onMcqComplete;

  const total = mcqs.length;
  const current = mcqs[idx];
  const targetText = current?.question_text ?? "";

  useEffect(() => {
    if (!current) {
      if (!completionFiredRef.current) {
        completionFiredRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    setTyped("");
    const charMs = 1000 / Math.max(charsPerSec, 1);
    const startedAt = performance.now();
    let raf: number;

    function tick() {
      const elapsed = performance.now() - startedAt;
      const target = Math.min(targetText.length, Math.floor(elapsed / charMs));
      setTyped(targetText.slice(0, target));
      if (target < targetText.length) {
        raf = window.requestAnimationFrame(tick);
        return;
      }
      // Done with this MCQ - fire per-MCQ callback, brief pause, then advance.
      onMcqRef.current(current);
      window.setTimeout(() => setIdx((i) => i + 1), PAUSE_BETWEEN_MCQS_MS);
    }
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [idx, current, targetText, charsPerSec]);

  if (!current) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Icon icon="mdi:fountain-pen-tip" width={12} style={{ color: "#a855f7" }} />
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#a855f7",
          }}
        >
          Writing question {idx + 1} of {total}
        </Typography>
      </Box>
      <Box
        sx={{
          px: 1,
          py: 0.75,
          borderRadius: 1.5,
          bgcolor: "color-mix(in srgb, #a855f7 5%, transparent)",
          border: "1px solid color-mix(in srgb, #a855f7 18%, transparent)",
          minHeight: 42,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.78rem",
            lineHeight: 1.45,
            color: "text.primary",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            wordBreak: "break-word",
          }}
        >
          {typed}
          <Box
            component="span"
            aria-hidden
            sx={{
              display: "inline-block",
              width: "0.5em",
              ml: 0.3,
              borderRight: "1.5px solid #a855f7",
              animation: "cell-typewriter-blink 0.9s steps(2) infinite",
            }}
          />
        </Typography>
      </Box>
      <style jsx global>{`
        @keyframes cell-typewriter-blink {
          0%, 49% { border-right-color: #a855f7; }
          50%, 100% { border-right-color: transparent; }
        }
      `}</style>
    </Box>
  );
}
