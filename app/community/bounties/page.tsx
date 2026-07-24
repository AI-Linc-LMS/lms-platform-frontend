"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  communityService,
  BountyItem,
  BountyListStatus,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";

const RED = "#ef4444";
const GREEN = "#16a34a";
const PURPLE = "#a78bfa";

type TabValue = "active" | "resolved" | "all";

function formatRelative(d?: string | null) {
  if (!d) return "";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

export default function BountiesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<TabValue>("active");
  const [items, setItems] = useState<BountyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ active: number; resolved: number }>({
    active: 0,
    resolved: 0,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    communityService
      .getBounties(tab as BountyListStatus)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) showToast("Failed to load bounties.", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, showToast]);

  // Fetch tab counts once for the header chips.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      communityService.getBounties("active").catch(() => []),
      communityService.getBounties("resolved").catch(() => []),
    ]).then(([active, resolved]) => {
      if (!cancelled) {
        setCounts({
          active: active.length,
          resolved: resolved.length,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Total bounty IP awarded shown on the Resolved tab header banner. Only
  // resolved-by-bounty rows contribute; non-bountied accepts award nothing.
  const totalAwarded = useMemo(
    () => items.filter((b) => b.bounty_status === "claimed").reduce((sum, b) => sum + b.points, 0),
    [items]
  );

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ py: 2, maxWidth: 1100, mx: "auto", width: "100%", px: { xs: 2, md: 0 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={16} />}
          onClick={() => router.push("/community")}
          sx={{ textTransform: "none", mb: 2, color: "var(--font-secondary)" }}
        >
          Back to community
        </Button>

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <IconWrapper icon="mdi:target" size={26} color={RED} />
              <Typography variant="h5" fontWeight={700}>
                Bounties
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Open IP rewards on community questions. Solve one, get your answer accepted, win the bounty.
            </Typography>
          </Box>

          {/* Quick stats */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              icon={<IconWrapper icon="mdi:fire" size={14} color={RED} />}
              label={`${counts.active} active`}
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                backgroundColor: "rgba(239,68,68,0.10)",
                color: RED,
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            />
            <Chip
              icon={<IconWrapper icon="mdi:check-decagram" size={14} color={GREEN} />}
              label={`${counts.resolved} resolved`}
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                backgroundColor: "rgba(22,163,74,0.10)",
                color: GREEN,
                border: "1px solid rgba(22,163,74,0.3)",
              }}
            />
          </Box>
        </Box>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v: TabValue) => setTab(v)}
            sx={{ px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
          >
            <Tab label={`Active (${counts.active})`} value="active" />
            <Tab label={`Resolved (${counts.resolved})`} value="resolved" />
            <Tab label="All" value="all" />
          </Tabs>
        </Paper>

        {/* Summary banner on the Resolved tab. Only counts IP from bountied
            questions - accepted-only resolutions don't have a fixed payout. */}
        {tab === "resolved" && items.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: "1px solid rgba(22,163,74,0.3)",
              backgroundColor: "rgba(22,163,74,0.05)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <IconWrapper icon="mdi:trophy-variant-outline" size={22} color={GREEN} />
            <Typography variant="body2" sx={{ color: "#15803d", fontWeight: 600 }}>
              {totalAwarded > 0 ? (
                <>
                  <strong>{totalAwarded.toLocaleString()} IP</strong> awarded across {items.length} resolved question{items.length === 1 ? "" : "s"}.
                </>
              ) : (
                <>{items.length} resolved question{items.length === 1 ? "" : "s"} in the archive.</>
              )}
            </Typography>
          </Paper>
        )}

        {/* List */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconWrapper icon="mdi:target" size={48} color="var(--font-tertiary)" />
            <Typography variant="body1" color="text.secondary">
              {tab === "active"
                ? "No open questions waiting on an answer. Post one or come back later."
                : tab === "resolved"
                ? "No resolved questions older than 10 hours yet."
                : "Nothing to show."}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {items.map((b) => {
              // A row is resolved if either: the bounty was claimed, or there's
              // an accepted answer (claimed_at is set on accept-only rows too).
              const isResolved = b.bounty_status === "claimed" || !!b.claimed_at;
              const hasActiveBounty = b.bounty_status === "active";
              const statusColor = isResolved ? GREEN : hasActiveBounty ? RED : PURPLE;
              return (
                <Paper
                  key={b.thread_id}
                  elevation={0}
                  onClick={() => router.push(`/community/${b.thread_id}`)}
                  sx={{
                    p: 2,
                    border: "1px solid var(--border-default)",
                    borderLeft: `4px solid ${statusColor}`,
                    borderRadius: "10px",
                    backgroundColor: "var(--card-bg)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": {
                      borderColor: statusColor,
                      transform: "translateY(-1px)",
                      boxShadow: `0 4px 14px ${statusColor}22`,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    {/* Points badge */}
                    <Box
                      sx={{
                        minWidth: 76,
                        textAlign: "center",
                        py: 1,
                        px: 0.5,
                        borderRadius: "10px",
                        backgroundColor: `${statusColor}12`,
                        border: `1px solid ${statusColor}40`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "1.15rem",
                          fontWeight: 800,
                          color: statusColor,
                          lineHeight: 1,
                        }}
                      >
                        {b.points || "-"}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          color: statusColor,
                          letterSpacing: "0.08em",
                          mt: 0.25,
                        }}
                      >
                        IP
                      </Typography>
                    </Box>

                    {/* Main */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, flexWrap: "wrap" }}>
                        {isResolved ? (
                          <Chip
                            icon={<IconWrapper icon="mdi:check-decagram" size={11} color={GREEN} />}
                            label="Resolved"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              backgroundColor: "rgba(22,163,74,0.12)",
                              color: GREEN,
                              border: "1px solid rgba(22,163,74,0.3)",
                            }}
                          />
                        ) : hasActiveBounty ? (
                          <Chip
                            icon={<IconWrapper icon="mdi:fire" size={11} color={RED} />}
                            label="Open bounty"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              backgroundColor: "rgba(239,68,68,0.12)",
                              color: RED,
                              border: "1px solid rgba(239,68,68,0.3)",
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<IconWrapper icon="mdi:help-circle-outline" size={11} color={PURPLE} />}
                            label="Open"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              backgroundColor: "rgba(167,139,250,0.12)",
                              color: PURPLE,
                              border: "1px solid rgba(167,139,250,0.3)",
                            }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                          {b.hours_unanswered < 1
                            ? "< 1h old"
                            : b.hours_unanswered >= 48
                            ? "48h+ old"
                            : `${b.hours_unanswered}h old`}
                          {typeof b.comment_count === "number" && b.comment_count > 0 && (
                            <> · {b.comment_count} {b.comment_count === 1 ? "answer" : "answers"}</>
                          )}
                        </Typography>
                      </Box>

                      <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.4, mb: 1 }}>
                        {b.thread_title}
                      </Typography>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Avatar src={b.author.profile_pic_url} sx={{ width: 22, height: 22 }}>
                          {b.author.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                          asked by <strong>{b.author.name}</strong>
                        </Typography>

                        {b.claimed_by && (
                          <>
                            <Box sx={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "var(--font-tertiary)" }} />
                            <Avatar src={b.claimed_by.profile_pic_url} sx={{ width: 22, height: 22, border: `1.5px solid ${GREEN}` }}>
                              {b.claimed_by.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                              won by <strong style={{ color: GREEN }}>{b.claimed_by.name}</strong>{" "}
                              {b.claimed_at && (
                                <Box component="span" sx={{ color: "var(--font-tertiary)" }}>
                                  ({formatRelative(b.claimed_at)})
                                </Box>
                              )}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}>
                      <IconWrapper icon="mdi:chevron-right" size={20} color="var(--font-tertiary)" />
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
