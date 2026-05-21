"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { celebrationBurst } from "@/lib/motion/scorecard-presets";

interface LevelUpToastProps {
  open: boolean;
  title: string;
  description?: string;
  onDismiss?: () => void;
  autoHideMs?: number;
}

/**
 * Slide-down celebratory toast for badge unlocks / level-ups.
 * Parent owns the `open` state; we trigger auto-hide via a timer that calls
 * `onDismiss` so the parent flips `open` back to false.
 */
export function LevelUpToast({ open, title, description, onDismiss, autoHideMs = 4500 }: LevelUpToastProps) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!open || autoHideMs <= 0) return undefined;
    const t = window.setTimeout(() => onDismissRef.current?.(), autoHideMs);
    return () => window.clearTimeout(t);
  }, [open, autoHideMs]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 22 } }}
          exit={{ y: -16, opacity: 0, transition: { duration: 0.18 } }}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px 12px 12px",
            borderRadius: 999,
            background: "var(--sc-bg-elevated)",
            border: "1px solid var(--sc-border-strong)",
            boxShadow: "var(--sc-shadow-elevated)",
            minWidth: 280,
            maxWidth: 480,
          }}
        >
          <motion.span
            variants={celebrationBurst}
            initial="initial"
            animate="animate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "var(--sc-gradient-hero)",
              color: "#fff",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <Sparkles size={18} />
          </motion.span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sc-text-primary)" }}>{title}</span>
            {description ? (
              <span style={{ fontSize: 12, color: "var(--sc-text-muted)" }}>{description}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss?.()}
            aria-label="Dismiss"
            style={{
              marginLeft: "auto",
              padding: 6,
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: "var(--sc-text-muted)",
              cursor: "pointer",
              display: "inline-flex",
            }}
          >
            <X size={14} />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
