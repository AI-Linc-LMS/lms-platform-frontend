"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useTour, TourStep } from "./TourProvider";

/**
 * The set of tour steps presented when the user clicks "Start tour".
 * Each `targetId` must match a `data-tour-id="..."` attribute somewhere on the page.
 * Steps without a `targetId` render as centered "intro" / "outro" cards.
 */
const COMMUNITY_TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to the Community",
    narration:
      "This is your community hub - ask questions, share resources, vote on polls, and join live rooms with other learners. Let me show you around.",
    icon: "mdi:hand-wave-outline",
    color: "#a78bfa",
  },
  {
    targetId: "tour-create-post",
    title: "Create a Post",
    narration:
      "Start anything here - a question, a poll, a resource, a discussion, or just something fun. Every post you create earns you ten IP points.",
    placement: "bottom",
    icon: "mdi:plus-circle-outline",
    color: "#6366f1",
  },
  {
    targetId: "tour-live-rooms",
    title: "Live Rooms",
    narration:
      "When admins or instructors go live, you'll see them here as glowing circles, with a pink badge showing how many sessions are live. Tap a circle to join, or click the Live Rooms heading to browse every scheduled and past room.",
    placement: "bottom",
    icon: "mdi:broadcast",
    color: "#ec4899",
  },
  {
    targetId: "tour-bounties",
    title: "High-value Bounties",
    narration:
      "Top unanswered questions show up here with IP rewards. Click the High-Value Bounties heading to open the full bounty browser - see active, resolved, and unanswered, plus how much IP has been awarded.",
    placement: "bottom",
    icon: "mdi:fire",
    color: "#f59e0b",
  },
  {
    targetId: "tour-filters",
    title: "Filters and Search",
    narration:
      "Filter by post type, your own posts, what you've saved, or what people you follow are posting. Use Recent or Popular sort to find the best content fast.",
    placement: "bottom",
    icon: "mdi:filter-variant",
    color: "#10b981",
  },
  {
    targetId: "tour-milestones",
    title: "Your Milestones",
    narration:
      "Every activity in the community earns IP. Climb from Bronze through Silver and Gold all the way to Platinum, and unlock badges along the way.",
    placement: "left",
    icon: "mdi:trophy-outline",
    color: "#fbbf24",
  },
  {
    targetId: "tour-leaderboard",
    title: "Leaderboard",
    narration:
      "Tap the Leaderboard card on the right to see who's earned the most IP this week, this month, or all-time. It sits right above your milestones so you always know how close you are to the top contributors.",
    placement: "left",
    icon: "mdi:trophy-outline",
    color: "#fbbf24",
  },
  {
    title: "You're all set",
    narration:
      "That's the quick tour. Vote, comment, mark helpful answers, and rack up IP. You can replay this tour any time from the info button.",
    icon: "mdi:rocket-launch-outline",
    color: "#a78bfa",
  },
];

const FEATURES = [
  {
    icon: "mdi:plus-circle-outline",
    color: "#6366f1",
    title: "Five post types",
    text: "Question, Poll, Resource, Discussion, Humor - each with its own template.",
  },
  {
    icon: "mdi:broadcast",
    color: "#ec4899",
    title: "Live voice/video rooms",
    text: "Drop into rooms hosted by admins. Camera, mic, screen share, chat.",
  },
  {
    icon: "mdi:fire",
    color: "#f59e0b",
    title: "Bounties on questions",
    text: "Set IP rewards on your questions, claim them by accepting a helpful answer.",
  },
  {
    icon: "mdi:thumb-up-outline",
    color: "#22c55e",
    title: "Up to 3 helpful marks",
    text: "Thread author and moderators can mark up to three answers as helpful.",
  },
  {
    icon: "mdi:bookmark-outline",
    color: "#0ea5e9",
    title: "Bookmarks & Following",
    text: "Save posts for later, follow users and tags to build a personalized feed.",
  },
  {
    icon: "mdi:at",
    color: "#a78bfa",
    title: "Mentions and hashtags",
    text: "@username notifies them, #hashtag auto-creates a clickable filter.",
  },
  {
    icon: "mdi:flag-outline",
    color: "#ef4444",
    title: "Report & moderate",
    text: "Flag posts or comments - moderators see them in the admin panel.",
  },
  {
    icon: "mdi:trophy-outline",
    color: "#fbbf24",
    title: "IP, tiers, badges, leaderboard",
    text: "Earn IP for every action, climb through Silver/Gold/Platinum tiers.",
  },
];

export function CommunityHelpButton() {
  const [open, setOpen] = useState(false);
  const { startTour } = useTour();

  // 0.1s of completely silent WAV, base64. Playing this from inside the click
  // handler "primes" the browser's autoplay gate for the rest of the tour -
  // subsequent <audio>.play() calls (TTS narration) then succeed without the
  // user having to click each step.
  const SILENT_WAV =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  const handleStartTour = () => {
    // Synchronously unlock the audio context. Must fire DURING the click event
    // - that's why we don't await anything before this call.
    try {
      const primer = new Audio(SILENT_WAV);
      primer.volume = 0;
      // play() returns a Promise; swallowing it is fine - failure just means
      // the browser already trusts us (or it doesn't, and we'll fall back to
      // speechSynthesis inside TourProvider).
      void primer.play().catch(() => {});
    } catch {
      // no-op
    }

    setOpen(false);
    // Brief delay so the modal exit animation runs before the spotlight measures.
    window.setTimeout(() => startTour(COMMUNITY_TOUR_STEPS), 220);
  };

  return (
    <>
      <Tooltip title="What's in the community?">
        <IconButton
          onClick={() => setOpen(true)}
          size="small"
          aria-label="Community help"
          sx={{
            width: 36,
            height: 36,
            color: "var(--font-secondary)",
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            transition: "all 0.15s",
            "&:hover": {
              color: "#a78bfa",
              borderColor: "#a78bfa",
              backgroundColor: "rgba(167,139,250,0.06)",
            },
          }}
        >
          <IconWrapper icon="mdi:information-outline" size={20} />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            border: "1px solid var(--border-default)",
            overflow: "hidden",
          },
        }}
      >
        {/* Accent header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #a78bfa, #ec4899)",
            color: "#fff",
            px: 3,
            py: 2.25,
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
            <IconWrapper icon="mdi:compass-outline" size={26} color="#fff" />
            <Typography variant="h6" fontWeight={700}>
              What you can do in the Community
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.92 }}>
            Eight tools in one place. Take a 60-second guided tour or browse the list.
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "#fff",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
            }}
          >
            <IconWrapper icon="mdi:close" size={18} color="#fff" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2.5 }}>
            {FEATURES.map((f) => (
              <Box
                key={f.title}
                sx={{
                  display: "flex",
                  gap: 1.25,
                  alignItems: "flex-start",
                  p: 1.25,
                  borderRadius: "10px",
                  border: "1px solid var(--border-default)",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    flexShrink: 0,
                    backgroundColor: `${f.color}15`,
                    border: `1px solid ${f.color}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon={f.icon} size={17} color={f.color} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {f.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {f.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              p: 1.5,
              borderRadius: "10px",
              backgroundColor: "rgba(167,139,250,0.08)",
              border: "1px solid rgba(167,139,250,0.3)",
              mb: 2,
            }}
          >
            <IconWrapper icon="mdi:lightbulb-on-outline" size={18} color="#a78bfa" />
            <Typography variant="caption" sx={{ color: "var(--font-primary)", flex: 1 }}>
              The guided tour reads aloud and highlights each feature on the page. Press the
              speaker toggle to read silently.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button onClick={() => setOpen(false)} sx={{ textTransform: "none", color: "var(--font-secondary)" }}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={handleStartTour}
              startIcon={<IconWrapper icon="mdi:play" size={14} />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #a78bfa, #ec4899)",
                boxShadow: "none",
                "&:hover": { filter: "brightness(0.92)", boxShadow: "none" },
              }}
            >
              Start the tour
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
