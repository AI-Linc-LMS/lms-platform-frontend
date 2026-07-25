"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { invalidateLearnerDashboard } from "@/lib/services/adaptive-journey.service";
import { noteKnownEarn } from "@/lib/xp/pointsWatcher";

interface XPGain {
  id: string;
  delta: number;
  icon: string;
  label?: string;
}

interface XPGainContextValue {
  showXPGain: (delta: number, icon: string, label?: string) => void;
}

const XPGainContext = createContext<XPGainContextValue>({
  showXPGain: () => {},
});

export function useXPGain() {
  return useContext(XPGainContext);
}

/**
 * Floating "+N IP" popups in the bottom-right corner.
 * Stacks if the user fires several actions quickly. Each entry fades after 2.4s.
 * Subtle enough to not steal focus, visible enough to feel rewarding.
 */
export function XPGainProvider({ children }: { children: React.ReactNode }) {
  const [gains, setGains] = useState<XPGain[]>([]);

  const showXPGain = useCallback((delta: number, icon: string, label?: string) => {
    if (delta <= 0) return;
    // Community points fold into the unified "total points": bust the dashboard
    // cache (so its Total Points card animates old -> new next visit) and fire the
    // "+N points" lightning celebration right here with the known delta.
    invalidateLearnerDashboard();
    noteKnownEarn(delta);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setGains((prev) => [...prev, { id, delta, icon, label }]);
    // Auto-dismiss faster - feels less like a notification, more like haptic feedback.
    window.setTimeout(() => {
      setGains((prev) => prev.filter((g) => g.id !== id));
    }, 1500);
  }, []);

  return (
    <XPGainContext.Provider value={{ showXPGain }}>
      {children}
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 1,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence>
          {gains.map((g) => (
            <motion.div
              key={g.id}
              // Snappy entrance from the right; bigger upward fade-out so the
              // pill physically floats up and away rather than just vanishing.
              initial={{ opacity: 0, x: 24, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -60,
                scale: 0.85,
                transition: { duration: 0.45, ease: [0.34, 0.07, 0.4, 1] },
              }}
              // Tight tween (90ms) - feels instantaneous, no spring overshoot lag.
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{ pointerEvents: "auto", willChange: "transform, opacity" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.9,
                  borderRadius: "999px",
                  background:
                    "linear-gradient(135deg, rgba(34,197,94,0.96), rgba(16,185,129,0.96))",
                  color: "#fff",
                  boxShadow:
                    "0 10px 30px rgba(34,197,94,0.32), 0 2px 6px rgba(0,0,0,0.10)",
                  backdropFilter: "blur(10px)",
                  minWidth: 110,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconWrapper icon={g.icon} size={16} color="#fff" />
                </Box>
                <Typography
                  sx={{ fontWeight: 800, fontSize: "0.88rem", letterSpacing: "0.02em" }}
                >
                  +{g.delta} IP
                </Typography>
                {g.label && (
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      opacity: 0.85,
                      fontWeight: 600,
                      ml: 0.25,
                    }}
                  >
                    · {g.label}
                  </Typography>
                )}
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </XPGainContext.Provider>
  );
}
