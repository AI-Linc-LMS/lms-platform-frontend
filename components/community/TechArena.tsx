"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Typography, Paper, Button, Avatar, InputBase, IconButton } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useImpactEconomy } from "@/lib/contexts/ImpactEconomyContext";
import { useToast } from "@/components/common/Toast";
import { communityService } from "@/lib/services/community.service";
import { config } from "@/lib/config";
import type { ArenaActiveDto } from "@/lib/community/widget-types";
import { dummyArenaActive } from "@/lib/community/community-dummy-data";

export function TechArena() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [selectedSide, setSelectedSide] = useState<"a" | "b" | null>(null);
  const [defenseText, setDefenseText] = useState("");
  const [active, setActive] = useState<ArenaActiveDto | null>(null);
  const [loading, setLoading] = useState(true);
  const { addPoints, refreshBalance } = useImpactEconomy();
  const { showToast } = useToast();

  const load = useCallback(async () => {
    if (!config.communityWidgetApi) {
      setActive(config.communityDummyData ? dummyArenaActive() : null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await communityService.getArenaActive();
    let data: ArenaActiveDto | null = res.ok ? (res.data ?? null) : null;
    if (config.communityDummyData && (!data || !data.topic)) {
      data = dummyArenaActive();
    }
    setActive(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const topic = active?.topic;
  const topA = active?.top_side_a;
  const topB = active?.top_side_b;
  const useBackend = config.communityWidgetApi && topic;

  const leftPct =
    useBackend && typeof topic?.side_a_percent === "number"
      ? Math.min(100, Math.max(0, topic.side_a_percent))
      : 64;
  const rightPct = 100 - leftPct;

  const openFullDebate = () => {
    if (!topic) return;
    // In-app navigation — opening this route in a new tab loses the auth
    // cookie scope on some tenant subdomains and re-prompts for sign-in.
    router.push(`/community/arena?topicId=${topic.id}`);
  };

  const handleVote = (side: "a" | "b") => {
    setSelectedSide(side);
    if (!useBackend) {
      void addPoints(5, t("community.arenaVoteCastReason"), "interaction");
    }
  };

  const handleDefenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defenseText.trim()) return;
    if (useBackend && topic && selectedSide) {
      const arg = await communityService.postArenaArgument(topic.id, {
        side: selectedSide,
        body: defenseText.trim(),
      });
      if (arg.ok) {
        showToast(t("community.arenaArgumentPosted"), "success");
        setDefenseText("");
        await refreshBalance();
        await load();
        return;
      }
      showToast(t("community.arenaArgumentFailed"), "error");
      return;
    }
    void addPoints(10, t("community.arenaDefensePostedReason"), "reply");
    setDefenseText("");
    showToast(t("community.arenaDefenseDemoAdded"), "success");
  };

  const sideALabel = useBackend ? topic!.side_a_label : "Next.js SSR";
  const sideBLabel = useBackend ? topic!.side_b_label : "React SPA";
  const debateTitle = useBackend ? topic!.title : "Next.js SSR vs React SPA";

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        mb: 3,
        background: "var(--card-bg)",
      }}
    >
      <Box
        sx={{
          backgroundColor: "var(--secondary-500)",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconWrapper icon="mdi:sword-cross" color="var(--accent-yellow)" size={16} />
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{
            textTransform: "uppercase",
            letterSpacing: 1,
            flex: 1,
            color: "var(--font-light)",
          }}
        >
          The Arena
        </Typography>
        {topic?.ends_at && (
          <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "color-mix(in srgb, var(--font-light) 72%, transparent)" }}>
            Ends {new Date(topic.ends_at).toLocaleDateString()}
          </Typography>
        )}
        {!useBackend && (
          <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "color-mix(in srgb, var(--font-light) 72%, transparent)" }}>
            Demo
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Loading arena…
          </Typography>
        </Box>
      ) : !selectedSide ? (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            {topic && (
              <Button size="small" onClick={openFullDebate} sx={{ textTransform: "none", fontWeight: 600, minWidth: 0, px: 0 }}>
                Open full debate
              </Button>
            )}
          </Box>
          <Typography variant="caption" fontWeight={600} sx={{ display: "block", textAlign: "center", mb: 2, color: "var(--font-secondary)" }}>
            {debateTitle}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box
              onClick={() => handleVote("a")}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border-default)",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "var(--primary-50)",
                  borderColor: "var(--primary-200)",
                  transform: "translateX(2px)",
                },
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ color: "var(--font-primary-dark)" }}>
                {sideALabel}
              </Typography>
              {topA && (
                <Typography variant="caption" sx={{ color: "var(--font-muted)", display: "block", mt: 0.5 }}>
                  Top: {topA.body.slice(0, 80)}
                  {topA.body.length > 80 ? "…" : ""} ({topA.upvotes} votes)
                </Typography>
              )}
            </Box>
            <Box
              onClick={() => handleVote("b")}
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "color-mix(in srgb, var(--primary-50) 90%, var(--card-bg))",
                border: "1px solid var(--primary-200)",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "var(--primary-50)",
                  borderColor: "var(--primary-300)",
                  transform: "translateX(2px)",
                },
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ color: "var(--primary-700)" }}>
                {sideBLabel}
              </Typography>
              {topB && (
                <Typography variant="caption" sx={{ color: "var(--font-muted)", display: "block", mt: 0.5 }}>
                  Top: {topB.body.slice(0, 80)}
                  {topB.body.length > 80 ? "…" : ""} ({topB.upvotes} votes)
                </Typography>
              )}
            </Box>
          </Box>
          <Typography
            variant="caption"
            sx={{ display: "block", textAlign: "center", mt: 2, color: "var(--font-tertiary)", fontStyle: "italic" }}
          >
            Pick a side to see results
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            {topic && (
              <Button size="small" onClick={openFullDebate} sx={{ textTransform: "none", fontWeight: 600 }}>
                Open full debate
              </Button>
            )}
          </Box>
          <Box sx={{ display: "flex", height: 14, borderRadius: 4, overflow: "hidden", mb: 1 }}>
            <Box sx={{ width: `${leftPct}%`, backgroundColor: "var(--secondary-500)" }} />
            <Box sx={{ width: `${rightPct}%`, backgroundColor: "var(--primary-500)" }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "var(--secondary-500)" }}>
              {sideALabel} {leftPct}%
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: "var(--primary-600)" }}>
              {rightPct}% {sideBLabel}
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: "var(--surface)",
              p: 1.5,
              borderRadius: 2,
              mb: 1.5,
              borderLeft: "3px solid var(--secondary-500)",
            }}
          >
            <Typography variant="caption" sx={{ fontStyle: "italic", color: "var(--font-muted)" }}>
              {topA ? `“${topA.body.slice(0, 120)}${topA.body.length > 120 ? "…" : ""}”` : "“SSR is mandatory for public-facing apps.”"}
            </Typography>
            {topA && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <Avatar sx={{ width: 16, height: 16, fontSize: "0.55rem", backgroundColor: "var(--success-500)" }}>
                  {topA.author_name.charAt(0)}
                </Avatar>
                <Typography variant="caption" fontWeight={600} sx={{ color: "var(--font-secondary)" }}>
                  {topA.author_name}
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              backgroundColor: "color-mix(in srgb, var(--primary-50) 88%, var(--card-bg))",
              p: 1.5,
              borderRadius: 2,
              mb: 2,
              borderLeft: "3px solid var(--primary-500)",
            }}
          >
            <Typography variant="caption" sx={{ fontStyle: "italic", color: "var(--primary-800)" }}>
              {topB ? `“${topB.body.slice(0, 120)}${topB.body.length > 120 ? "…" : ""}”` : "“B2B dashboards don't need SSR overhead.”"}
            </Typography>
            {topB && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <Avatar sx={{ width: 16, height: 16, fontSize: "0.55rem", backgroundColor: "var(--warning-500)" }}>
                  {topB.author_name.charAt(0)}
                </Avatar>
                <Typography variant="caption" fontWeight={600} sx={{ color: "var(--font-secondary)" }}>
                  {topB.author_name}
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            component="form"
            onSubmit={handleDefenseSubmit}
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "var(--surface)",
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              border: "1px solid var(--border-default)",
            }}
          >
            <InputBase
              placeholder="Drop your defense..."
              value={defenseText}
              onChange={(e) => setDefenseText(e.target.value)}
              sx={{ flex: 1, fontSize: "0.8rem", color: "var(--font-muted)" }}
            />
            {defenseText.trim() && (
              <IconButton
                type="submit"
                size="small"
                sx={{
                  color: selectedSide === "a" ? "var(--secondary-500)" : "var(--primary-600)",
                  p: 0.5,
                }}
              >
                <IconWrapper icon="mdi:send" size={14} />
              </IconButton>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
