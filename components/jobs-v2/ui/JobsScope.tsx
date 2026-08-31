"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { J } from "./jobsTokens";

export type JobsTheme = "light" | "dark" | "auto";
export type JobsSurface = "student" | "admin";

export interface JobsSurfaceContextValue {
  surface: JobsSurface;
  theme: JobsTheme;
  /**
   * The one place the two shipped dialects legitimately differ: student surfaces get a soft
   * panel shadow, admin and data surfaces get none. `JCard` reads this so no screen has to
   * remember.
   */
  elevated: boolean;
}

const JobsSurfaceContext = createContext<JobsSurfaceContextValue>({
  surface: "student",
  theme: "light",
  elevated: true,
});

export function useJobsSurface(): JobsSurfaceContextValue {
  return useContext(JobsSurfaceContext);
}

/**
 * The module's scope wrapper. **Every jobs route wraps its content in exactly one of these**,
 * immediately inside `PageShell` / `MainLayout`.
 *
 * It renders `<div class="jobs-scope" data-jobs-theme="...">`, which is where every `--j-*`
 * custom property is declared (the appended block in `app/globals.css`). Nothing global is read
 * or written: dark mode is a local attribute flip, not a competing platform mechanism, and the
 * whole identity is deletable in one commit.
 *
 * It adds **no padding** (MainLayout already supplies page padding) and **no background** on
 * light, so the app canvas shows through. On dark it paints `J.canvas`, because a transparent
 * dark scope over a light app canvas is the worst of both.
 */
export function JobsScope({
  children,
  theme = "light",
  surface = "student",
  sx,
  ...rest
}: {
  children: ReactNode;
  theme?: JobsTheme;
  surface?: JobsSurface;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}) {
  const value = useMemo<JobsSurfaceContextValue>(
    () => ({ surface, theme, elevated: surface === "student" }),
    [surface, theme],
  );

  return (
    <JobsSurfaceContext.Provider value={value}>
      <Box
        {...rest}
        className="jobs-scope"
        // "auto" writes no attribute, which is what the (deliberately empty)
        // prefers-color-scheme block in globals.css waits for.
        data-jobs-theme={theme === "auto" ? undefined : theme}
        data-jobs-surface={surface}
        sx={[
          theme === "dark" ? { bgcolor: J.canvas, color: J.ink } : null,
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    </JobsSurfaceContext.Provider>
  );
}
