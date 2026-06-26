"use client";

import { useRouter } from "next/navigation";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { Reveal } from "@/components/scorecard/shared";
import type { AiBriefing, LearnerDashboard } from "@/lib/types/dashboard";

const ACTION_ICON: Record<string, string> = {
  topic: "mdi:book-open-page-variant",
  checkpoint: "mdi:shield-check",
  week_final: "mdi:flag-checkered",
  interview: "mdi:account-voice",
  resume: "mdi:play",
  explore: "mdi:compass-outline",
};

function ActionCard({
  eyebrow, title, sub, icon, onClick,
}: { eyebrow: string; title: string; sub?: string; icon: string; onClick?: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: 1, textAlign: "left", justifyContent: "flex-start", p: 1.75, borderRadius: 3, gap: 1.5,
        bgcolor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.15)",
        transition: "border-color .15s, background .15s",
        "&:hover": { borderColor: "rgba(255,255,255,0.35)", bgcolor: "rgba(0,0,0,0.26)" },
      }}
    >
      <Box sx={{ width: 38, height: 38, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
        <Icon icon={icon} width={20} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.6, color: "rgba(255,255,255,0.6)" }}>{eyebrow}</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", lineHeight: 1.2 }}>{title}</Typography>
        {sub && <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.7)", mt: 0.25 }}>{sub}</Typography>}
      </Box>
    </ButtonBase>
  );
}

export function AiBriefingHero({
  briefing, profile,
}: { briefing: AiBriefing; profile: LearnerDashboard["profile"] }) {
  const router = useRouter();
  const go = (route?: string) => route && router.push(route);
  const action0 = briefing.actions[0];

  return (
    <Reveal>
      <Box sx={{ borderRadius: 5, p: { xs: 2.5, md: 3.5 }, mb: 2.5, color: "white", position: "relative", overflow: "hidden", background: "radial-gradient(110% 130% at 12% 112%, rgba(192,38,211,0.45) 0%, rgba(124,58,237,0.30) 30%, rgba(15,10,40,0) 60%), linear-gradient(150deg, #271a5c 0%, #181040 55%, #100a2c 100%)", boxShadow: "0 24px 60px -30px rgba(76,29,149,0.7)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ px: 1, py: 0.4, borderRadius: 999, fontSize: "0.66rem", fontWeight: 800, letterSpacing: 0.5, color: "white", bgcolor: "rgba(255,255,255,0.18)", display: "inline-flex", alignItems: "center", gap: 0.4 }}>
              <Icon icon="mdi:star-four-points" width={12} /> YOUR AI BRIEFING
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            {profile.weekNo != null && (
              <Box sx={{ px: 1, py: 0.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.14)", fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <Icon icon="mdi:calendar" width={14} /> Week {profile.weekNo}
              </Box>
            )}
            <Box sx={{ px: 1, py: 0.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.14)", fontSize: "0.78rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 0.4 }}>
              <Icon icon="mdi:fire" width={15} color="#fb923c" /> {profile.streakDays}
            </Box>
          </Stack>
        </Stack>

        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1.2, color: "rgba(255,255,255,0.7)", mb: 1 }}>
          WELCOME BACK, {profile.name.toUpperCase()}
        </Typography>

        {briefing.lastWeek && (
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderRadius: 999, bgcolor: "rgba(255,255,255,0.14)", mb: 1.5 }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>🎉 {briefing.lastWeek}</Typography>
          </Box>
        )}

        <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2.1rem" }, lineHeight: 1.15, maxWidth: 820 }}>
          {briefing.headline}
        </Typography>

        {briefing.weakestSkill && (
          <Typography sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.9)", mt: 1.25, maxWidth: 760, lineHeight: 1.55 }}>
            Your weakest skill right now is{" "}
            <Box component="span" sx={{ fontWeight: 800, color: "#fff" }}>{briefing.weakestSkill.skill}</Box>{" "}
            in <Box component="span" sx={{ fontWeight: 800, color: "#fff" }}>{briefing.weakestSkill.course}</Box>.{" "}
            {briefing.weakestSkill.fixSuggestion}{" "}
            <Box component="span" onClick={() => go(briefing.weakestSkill?.route)} sx={{ fontWeight: 800, color: "#fde68a", cursor: "pointer", whiteSpace: "nowrap" }}>
              Fix it →
            </Box>
          </Typography>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 2.5 }}>
          <ActionCard
            eyebrow="DO THIS WEEK"
            title={briefing.thisWeek.focus}
            sub={briefing.thisWeek.course}
            icon="mdi:pin"
            onClick={() => go(briefing.focusRoute)}
          />
          <ActionCard
            eyebrow="DO TODAY"
            title={briefing.today}
            sub={action0?.course}
            icon={ACTION_ICON[action0?.kind || "topic"] || "mdi:lightning-bolt"}
            onClick={() => go(action0?.route || briefing.focusRoute)}
          />
        </Stack>

        <ButtonBase
          onClick={() => go(briefing.focusRoute)}
          sx={{ mt: 2.5, px: 3, py: 1.25, borderRadius: 999, fontWeight: 800, fontSize: "0.95rem", color: "white", background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", gap: 0.75, boxShadow: "0 14px 34px -12px rgba(192,38,211,0.7)", "&:hover": { filter: "brightness(1.06)" } }}
        >
          <Icon icon="mdi:timer-outline" width={18} /> Start this week&apos;s focus →
        </ButtonBase>
      </Box>
    </Reveal>
  );
}
