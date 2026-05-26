"use client";

import { createContext, useContext, type ReactNode } from "react";

const StaticRenderContext = createContext(false);

/**
 * Wrap the scorecard subtree in this provider when you need a deterministic,
 * non-animated render — e.g. the PDF capture page where viewport-triggered
 * animations would otherwise leave content invisible during snapshot.
 */
export function ScorecardStaticRenderProvider({ children }: { children: ReactNode }) {
  return (
    <StaticRenderContext.Provider value={true}>{children}</StaticRenderContext.Provider>
  );
}

/** Returns true when components should skip entrance animations and show final state. */
export function useStaticRender(): boolean {
  return useContext(StaticRenderContext);
}
