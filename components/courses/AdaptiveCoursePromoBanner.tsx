"use client";

import { Box, Button, IconButton, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Props {
  course: { id: number; title: string; route: string };
  /** When true, the user has prior (legacy) courses, so warn that progress doesn't carry over.
   *  When false (brand-new user with no history), show a plain welcome instead. Defaults to true. */
  hasPriorCourses?: boolean;
  onExplore?: () => void;   // optional: open the intro modal instead of routing
  onDismiss: () => void;
}

/**
 * Dismissible top banner announcing Adaptive Courses. Routes to the promoted course (or opens the
 * intro guide via onExplore). Copy adapts to whether the user is migrating from legacy courses or is
 * brand new. Dismissal persists server-side.
 */
export function AdaptiveCoursePromoBanner({ course, hasPriorCourses = true, onExplore, onDismiss }: Props) {
  const router = useRouter();
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      sx={{
        position: "relative", mb: 2.5, px: { xs: 2, md: 3 }, py: { xs: 1.75, md: 2 }, borderRadius: 4,
        display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
        color: "white", overflow: "hidden",
        background: "linear-gradient(120deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)",
        boxShadow: "0 18px 40px -22px rgba(124,58,237,0.65)",
      }}
    >
      {/* sparkle accent */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none",
        background: "radial-gradient(circle at 90% -20%, #fff 0%, transparent 40%)" }} />
      <Box sx={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0,
        bgcolor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)" }}>
        <Icon icon="mdi:auto-awesome" width={22} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 220 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", lineHeight: 1.2 }}>
          Your learning experience just got an upgrade ✨
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", opacity: 0.95, mt: 0.25 }}>
          {hasPriorCourses ? (
            <>
              We&apos;ve moved to Adaptive Courses that adjust to your skill level as you go. Heads up: your
              adaptive progress starts fresh at 0 - your earlier course history doesn&apos;t carry over.
            </>
          ) : (
            <>
              We&apos;ve added Adaptive Courses that adjust to your skill level as you learn - pick one and the
              engine meets you right where you are.
            </>
          )}
        </Typography>
      </Box>
      <Button
        onClick={() => (onExplore ? onExplore() : router.push(course.route))}
        variant="contained"
        sx={{ flexShrink: 0, textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2.5,
          bgcolor: "white", color: "#6d28d9", "&:hover": { bgcolor: "rgba(255,255,255,0.9)" } }}
      >
        Explore Adaptive Courses
      </Button>
      <IconButton
        aria-label="Dismiss"
        onClick={onDismiss}
        size="small"
        sx={{ color: "white", flexShrink: 0, "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}
      >
        <Icon icon="mdi:close" width={18} />
      </IconButton>
    </Box>
  );
}
