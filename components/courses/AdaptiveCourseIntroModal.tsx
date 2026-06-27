"use client";

import { useState } from "react";
import { Box, Button, Dialog, IconButton, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Props {
  course: { id: number; title: string; route: string };
  onClose: () => void;   // called on X / Skip / final CTA — persists "seen forever"
}

const STEPS: { icon: string; accent: string; title: string; body: string }[] = [
  {
    icon: "mdi:auto-awesome",
    accent: "#6366f1",
    title: "Meet Adaptive Courses",
    body: "A brand-new way to learn — find it under Courses → Adaptive Course. The course adjusts itself to you instead of one-size-fits-all.",
  },
  {
    icon: "mdi:target-account",
    accent: "#a855f7",
    title: "It calibrates to your level",
    body: "A quick calibration reads where you are, so you start at the right depth — no time wasted on what you already know.",
  },
  {
    icon: "mdi:chart-line-variant",
    accent: "#ec4899",
    title: "Difficulty adapts in real time",
    body: "Get a streak right and it steps up; struggle and it eases off and offers hints, a mentor, and re-explains — live.",
  },
  {
    icon: "mdi:trophy-variant",
    accent: "#10b981",
    title: "Earn points & a certificate",
    body: "Every quiz, video and coding problem earns time-decayed points and feeds your journey toward a shareable certificate.",
  },
];

export function AdaptiveCourseIntroModal({ course, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  const go = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };
  const finish = () => { onClose(); router.push(course.route); };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 5, overflow: "hidden", position: "relative",
        boxShadow: "0 30px 80px -30px rgba(124,58,237,0.6)" } } }}
    >
      <IconButton
        aria-label="Skip"
        onClick={onClose}
        size="small"
        sx={{ position: "absolute", top: 10, right: 10, zIndex: 2, color: "text.secondary" }}
      >
        <Icon icon="mdi:close" width={18} />
      </IconButton>

      {/* Animated illustration */}
      <Box sx={{ pt: 5, pb: 3, display: "grid", placeItems: "center",
        background: `linear-gradient(160deg, color-mix(in srgb, ${s.accent} 14%, var(--card-bg, #fff)) 0%, var(--card-bg, #fff) 100%)`,
        transition: "background 0.4s ease" }}>
        <AnimatePresence mode="wait" custom={dir}>
          <Box
            key={step}
            component={motion.div}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: dir * -40, scale: 0.9 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            sx={{ display: "grid", placeItems: "center" }}
          >
            <Box
              component={motion.div}
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              sx={{ width: 88, height: 88, borderRadius: "28%", display: "grid", placeItems: "center", color: "white",
                background: `linear-gradient(135deg, ${s.accent}, color-mix(in srgb, ${s.accent} 55%, #ec4899))`,
                boxShadow: `0 18px 40px -16px ${s.accent}` }}
            >
              <Icon icon={s.icon} width={44} />
            </Box>
          </Box>
        </AnimatePresence>
      </Box>

      {/* Animated copy */}
      <Box sx={{ px: 3, pb: 1, textAlign: "center", minHeight: 132 }}>
        <AnimatePresence mode="wait">
          <Box key={step} component={motion.div}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", mb: 0.75 }}>{s.title}</Typography>
            <Typography sx={{ fontSize: "0.9rem", color: "text.secondary", lineHeight: 1.5 }}>{s.body}</Typography>
          </Box>
        </AnimatePresence>
      </Box>

      {/* Dots + nav */}
      <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1 }}>
        {STEPS.map((_, i) => (
          <Box key={i} onClick={() => go(i)} sx={{ cursor: "pointer", height: 7, borderRadius: 999,
            width: i === step ? 22 : 7, transition: "all 0.3s ease",
            bgcolor: i === step ? s.accent : "color-mix(in srgb, var(--border-default,#cbd5e1) 90%, transparent)" }} />
        ))}
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5, pt: 2 }}>
        {step > 0 ? (
          <Button onClick={() => go(step - 1)} sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}>
            Back
          </Button>
        ) : (
          <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}>
            Skip
          </Button>
        )}
        <Button
          onClick={() => (isLast ? finish() : go(step + 1))}
          variant="contained"
          endIcon={<Icon icon={isLast ? "mdi:arrow-right-circle" : "mdi:arrow-right"} width={18} />}
          sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2.5,
            background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
        >
          {isLast ? "Open Adaptive Courses" : "Next"}
        </Button>
      </Stack>
    </Dialog>
  );
}
