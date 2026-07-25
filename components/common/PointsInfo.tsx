"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, IconButton, Popover, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * Small "i" affordance shown beside any points figure. Opens a short explainer popover
 * with a link to the full /points-system page.
 */
export function PointsInfo({ size = 15, color = "#94a3b8" }: { size?: number; color?: string }) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchor(e.currentTarget);
  };
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={open}
        aria-label="How points work"
        sx={{ p: 0.2, color, "&:hover": { color: "#7c3aed", bgcolor: "transparent" } }}
      >
        <Icon icon="mdi:information-outline" width={size} />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 3, border: "1px solid #eef2f7", boxShadow: "0 18px 44px -18px rgba(16,24,40,0.32)", maxWidth: 300 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <Icon icon="mdi:star-four-points" width={15} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>How points work</Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.55 }}>
            Every activity awards points - harder + faster earns more, and late submissions are
            penalised. It all rolls up to the leaderboard.
          </Typography>
          <ButtonBase
            onClick={() => { close(); router.push("/points-system"); }}
            sx={{ mt: 1.25, fontWeight: 800, fontSize: "0.8rem", color: "#7c3aed", gap: 0.4 }}
          >
            Know more about the point system <Icon icon="mdi:arrow-right" width={15} />
          </ButtonBase>
        </Box>
      </Popover>
    </>
  );
}
