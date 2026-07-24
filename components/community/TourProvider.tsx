"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Button, IconButton, Switch, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService } from "@/lib/services/community.service";

export interface TourStep {
  /** Stable id; matches `data-tour-id="..."` on the target element. Omit for a centered card. */
  targetId?: string;
  /** Short title shown above the narration. */
  title: string;
  /** Long-form narration. Read aloud via Web Speech API; also revealed word-by-word. */
  narration: string;
  /** Preferred tooltip position. Auto-flips if the target is near a screen edge. */
  placement?: "top" | "bottom" | "left" | "right";
  /** Optional icon shown next to the title. */
  icon?: string;
  /** Optional color accent for icon + ring. */
  color?: string;
}

interface TourContextValue {
  startTour: (steps: TourStep[]) => void;
  stopTour: () => void;
  isRunning: boolean;
}

const TourContext = createContext<TourContextValue>({
  startTour: () => {},
  stopTour: () => {},
  isRunning: false,
});

export function useTour() {
  return useContext(TourContext);
}

const PADDING = 10; // px around target for the "hole"
const RADIUS = 12;  // (visual) corner radius of highlight ring

/** Best-effort detection. iOS Safari hides voices behind a user gesture. */
function hasSpeechSynthesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [revealedChars, setRevealedChars] = useState(0);
  const [narrating, setNarrating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Per-text blob URL cache so revisiting a step (Back button) doesn't re-fetch.
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  // Reveal-progress animation handle, so we can cancel mid-step.
  const revealRafRef = useRef<number | null>(null);
  const isRunning = steps.length > 0;

  // Stop any in-flight narration (both audio + speechSynthesis) on unmount or
  // step change. Both code paths are independent - cancel both defensively.
  const cancelSpeech = useCallback(() => {
    if (revealRafRef.current) {
      cancelAnimationFrame(revealRafRef.current);
      revealRafRef.current = null;
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch {
        /* no-op */
      }
      audioRef.current = null;
    }
    if (hasSpeechSynthesis()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* no-op */
      }
    }
    utteranceRef.current = null;
  }, []);

  const startTour = useCallback((newSteps: TourStep[]) => {
    if (!newSteps.length) return;
    setSteps(newSteps);
    setIdx(0);
    setRevealedChars(0);
  }, []);

  const stopTour = useCallback(() => {
    cancelSpeech();
    setSteps([]);
    setIdx(0);
    setRevealedChars(0);
    setNarrating(false);
    setRect(null);
  }, [cancelSpeech]);

  const goNext = useCallback(() => {
    cancelSpeech();
    setIdx((i) => {
      if (i + 1 >= steps.length) {
        stopTour();
        return i;
      }
      return i + 1;
    });
    setRevealedChars(0);
  }, [cancelSpeech, steps.length, stopTour]);

  const goPrev = useCallback(() => {
    cancelSpeech();
    setIdx((i) => Math.max(0, i - 1));
    setRevealedChars(0);
  }, [cancelSpeech]);

  // Resolve the current target rect - re-measures on resize, scroll, and step change.
  useEffect(() => {
    if (!isRunning) return;
    const step = steps[idx];
    if (!step?.targetId) {
      setRect(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      // Auto-scroll target into view if it's outside the viewport.
      const r = el.getBoundingClientRect();
      const offscreen = r.top < 0 || r.bottom > window.innerHeight - 80;
      if (offscreen) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Re-measure on next frame to catch the post-scroll position.
      raf = requestAnimationFrame(() => {
        const r2 = el.getBoundingClientRect();
        setRect(r2);
      });
    };
    measure();
    const onChange = () => measure();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [isRunning, idx, steps]);

  // Speak the current step's narration. We try OpenAI TTS first (premium voice,
  // sounds like the ChatGPT mobile app), then fall back to the browser's
  // built-in speechSynthesis. With OpenAI audio we don't have word-level
  // timing, so we tween the reveal linearly across audio duration; with
  // speechSynthesis the onboundary event gives us actual word boundaries.
  useEffect(() => {
    if (!isRunning) return;
    const step = steps[idx];
    if (!step) return;

    setRevealedChars(0);
    cancelSpeech();

    if (!voiceEnabled) {
      // Voice off - reveal everything immediately.
      setRevealedChars(step.narration.length);
      setNarrating(false);
      return;
    }

    let cancelled = false;

    /** Linearly reveal `text` between [from..to] characters over `durationMs`. */
    const animateReveal = (text: string, durationMs: number) => {
      const startedAt = performance.now();
      const tick = () => {
        if (cancelled) return;
        const elapsed = performance.now() - startedAt;
        const pct = Math.min(1, elapsed / durationMs);
        setRevealedChars(Math.round(text.length * pct));
        if (pct < 1) {
          revealRafRef.current = requestAnimationFrame(tick);
        }
      };
      revealRafRef.current = requestAnimationFrame(tick);
    };

    /** Built-in speechSynthesis fallback - word-level reveal via onboundary. */
    const startBrowserSpeech = () => {
      if (cancelled || !hasSpeechSynthesis()) {
        setRevealedChars(step.narration.length);
        setNarrating(false);
        return;
      }
      const utter = new SpeechSynthesisUtterance(step.narration);
      utter.rate = 0.98;
      utter.pitch = 1.02;
      utter.volume = 0.95;
      utter.onstart = () => setNarrating(true);
      utter.onboundary = (e) => {
        if (typeof e.charIndex === "number") {
          setRevealedChars(e.charIndex + (e.charLength ?? 0));
        }
      };
      utter.onend = () => {
        setNarrating(false);
        setRevealedChars(step.narration.length);
      };
      utter.onerror = () => {
        setNarrating(false);
        setRevealedChars(step.narration.length);
      };
      utteranceRef.current = utter;
      try {
        window.speechSynthesis.speak(utter);
      } catch {
        setRevealedChars(step.narration.length);
        setNarrating(false);
      }
    };

    /** Premium voice via OpenAI TTS, with text reveal tweened by duration. */
    const startPremiumVoice = async () => {
      try {
        const cached = audioCacheRef.current.get(step.narration);
        const url = cached ?? (await communityService.fetchTourNarration(step.narration, "nova"));
        if (!cached) audioCacheRef.current.set(step.narration, url);
        if (cancelled) return;

        const audio = new Audio(url);
        audio.preload = "auto";
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          if (cancelled) return;
          // Estimate reveal duration from real audio length; fall back to a
          // reading-speed heuristic if metadata isn't available.
          const ms = Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration * 1000
            : Math.max(2400, step.narration.length * 55);
          animateReveal(step.narration, ms);
        };
        audio.onplay = () => setNarrating(true);
        audio.onended = () => {
          if (cancelled) return;
          setNarrating(false);
          setRevealedChars(step.narration.length);
        };
        audio.onerror = () => {
          if (cancelled) return;
          // Decode error or network drop mid-stream - recover via browser TTS.
          startBrowserSpeech();
        };

        try {
          await audio.play();
        } catch {
          // play() rejects on autoplay block. The user clicked a button to get
          // here, but our await chain may have outrun the transient activation
          // window. Falling back to speechSynthesis runs in the same context
          // and reliably narrates without needing autoplay permission.
          if (!cancelled) startBrowserSpeech();
        }
      } catch {
        // Server returned 503 (no API key) / network error / auth failure -
        // gracefully degrade to the browser voice.
        if (!cancelled) startBrowserSpeech();
      }
    };

    startPremiumVoice();

    return () => {
      cancelled = true;
      cancelSpeech();
    };
  }, [isRunning, idx, steps, voiceEnabled, cancelSpeech]);

  // Keyboard: Esc cancels, →/Space advances, ← steps back.
  useEffect(() => {
    if (!isRunning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stopTour();
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, stopTour, goNext, goPrev]);

  const value = useMemo(() => ({ startTour, stopTour, isRunning }), [startTour, stopTour, isRunning]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {isRunning && typeof document !== "undefined"
        ? createPortal(
            <TourOverlay
              step={steps[idx]}
              rect={rect}
              stepIdx={idx}
              totalSteps={steps.length}
              revealedChars={revealedChars}
              narrating={narrating}
              voiceEnabled={voiceEnabled}
              onToggleVoice={() => setVoiceEnabled((v) => !v)}
              onNext={goNext}
              onPrev={goPrev}
              onStop={stopTour}
            />,
            document.body
          )
        : null}
    </TourContext.Provider>
  );
}

// ─── Overlay ────────────────────────────────────────────────────────────────

interface TourOverlayProps {
  step: TourStep;
  rect: DOMRect | null;
  stepIdx: number;
  totalSteps: number;
  revealedChars: number;
  narrating: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
}

function TourOverlay({
  step,
  rect,
  stepIdx,
  totalSteps,
  revealedChars,
  narrating,
  voiceEnabled,
  onToggleVoice,
  onNext,
  onPrev,
  onStop,
}: TourOverlayProps) {
  const accent = step.color ?? "#a78bfa";
  const isLast = stepIdx === totalSteps - 1;

  // Measure the tooltip card's REAL height so positioning never assumes a fixed size (long
  // narration + controls make it much taller than the old hardcoded 200px, which pushed the
  // card off-screen for low/edge targets - the "can't see step 7/8" bug).
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [cardH, setCardH] = useState(260);
  useEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    const measure = () => setCardH(el.offsetHeight || 260);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stepIdx]);

  // Compute tooltip position relative to highlight (or centered if no target). Places the card
  // beside the target where it fits, and ALWAYS clamps it fully inside the viewport using the
  // measured height - so no step's card can ever render off-screen, on any page.
  const tooltipPos = useMemo(() => {
    if (!rect) return null;
    const padded = {
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    };
    const placement = step.placement ?? "bottom";
    const TIP_W = 360;
    const TIP_GAP = 14;
    const MARGIN = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const below = padded.top + padded.height + TIP_GAP; // card top if placed below the target
    const above = padded.top - TIP_GAP - cardH; //          card top if placed above the target
    const fitsBelow = below + cardH + MARGIN <= vh;
    const fitsAbove = above >= MARGIN;

    let top: number;
    let arrowOn: "top" | "bottom";
    if (placement === "top") {
      if (fitsAbove) { top = above; arrowOn = "bottom"; }
      else { top = below; arrowOn = "top"; }
    } else {
      // bottom (default) — and left/right fall back to below/above too
      if (fitsBelow) { top = below; arrowOn = "top"; }
      else if (fitsAbove) { top = above; arrowOn = "bottom"; }
      else { top = MARGIN; arrowOn = "top"; } // neither side fits (huge target) — clamp handles it
    }

    // Final clamp: keep the whole card in view regardless of placement, target position, or content.
    top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - cardH - MARGIN));
    const left = Math.min(vw - TIP_W - MARGIN, Math.max(MARGIN, padded.left + padded.width / 2 - TIP_W / 2));
    return { top, left, arrowOn };
  }, [rect, step.placement, cardH]);

  // The cutout polygon - outer rect minus inner rect = mask.
  const clipPath = useMemo(() => {
    if (!rect) return undefined;
    const x = rect.left - PADDING;
    const y = rect.top - PADDING;
    const w = rect.width + PADDING * 2;
    const h = rect.height + PADDING * 2;
    // Construct an even-odd hole: outer rectangle then inner rectangle, both clockwise.
    return `polygon(
      0 0, 100% 0, 100% 100%, 0 100%, 0 0,
      ${x}px ${y}px,
      ${x}px ${y + h}px,
      ${x + w}px ${y + h}px,
      ${x + w}px ${y}px,
      ${x}px ${y}px
    )`;
  }, [rect]);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      sx={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none" }}
    >
      {/* Dim/blur backdrop with optional rectangular hole around target */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(15,23,42,0.62)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          pointerEvents: "auto",
          clipPath,
          WebkitClipPath: clipPath,
        }}
        onClick={onStop}
      />

      {/* Highlight ring around target */}
      {rect && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
          sx={{
            position: "absolute",
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            borderRadius: `${RADIUS}px`,
            boxShadow: `0 0 0 3px ${accent}, 0 0 0 6px ${accent}44, 0 0 24px ${accent}66`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <Box
          key={stepIdx}
          ref={tipRef}
          component={motion.div}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          sx={{
            position: "absolute",
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            // Never exceed the viewport: if the card is somehow taller than the screen it scrolls
            // internally instead of clipping off the bottom.
            maxHeight: "calc(100vh - 32px)",
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            borderRadius: "14px",
            border: `1px solid ${accent}66`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${accent}33`,
            pointerEvents: "auto",
            overflowY: "auto",
            overflowX: "hidden",
            ...(tooltipPos
              ? { top: tooltipPos.top, left: tooltipPos.left }
              : {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }),
          }}
        >
          {/* Top accent bar */}
          <Box sx={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} />

          <Box sx={{ p: 2.25 }}>
            {/* Step header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${accent}22`,
                  color: accent,
                }}
              >
                <IconWrapper icon={step.icon ?? "mdi:lightbulb-outline"} size={16} color={accent} />
              </Box>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9", flex: 1 }}>
                {step.title}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8" }}>
                {stepIdx + 1}/{totalSteps}
              </Typography>
              <IconButton size="small" onClick={onStop} sx={{ color: "#94a3b8" }}>
                <IconWrapper icon="mdi:close" size={16} />
              </IconButton>
            </Box>

            {/* Narration - word-by-word reveal synced to speech */}
            <Typography
              sx={{
                fontSize: "0.88rem",
                lineHeight: 1.6,
                color: "#cbd5e1",
                minHeight: 64,
                mb: 1.5,
              }}
            >
              <Box component="span" sx={{ color: "#f1f5f9" }}>
                {step.narration.slice(0, revealedChars)}
              </Box>
              <Box component="span" sx={{ color: "#475569" }}>
                {step.narration.slice(revealedChars)}
              </Box>
            </Typography>

            {/* Footer */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon={narrating ? "mdi:volume-high" : "mdi:volume-off"} size={14} color="#94a3b8" />
                <Switch
                  size="small"
                  checked={voiceEnabled}
                  onChange={onToggleVoice}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: accent },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: accent },
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }} />

              {stepIdx > 0 && (
                <Button
                  size="small"
                  onClick={onPrev}
                  sx={{ textTransform: "none", color: "#94a3b8", fontWeight: 600 }}
                >
                  Back
                </Button>
              )}
              <Button
                size="small"
                onClick={onStop}
                sx={{ textTransform: "none", color: "#94a3b8", fontWeight: 600 }}
              >
                Skip
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={onNext}
                endIcon={
                  <IconWrapper icon={isLast ? "mdi:check" : "mdi:arrow-right"} size={14} />
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "8px",
                  backgroundColor: accent,
                  boxShadow: "none",
                  "&:hover": { backgroundColor: accent, filter: "brightness(0.9)", boxShadow: "none" },
                }}
              >
                {isLast ? "Done" : "Next"}
              </Button>
            </Box>
          </Box>
        </Box>
      </AnimatePresence>
    </Box>
  );
}
