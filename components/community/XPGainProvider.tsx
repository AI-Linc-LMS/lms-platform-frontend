"use client";

import { createContext, useCallback, useContext, useState } from "react";
import dynamic from "next/dynamic";
import { Box } from "@mui/material";
import { invalidateLearnerDashboard } from "@/lib/services/adaptive-journey.service";
import { noteKnownEarn } from "@/lib/xp/pointsWatcher";
import type { XPGainEntry } from "./XPGainPopups";

// framer-motion loads with the FIRST XP gain, not with every page shell.
const XPGainPopups = dynamic(() => import("./XPGainPopups"), { ssr: false });

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
  const [gains, setGains] = useState<XPGainEntry[]>([]);

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
        {gains.length > 0 && <XPGainPopups gains={gains} />}
      </Box>
    </XPGainContext.Provider>
  );
}
