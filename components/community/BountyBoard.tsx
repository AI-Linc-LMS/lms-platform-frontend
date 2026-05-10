"use client";

import { Box, Typography, Paper, Button, Chip, Avatar } from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { BountyThreadDto } from "@/lib/community/widget-types";

interface BountyBoardProps {
  variant?: "sidebar" | "carousel";
  items: BountyThreadDto[];
}

export function BountyBoard({ variant = "sidebar", items }: BountyBoardProps) {
  const router = useRouter();

  /** IP is granted only after a detailed answer is posted on the thread (see thread detail page). */
  const handleOpenThread = (b: BountyThreadDto) => {
    router.push(`/community/${b.thread_id}?bounty=1`);
  };

  if (variant === "carousel") {
    return (
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <IconWrapper icon="mdi:target" color="var(--accent-red)" size={20} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: "var(--font-primary-dark)" }}>
            High-Value Bounties
          </Typography>
        </Box>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No unanswered threads old enough for a bounty yet.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", gap: 2.5, overflowX: "auto", pb: 2, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            {items.map((b) => (
              <Paper
                key={b.thread_id}
                elevation={0}
                sx={{
                  minWidth: 260,
                  background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                  borderRadius: 3,
                  p: 2.5,
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 24px -4px rgba(99, 102, 241, 0.35)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-3px)" },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: "0.7rem", backgroundColor: "rgba(255,255,255,0.2)" }}>
                      {b.author_name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" color="rgba(255,255,255,0.8)" fontWeight={600}>
                      {b.author_name}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<IconWrapper icon="mdi:fire" size={12} color="var(--accent-yellow)" />}
                    label={`+${b.reward_ip} IP`}
                    size="small"
                    sx={{
                      backgroundColor: "color-mix(in srgb, var(--accent-yellow) 18%, transparent)",
                      color: "var(--accent-yellow)",
                      fontWeight: 700,
                      border: "1px solid color-mix(in srgb, var(--accent-yellow) 35%, transparent)",
                      height: 20,
                      fontSize: "0.65rem",
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    mb: 1,
                    lineHeight: 1.35,
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    color: "var(--font-light)",
                  }}
                >
                  {b.title}
                </Typography>
                <Typography variant="caption" sx={{ mb: 2, fontStyle: "italic", color: "rgba(255,255,255,0.55)" }}>
                  {b.age_label}
                </Typography>
                <Button
                  onClick={() => handleOpenThread(b)}
                  fullWidth
                  size="small"
                  variant="contained"
                  sx={{
                    backgroundColor: "var(--card-bg)",
                    color: "var(--font-primary-dark)",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 1.5,
                    py: 0.8,
                    boxShadow: "none",
                    "&:hover": { backgroundColor: "var(--surface)", boxShadow: "none" },
                  }}
                >
                  Solve Bounty
                </Button>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconWrapper icon="mdi:target" color="var(--accent-red)" size={18} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "var(--font-primary-dark)" }}>
          Bounty Board
        </Typography>
        <Chip
          label="Hot"
          size="small"
          sx={{
            ml: "auto",
            height: 18,
            fontSize: "0.6rem",
            backgroundColor: "color-mix(in srgb, var(--error-500) 10%, var(--card-bg))",
            color: "var(--error-600)",
            fontWeight: 600,
          }}
        />
      </Box>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No bounty threads right now.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((b) => (
            <Paper
              key={b.thread_id}
              elevation={0}
              sx={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                borderRadius: 3,
                p: 2,
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 16px -4px rgba(99, 102, 241, 0.35)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px -4px rgba(99, 102, 241, 0.35)",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: "0.65rem", backgroundColor: "rgba(255,255,255,0.2)" }}>
                    {b.author_name.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" color="rgba(255,255,255,0.75)" fontWeight={600}>
                    {b.author_name}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    backgroundColor: "rgba(253,224,71,0.15)",
                    px: 0.8,
                    py: 0.3,
                    borderRadius: 1,
                    border: "1px solid rgba(253,224,71,0.3)",
                  }}
                >
                  <IconWrapper icon="mdi:fire" size={11} color="var(--accent-yellow)" />
                  <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.65rem", color: "var(--accent-yellow)" }}>
                    +{b.reward_ip} IP
                  </Typography>
                </Box>
              </Box>

              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  display: "-webkit-box",
                  lineHeight: 1.4,
                  mb: 1,
                  position: "relative",
                  zIndex: 1,
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  color: "var(--font-light)",
                }}
              >
                {b.title}
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
                <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ fontSize: "0.65rem", fontStyle: "italic" }}>
                  {b.age_label}
                </Typography>
                <Button
                  onClick={() => handleOpenThread(b)}
                  size="small"
                  variant="contained"
                  sx={{
                    backgroundColor: "var(--card-bg)",
                    color: "var(--font-primary-dark)",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 1.5,
                    py: 0.3,
                    px: 1.5,
                    minWidth: 0,
                    fontSize: "0.7rem",
                    boxShadow: "none",
                    "&:hover": { backgroundColor: "var(--surface-green-light)", boxShadow: "none" },
                  }}
                >
                  Solve
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
