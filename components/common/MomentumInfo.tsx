"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, IconButton, Popover, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { MomentumInfo as MomentumInfoData } from "@/lib/types/momentum";

/**
 * "i" affordance beside a momentum score. Opens a popover that explains — from live data —
 * exactly how the number was calculated for this learner, with a link to their streak.
 */
export function MomentumInfo({ info, size = 15, color = "#94a3b8" }: { info: MomentumInfoData; size?: number; color?: string }) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchor(e.currentTarget);
  };
  const close = () => setAnchor(null);

  const { current, perDay, cap, value, daysToMax, atMax, formula } = info;

  return (
    <>
      <IconButton
        size="small"
        onClick={open}
        aria-label="How momentum is calculated"
        sx={{ p: 0.2, color, "&:hover": { color: "#f59e0b", bgcolor: "transparent" } }}
      >
        <Icon icon="mdi:information-outline" width={size} />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 3, border: "1px solid #eef2f7", boxShadow: "0 18px 44px -18px rgba(16,24,40,0.32)", maxWidth: 320 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
              <Icon icon="mdi:chart-line-variant" width={15} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>How momentum is calculated</Typography>
          </Stack>

          <Typography sx={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.55 }}>
            Momentum is driven by your <b>daily streak</b> — each active day adds {perDay}, up to {cap}.
          </Typography>

          {/* The formula, then your numbers plugged in. */}
          <Box sx={{ mt: 1.25, p: 1.25, borderRadius: 2, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <Typography sx={{ fontFamily: "monospace", fontSize: "0.74rem", color: "#9a3412" }}>{formula}</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 700, mt: 0.5 }}>
              {atMax
                ? `Your ${current}-day streak maxes it at ${cap}. 🔥`
                : `Your ${current}-day streak × ${perDay} = ${value}.`}
            </Typography>
            {!atMax && daysToMax > 0 && (
              <Typography sx={{ fontSize: "0.74rem", color: "#b45309", fontWeight: 600, mt: 0.25 }}>
                {daysToMax} more active day{daysToMax === 1 ? "" : "s"} → {cap}.
              </Typography>
            )}
          </Box>

          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 1, lineHeight: 1.5 }}>
            Miss a day and your streak resets — so momentum drops too.
          </Typography>

          <ButtonBase
            onClick={() => { close(); router.push("/leaderboard-streaks"); }}
            sx={{ mt: 1.25, fontWeight: 800, fontSize: "0.8rem", color: "#f97316", gap: 0.4 }}
          >
            View your streak <Icon icon="mdi:arrow-right" width={15} />
          </ButtonBase>
        </Box>
      </Popover>
    </>
  );
}
