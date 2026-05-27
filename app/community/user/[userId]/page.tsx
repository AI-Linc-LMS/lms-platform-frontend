"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ThreadCard } from "@/components/community/ThreadCard";
import {
  communityService,
  CommunityUserProfile,
  Thread,
  UserCommentItem,
  BadgeItem,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";
import { formatDistanceToNow } from "@/lib/utils/date-utils";

const TIER_COLOR: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#94a3b8",
  gold: "#fbbf24",
  platinum: "#a78bfa",
};

const TIER_ICON: Record<string, string> = {
  bronze: "mdi:shield-outline",
  silver: "mdi:shield-half-full",
  gold: "mdi:trophy-outline",
  platinum: "mdi:crown-outline",
};

type ProfileTab = "threads" | "comments";

export default function CommunityUserPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const userId = Number(params?.userId);

  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [comments, setComments] = useState<UserCommentItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [tab, setTab] = useState<ProfileTab>("threads");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, t, c, b] = await Promise.all([
          communityService.getCommunityUserProfile(userId),
          communityService.getUserThreads(userId).catch(() => []),
          communityService.getUserComments(userId).catch(() => []),
          communityService.getBadges(userId).catch(() => []),
        ]);
        if (cancelled) return;
        setProfile(p);
        setThreads(t);
        setComments(c);
        setBadges(b);
      } catch {
        if (!cancelled) {
          setNotFound(true);
          showToast("Failed to load profile.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, showToast]);

  const tierColor = useMemo(
    () => (profile ? TIER_COLOR[profile.xp.tier] ?? "#94a3b8" : "#94a3b8"),
    [profile]
  );
  const tierIcon = useMemo(
    () => (profile ? TIER_ICON[profile.xp.tier] ?? "mdi:shield-outline" : "mdi:shield-outline"),
    [profile]
  );

  // No-op handlers — profile page is read-only for now. Voting/bookmarking
  // routes back to the main feed via the thread detail page.
  const noopVote = async () => {};
  const noopBookmark = async () => {};

  const handleToggleFollow = async () => {
    if (!profile || profile.is_self) return;
    setFollowBusy(true);
    const wasFollowing = !!profile.is_followed_by_me;
    // Optimistic update
    setProfile((p) =>
      p
        ? {
            ...p,
            is_followed_by_me: !wasFollowing,
            follower_count: (p.follower_count ?? 0) + (wasFollowing ? -1 : 1),
          }
        : p
    );
    try {
      if (wasFollowing) await communityService.unfollowUser(profile.id);
      else await communityService.followUser(profile.id);
    } catch {
      // Rollback
      setProfile((p) =>
        p
          ? {
              ...p,
              is_followed_by_me: wasFollowing,
              follower_count: (p.follower_count ?? 0) + (wasFollowing ? 1 : -1),
            }
          : p
      );
      showToast("Failed to update follow.", "error");
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (notFound || !profile) {
    return (
      <MainLayout fullWidthContent>
        <Box
          sx={{
            maxWidth: 720,
            mx: "auto",
            textAlign: "center",
            py: 12,
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper icon="mdi:account-question-outline" size={64} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ mt: 1 }}>
            User not found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This profile doesn&apos;t exist or you don&apos;t have access to view it.
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2, textTransform: "none" }}
            onClick={() => router.push("/community")}
          >
            Back to Community
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const stats = profile.stats;

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ py: 2, maxWidth: 1200, mx: "auto", width: "100%", px: { xs: 2, md: 0 } }}>
        {/* Back link */}
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={16} />}
          onClick={() => router.push("/community")}
          sx={{ textTransform: "none", mb: 2, color: "var(--font-secondary)" }}
        >
          Back to community
        </Button>

        {/* Profile header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", gap: 3, alignItems: { xs: "flex-start", md: "center" }, flexWrap: "wrap" }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={profile.profile_pic_url}
                sx={{
                  width: 88,
                  height: 88,
                  border: `3px solid ${tierColor}`,
                  fontSize: "2rem",
                }}
              >
                {profile.name.charAt(0)}
              </Avatar>
              <Box
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "var(--card-bg)",
                  border: `2px solid ${tierColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon={tierIcon} size={16} color={tierColor} />
              </Box>
            </Box>

            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                <Typography variant="h5" fontWeight={700}>
                  {profile.name}
                </Typography>
                <Chip
                  label={profile.role}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--font-secondary)",
                  }}
                />
                {profile.is_self && (
                  <Chip
                    label="You"
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      backgroundColor: "rgba(99,102,241,0.12)",
                      color: "#6366f1",
                      border: "1px solid rgba(99,102,241,0.3)",
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                @{profile.user_name}
              </Typography>

              {/* Follower counts + Follow button */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mt: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  <strong style={{ color: "var(--font-primary)" }}>
                    {profile.follower_count ?? 0}
                  </strong>{" "}
                  follower{(profile.follower_count ?? 0) === 1 ? "" : "s"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong style={{ color: "var(--font-primary)" }}>
                    {profile.following_count ?? 0}
                  </strong>{" "}
                  following
                </Typography>
                {!profile.is_self && (
                  <Button
                    variant={profile.is_followed_by_me ? "outlined" : "contained"}
                    size="small"
                    onClick={handleToggleFollow}
                    disabled={followBusy}
                    startIcon={
                      <IconWrapper
                        icon={
                          profile.is_followed_by_me
                            ? "mdi:account-check"
                            : "mdi:account-plus-outline"
                        }
                        size={14}
                      />
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "8px",
                      ml: "auto",
                      ...(profile.is_followed_by_me
                        ? {
                            borderColor: "var(--accent-indigo)",
                            color: "var(--accent-indigo)",
                          }
                        : { boxShadow: "none" }),
                    }}
                  >
                    {profile.is_followed_by_me ? "Following" : "Follow"}
                  </Button>
                )}
              </Box>

              {/* Tier progress */}
              <Box sx={{ mt: 2, maxWidth: 460 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: tierColor }}>
                    {profile.xp.tier_display}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                    {profile.xp.balance} IP
                    {profile.xp.next_tier_threshold !== null &&
                      ` / ${profile.xp.next_tier_threshold}`}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={profile.xp.progress_pct}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "var(--surface)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: tierColor,
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Stat cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(5, 1fr)",
              },
              gap: 1.5,
              mt: 3,
            }}
          >
            {[
              { label: "Posts", value: stats.threads, icon: "mdi:forum-outline", color: "#6366f1" },
              { label: "Comments", value: stats.comments, icon: "mdi:comment-outline", color: "#10b981" },
              {
                label: "Upvotes",
                value: stats.upvotes_received,
                icon: "mdi:arrow-up-bold-outline",
                color: "#0ea5e9",
              },
              {
                label: "Accepted",
                value: stats.accepted_answers,
                icon: "mdi:check-decagram-outline",
                color: "#16a34a",
              },
              {
                label: "Bounties",
                value: stats.bounties_won,
                icon: "mdi:fire",
                color: "#f59e0b",
              },
            ].map((s) => (
              <Paper
                key={s.label}
                elevation={0}
                sx={{
                  p: 1.5,
                  border: "1px solid var(--border-default)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    backgroundColor: `${s.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon={s.icon} size={18} color={s.color} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.1 }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.label}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>

        {/* Badges */}
        {badges.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <IconWrapper icon="mdi:medal-outline" size={18} color="#f59e0b" />
              <Typography variant="subtitle1" fontWeight={700}>
                Badges
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                {badges.filter((b) => b.earned).length} / {badges.length} earned
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {badges.map((b) => (
                <Box
                  key={b.key}
                  title={b.description}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.25,
                    borderRadius: "10px",
                    border: `1px solid ${b.earned ? `${b.color}40` : "var(--border-default)"}`,
                    backgroundColor: b.earned ? `${b.color}0c` : "transparent",
                    opacity: b.earned ? 1 : 0.45,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "8px",
                      backgroundColor: b.earned ? `${b.color}15` : "var(--surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper
                      icon={b.icon}
                      size={20}
                      color={b.earned ? b.color : "var(--font-tertiary)"}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      noWrap
                      sx={{ color: b.earned ? "var(--font-primary)" : "var(--font-secondary)" }}
                    >
                      {b.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      title={b.description}
                    >
                      {b.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

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
            onChange={(_, v) => setTab(v)}
            sx={{ px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
          >
            <Tab label={`Posts (${stats.threads})`} value="threads" />
            <Tab label={`Comments (${stats.comments})`} value="comments" />
          </Tabs>
        </Paper>

        {/* Tab content */}
        {tab === "threads" ? (
          threads.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--card-bg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <IconWrapper icon="mdi:forum-outline" size={48} color="var(--font-tertiary)" />
              <Typography variant="body1" color="text.secondary">
                No posts yet.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {threads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  onVote={noopVote}
                  onBookmark={noopBookmark}
                  onAuthorClick={(id) => router.push(`/community/user/${id}`)}
                />
              ))}
            </Box>
          )
        ) : comments.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconWrapper icon="mdi:comment-outline" size={48} color="var(--font-tertiary)" />
            <Typography variant="body1" color="text.secondary">
              No comments yet.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {comments.map((c) => (
              <Paper
                key={c.id}
                elevation={0}
                onClick={() => router.push(`/community/${c.thread.id}`)}
                sx={{
                  p: 2,
                  border: "1px solid var(--border-default)",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  "&:hover": {
                    borderColor: "var(--accent-indigo)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                  <IconWrapper icon="mdi:reply-outline" size={14} color="var(--font-secondary)" />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ "&:hover": { color: "var(--accent-indigo)" } }}
                  >
                    on &ldquo;{c.thread.title}&rdquo;
                  </Typography>
                  {c.is_accepted && (
                    <Chip
                      icon={<IconWrapper icon="mdi:check-decagram" size={11} color="#16a34a" />}
                      label="Accepted"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        backgroundColor: "rgba(22,163,74,0.12)",
                        color: "#15803d",
                        border: "1px solid rgba(22,163,74,0.3)",
                        "& .MuiChip-icon": { ml: 0.5 },
                      }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: "auto", fontSize: "0.7rem" }}
                  >
                    {formatDistanceToNow(c.created_at)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-primary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {c.body}
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, mt: 1, color: "var(--font-secondary)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconWrapper icon="mdi:arrow-up-bold-outline" size={13} />
                    <Typography variant="caption">{c.upvotes}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconWrapper icon="mdi:arrow-down-bold-outline" size={13} />
                    <Typography variant="caption">{c.downvotes}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}
