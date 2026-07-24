"use client";

import { useRouter } from "next/navigation";

import { Box, Typography, Avatar, Button } from "@mui/material";

import type { BountyItem } from "@/lib/services/community.service";
import { IconWrapper } from "@/components/common/IconWrapper";

interface BountySectionProps {
  bounties: BountyItem[];
}

const RED = "#ef4444";
const RED_BG = "rgba(239,68,68,0.08)";
const RED_BORDER = "rgba(239,68,68,0.28)";

function formatHoursUnanswered(hours: number): string {
  if (hours < 1) return "< 1h unanswered";
  if (hours >= 48) return "48h+ unanswered";
  return `${hours}h unanswered`;
}

function defaultXp(hours: number): number {
  if (hours >= 48) return 500;
  if (hours >= 24) return 200;
  if (hours >= 12) return 100;
  return 50;
}

export function BountySection({ bounties }: BountySectionProps) {
  const router = useRouter();

  if (bounties.length === 0) return null;

  return (
    <Box sx={{ mb: 3.5 }}>
      {/* Section header - clickable, routes to the full bounty browser */}
      <Box
        onClick={() => router.push("/community/bounties")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.75,
          cursor: "pointer",
          userSelect: "none",
          width: "fit-content",
          pr: 1,
          "&:hover": {
            "& .bounty-arrow": { transform: "translateX(3px)", opacity: 1 },
            "& .bounty-title": { color: RED },
          },
        }}
      >
        <IconWrapper icon="mdi:target" size={18} color={RED} />
        <Typography
          className="bounty-title"
          variant="subtitle2"
          fontWeight={700}
          sx={{
            color: "var(--font-primary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontSize: "0.72rem",
            transition: "color 0.15s",
          }}
        >
          High-Value Bounties
        </Typography>
        <Box
          className="bounty-arrow"
          sx={{
            display: "inline-flex",
            opacity: 0.55,
            transition: "all 0.18s",
            color: "var(--font-secondary)",
          }}
        >
          <IconWrapper icon="mdi:chevron-right" size={16} />
        </Box>
      </Box>

      {/* Horizontal scroll row */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "var(--border-default)", borderRadius: 2 },
        }}
      >
        {bounties.map((bounty) => {
          const xp = bounty.has_bounty && bounty.points > 0
            ? bounty.points
            : defaultXp(bounty.hours_unanswered);

          return (
            <Box
              key={bounty.thread_id}
              sx={{
                minWidth: 260,
                maxWidth: 280,
                flexShrink: 0,
                backgroundColor: "var(--card-bg)",
                borderRadius: "12px",
                border: "1px solid var(--border-default)",
                borderTop: `3px solid ${RED}`,
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                transition: "box-shadow 0.18s",
                "&:hover": {
                  boxShadow: `0 4px 16px ${RED_BORDER}`,
                },
              }}
            >
              {/* Author + XP badge */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Avatar
                    src={bounty.author.profile_pic_url}
                    sx={{ width: 24, height: 24, fontSize: "0.7rem", bgcolor: RED_BG, color: RED }}
                  >
                    {bounty.author.name.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" fontWeight={600} sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}>
                    {bounty.author.name}
                  </Typography>
                </Box>

                {/* Always show XP reward */}
                <Box
                  sx={{
                    display: "flex", alignItems: "center", gap: 0.4,
                    backgroundColor: RED_BG,
                    border: `1px solid ${RED_BORDER}`,
                    borderRadius: "20px", px: 0.85, py: 0.2,
                  }}
                >
                  <IconWrapper icon="mdi:fire" size={12} color={RED} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: RED, fontSize: "0.72rem" }}>
                    +{xp} IP
                  </Typography>
                </Box>
              </Box>

              {/* Thread title */}
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  color: "var(--font-primary)",
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontSize: "0.875rem",
                }}
              >
                {bounty.thread_title}
              </Typography>

              {/* Time unanswered */}
              <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontStyle: "italic", fontSize: "0.72rem" }}>
                {formatHoursUnanswered(bounty.hours_unanswered)}
              </Typography>

              {/* Solve button */}
              <Button
                size="small"
                onClick={() => router.push(`/community/${bounty.thread_id}`)}
                fullWidth
                sx={{
                  mt: "auto",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  borderRadius: "8px",
                  border: `1px solid ${RED_BORDER}`,
                  color: RED,
                  backgroundColor: "transparent",
                  py: 0.6,
                  "&:hover": { backgroundColor: RED_BG, boxShadow: "none" },
                }}
              >
                Solve Bounty
              </Button>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
