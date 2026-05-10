"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ThreadCard } from "@/components/community/ThreadCard";
import { ThreadFeedSkeleton } from "@/components/community/ThreadCardSkeleton";
import { CreateThreadDialog } from "@/components/community/CreateThreadDialog";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { RightSidebar } from "@/components/community/RightSidebar";
import { TechArena } from "@/components/community/TechArena";
import { LivePods } from "@/components/community/LivePods";
import type { LivePodItem } from "@/components/community/LivePods";
import { BountyBoard } from "@/components/community/BountyBoard";
import { FeedEmptyState } from "@/components/community/FeedEmptyState";
import {
  MobileFilterSheet,
  type FeedFilterValue,
} from "@/components/community/MobileFilterSheet";
import {
  communityService,
  Thread,
  Tag,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { useImpactEconomy } from "@/lib/contexts/ImpactEconomyContext";
import { config } from "@/lib/config";
import {
  dummyDailyQuest,
  dummyLivePods,
  dummyThreads,
} from "@/lib/community/community-dummy-data";
import { bountiesFromThreads, trendingFromThreads } from "@/lib/community/widget-fallback";
import { parsePollFromBody } from "@/lib/community/poll-parse";
import type {
  BountyThreadDto,
  DailyQuestDto,
  LiveSessionDto,
  TrendingKeywordDto,
} from "@/lib/community/widget-types";

function sessionsToPods(sessions: LiveSessionDto[]): LivePodItem[] {
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    meet_url: s.meet_url,
    active_count: s.active_count ?? 1,
    imageSeed: String(s.id),
  }));
}

function threadMatchesFeedFilter(
  thread: Thread,
  filter: FeedFilterValue,
  currentUserId?: number | null
): boolean {
  if (filter === "all") return true;
  if (filter === "mine") {
    return currentUserId != null && thread.author?.id === currentUserId;
  }
  const tagNames = (thread.tags ?? []).map((x) => x.name.toLowerCase());
  const title = (thread.title || "").toLowerCase();
  if (filter === "queries") {
    if (tagNames.some((n) => n.includes("help") || n.includes("question"))) return true;
    if (
      title.includes("how ") ||
      title.includes("what ") ||
      title.includes("why ") ||
      title.includes("?")
    ) {
      return true;
    }
    return false;
  }
  if (filter === "polls") {
    if (parsePollFromBody(thread.body || "") != null) return true;
    if (tagNames.some((n) => n.includes("poll"))) return true;
    return false;
  }
  if (filter === "humor") {
    if (tagNames.some((n) => n.includes("humor") || n.includes("meme"))) return true;
    if (title.includes("humor") || title.includes("meme")) return true;
    return false;
  }
  return true;
}

const FEED_FILTER_CHIPS: { value: FeedFilterValue; label: string; icon: string }[] = [
  { value: "all", label: "All posts", icon: "mdi:forum-outline" },
  { value: "queries", label: "Questions", icon: "mdi:help-circle-outline" },
  { value: "polls", label: "Polls", icon: "mdi:poll" },
  { value: "humor", label: "Humor", icon: "mdi:emoticon-happy-outline" },
  { value: "mine", label: "My posts", icon: "mdi:account" },
];

export default function CommunityPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const { user } = useAuth();
  const { refreshBalance, addPoints } = useImpactEconomy();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [feedFilter, setFeedFilter] = useState<FeedFilterValue>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dailyQuest, setDailyQuest] = useState<DailyQuestDto | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingKeywordDto[]>([]);
  const [bountyItems, setBountyItems] = useState<BountyThreadDto[]>([]);
  const [livePods, setLivePods] = useState<LivePodItem[]>([]);
  const [questJoinBusy, setQuestJoinBusy] = useState(false);
  const optimisticVotesRef = useRef<Map<number, "upvote" | "downvote" | null>>(
    new Map()
  );
  const optimisticBookmarksRef = useRef<Map<number, boolean>>(new Map());

  const VOTES_STORAGE_KEY = "community_thread_votes";
  const BOOKMARKS_STORAGE_KEY = "community_thread_bookmarks";

  const loadVotesFromStorage = (): Map<number, "upvote" | "downvote" | null> => {
    try {
      const stored = sessionStorage.getItem(VOTES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(
          Object.entries(parsed).map(([id, vote]) => [
            Number(id),
            vote as "upvote" | "downvote" | null,
          ])
        );
      }
    } catch (error) {
    }
    return new Map();
  };

  const saveVotesToStorage = (votes: Map<number, "upvote" | "downvote" | null>) => {
    try {
      const obj = Object.fromEntries(votes);
      sessionStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
    }
  };

  const loadBookmarksFromStorage = (): Map<number, boolean> => {
    try {
      const stored = sessionStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(
          Object.entries(parsed).map(([id, bookmarked]) => [
            Number(id),
            bookmarked as boolean,
          ])
        );
      }
    } catch (error) {
    }
    return new Map();
  };

  const saveBookmarksToStorage = (bookmarks: Map<number, boolean>) => {
    try {
      const obj = Object.fromEntries(bookmarks);
      sessionStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
    }
  };

  const hydrateSidebarWidgets = useCallback(async (threadList: Thread[]) => {
    if (config.communityWidgetApi) {
      const [qRes, bRes, tRes, pRes] = await Promise.all([
        communityService.getDailyQuestCurrent(),
        communityService.getWidgetBounties(),
        communityService.getWidgetTrending(),
        communityService.getLiveSessionsActive(),
      ]);
      setDailyQuest(qRes.ok ? qRes.data : null);
      const bData = bRes.ok ? bRes.data : [];
      setBountyItems(bData.length ? bData : bountiesFromThreads(threadList));
      const tData = tRes.ok ? tRes.data : [];
      setTrendingTopics(tData.length ? tData : trendingFromThreads(threadList));
      let pods = pRes.ok ? sessionsToPods(pRes.data) : [];
      if (pods.length === 0 && config.communityDummyData) {
        pods = dummyLivePods();
      }
      setLivePods(pods);
    } else {
      if (config.communityDummyData) {
        setDailyQuest(dummyDailyQuest());
        setLivePods(dummyLivePods());
      } else {
        setDailyQuest(null);
        setLivePods([]);
      }
      setBountyItems(bountiesFromThreads(threadList));
      setTrendingTopics(trendingFromThreads(threadList));
    }
  }, []);

  useEffect(() => {
    void hydrateSidebarWidgets(threads);
  }, [threads, hydrateSidebarWidgets]);

  useEffect(() => {
    optimisticVotesRef.current = loadVotesFromStorage();
    optimisticBookmarksRef.current = loadBookmarksFromStorage();
    loadData();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, feedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [threadsDataRaw, tagsData] = await Promise.all([
        communityService.getThreads(),
        communityService.getTags(),
      ]);

      let threadsData = threadsDataRaw;
      if (threadsData.length === 0 && config.communityDummyData) {
        threadsData = dummyThreads();
      }

      const mergedThreads = threadsData.map((backendThread) => {
        const optimisticVote = optimisticVotesRef.current.get(
          backendThread.id
        );
        const optimisticBookmark = optimisticBookmarksRef.current.get(
          backendThread.id
        );

        let userVote: "upvote" | "downvote" | null;
        if (backendThread.user_vote !== undefined) {
          userVote = backendThread.user_vote;
          optimisticVotesRef.current.set(backendThread.id, backendThread.user_vote);
        } else {
          userVote = optimisticVote ?? null;
        }

        let userBookmarked: boolean;
        if (backendThread.user_bookmarked !== undefined) {
          userBookmarked = backendThread.user_bookmarked ?? false;
          optimisticBookmarksRef.current.set(
            backendThread.id,
            backendThread.user_bookmarked ?? false
          );
        } else {
          userBookmarked = optimisticBookmark ?? false;
        }

        return {
          ...backendThread,
          user_vote: userVote,
          user_bookmarked: userBookmarked,
        };
      });

      saveVotesToStorage(optimisticVotesRef.current);
      saveBookmarksToStorage(optimisticBookmarksRef.current);
      setThreads(mergedThreads);
      setTags(tagsData);
    } catch (error) {
      showToast(t("community.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQuest = async () => {
    if (questJoinBusy) return;
    setQuestJoinBusy(true);
    try {
      if (config.communityWidgetApi) {
        const res = await communityService.postDailyQuestJoin();
        if (res.ok) {
          showToast("Joined daily quest", "success");
          await refreshBalance();
          const q = await communityService.getDailyQuestCurrent();
          if (q.ok) setDailyQuest(q.data);
        } else {
          showToast(t("community.failedToLoad"), "error");
        }
      } else if (dailyQuest && !dailyQuest.joined_today) {
        await addPoints(20, "Daily quest", "interaction");
        setDailyQuest((q) => (q ? { ...q, joined_today: true } : q));
        showToast("Joined quest (demo)", "success");
      }
    } finally {
      setQuestJoinBusy(false);
    }
  };

  const handleCreateThread = async (data: {
    title: string;
    body: string;
    tag_ids: number[];
  }) => {
    try {
      const newThread = await communityService.createThread(data);
      setThreads([newThread, ...threads]);
      showToast(t("community.threadCreated"), "success");
    } catch (error) {
      showToast(t("community.failedToCreateThread"), "error");
      throw error;
    }
  };

  const handleVote = async (threadId: number, type: "upvote" | "downvote") => {
    const thread = threads.find((th) => th.id === threadId);
    if (!thread) return;

    const currentVote = thread.user_vote ?? null;
    let newUpvotes = thread.upvotes;
    let newDownvotes = thread.downvotes;
    let newUserVote: "upvote" | "downvote" | null = null;

    if (currentVote === type) {
      if (type === "upvote") {
        newUpvotes = Math.max(0, newUpvotes - 1);
      } else {
        newDownvotes = Math.max(0, newDownvotes - 1);
      }
      newUserVote = null;
    } else if (currentVote === null) {
      if (type === "upvote") {
        newUpvotes += 1;
      } else {
        newDownvotes += 1;
      }
      newUserVote = type;
    } else {
      if (type === "upvote") {
        newDownvotes = Math.max(0, newDownvotes - 1);
        newUpvotes += 1;
      } else {
        newUpvotes = Math.max(0, newUpvotes - 1);
        newDownvotes += 1;
      }
      newUserVote = type;
    }

    optimisticVotesRef.current.set(threadId, newUserVote);
    saveVotesToStorage(optimisticVotesRef.current);

    setThreads((prev) =>
      prev.map((th) =>
        th.id === threadId
          ? {
              ...th,
              upvotes: newUpvotes,
              downvotes: newDownvotes,
              user_vote: newUserVote,
            }
          : th
      )
    );

    try {
      await communityService.voteThread(threadId, type);
      const [threadsData, tagsData] = await Promise.all([
        communityService.getThreads(),
        communityService.getTags(),
      ]);

      const mergedThreads = threadsData.map((backendThread) => {
        const optimisticVote = optimisticVotesRef.current.get(
          backendThread.id
        );

        const finalUserVote =
          backendThread.user_vote !== undefined
            ? backendThread.user_vote
            : optimisticVote ?? null;

        if (backendThread.user_vote !== undefined) {
          optimisticVotesRef.current.set(backendThread.id, backendThread.user_vote);
        }

        return {
          ...backendThread,
          upvotes: backendThread.upvotes,
          downvotes: backendThread.downvotes,
          user_vote: finalUserVote,
        };
      });

      saveVotesToStorage(optimisticVotesRef.current);
      setThreads(mergedThreads);
      setTags(tagsData);
    } catch (error) {
      optimisticVotesRef.current.delete(threadId);
      saveVotesToStorage(optimisticVotesRef.current);
      setThreads((prev) =>
        prev.map((th) =>
          th.id === threadId
            ? {
                ...th,
                upvotes: thread.upvotes,
                downvotes: thread.downvotes,
                user_vote: thread.user_vote ?? null,
              }
            : th
        )
      );
      showToast(t("community.failedToVote"), "error");
    }
  };

  const handleBookmark = async (threadId: number) => {
    const thread = threads.find((th) => th.id === threadId);
    if (!thread) return;

    const isBookmarked = thread.user_bookmarked ?? false;
    let newBookmarksCount = thread.bookmarks_count;
    let newUserBookmarked = !isBookmarked;

    if (isBookmarked) {
      newBookmarksCount = Math.max(0, newBookmarksCount - 1);
      newUserBookmarked = false;
    } else {
      newBookmarksCount += 1;
      newUserBookmarked = true;
    }

    optimisticBookmarksRef.current.set(threadId, newUserBookmarked);
    saveBookmarksToStorage(optimisticBookmarksRef.current);

    setThreads((prev) =>
      prev.map((th) =>
        th.id === threadId
          ? {
              ...th,
              bookmarks_count: newBookmarksCount,
              user_bookmarked: newUserBookmarked,
            }
          : th
      )
    );

    try {
      await communityService.bookmarkThread(threadId);
      const [threadsData, tagsData] = await Promise.all([
        communityService.getThreads(),
        communityService.getTags(),
      ]);

      const mergedThreads = threadsData.map((backendThread) => {
        const optimisticBookmark = optimisticBookmarksRef.current.get(
          backendThread.id
        );

        const finalUserBookmarked =
          backendThread.user_bookmarked !== undefined
            ? backendThread.user_bookmarked ?? false
            : optimisticBookmark ?? false;

        if (backendThread.user_bookmarked !== undefined) {
          optimisticBookmarksRef.current.set(
            backendThread.id,
            backendThread.user_bookmarked ?? false
          );
        }

        return {
          ...backendThread,
          bookmarks_count: backendThread.bookmarks_count,
          user_bookmarked: finalUserBookmarked,
        };
      });

      setThreads(mergedThreads);
      setTags(tagsData);

      showToast(
        newUserBookmarked ? t("community.threadBookmarked") : t("community.bookmarkRemoved"),
        "success"
      );
    } catch (error) {
      setThreads((prev) =>
        prev.map((th) =>
          th.id === threadId
            ? {
                ...th,
                bookmarks_count: thread.bookmarks_count,
                user_bookmarked: thread.user_bookmarked ?? false,
              }
            : th
        )
      );
      optimisticBookmarksRef.current.delete(threadId);
      setThreads((prev) =>
        prev.map((th) =>
          th.id === threadId
            ? {
                ...th,
                bookmarks_count: thread.bookmarks_count,
                user_bookmarked: thread.user_bookmarked ?? false,
              }
            : th
        )
      );
      showToast(t("community.failedToBookmark"), "error");
    }
  };

  const filteredThreads = useMemo(() => {
    return threads
      .filter((thread) => threadMatchesFeedFilter(thread, feedFilter, user?.id))
      .filter((thread) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            thread.title.toLowerCase().includes(query) ||
            thread.body.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else {
          const scoreA = a.upvotes - a.downvotes;
          const scoreB = b.upvotes - b.downvotes;
          return scoreB - scoreA;
        }
      });
  }, [threads, searchQuery, sortBy, feedFilter, user?.id]);

  const paginatedThreads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredThreads.slice(start, start + pageSize);
  }, [filteredThreads, page, pageSize]);

  const totalPages = Math.ceil(filteredThreads.length / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filteredThreads.length);

  const handlePageChange = (_: unknown, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const emptyFeedFilter = useMemo(() => {
    if (searchQuery.trim()) return "search" as const;
    return feedFilter;
  }, [searchQuery, feedFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setFeedFilter("all");
  };

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
            alignItems: "flex-start",
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", md: 260 },
              flexShrink: 0,
              display: { xs: "none", md: "block" },
            }}
          >
            <CommunitySidebar />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {t("community.forumTitle")}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t("community.forumSubtitle")}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<IconWrapper icon="mdi:plus" />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{ textTransform: "none" }}
                >
                  {t("community.askQuestion")}
                </Button>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--card-bg)",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <TextField
                    placeholder={t("community.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    sx={{ flex: 1, minWidth: 200 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconWrapper icon="mdi:magnify" size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <IconButton
                    aria-label="Filters"
                    onClick={() => setMobileFilterOpen(true)}
                    sx={{
                      display: { xs: "inline-flex", md: "none" },
                      border: "1px solid var(--border-default)",
                      borderRadius: 2,
                    }}
                  >
                    <IconWrapper icon="mdi:tune-variant" size={22} />
                  </IconButton>
                  <Tabs
                    value={sortBy}
                    onChange={(_, value) => setSortBy(value)}
                    sx={{ minHeight: 40 }}
                  >
                    <Tab
                      label={t("community.recent")}
                      value="recent"
                      sx={{ minHeight: 40, textTransform: "none" }}
                    />
                    <Tab
                      label={t("community.popular")}
                      value="popular"
                      sx={{ minHeight: 40, textTransform: "none" }}
                    />
                  </Tabs>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mt: 2, display: { xs: "none", md: "flex" } }}
                >
                  {FEED_FILTER_CHIPS.map((c) => (
                    <Chip
                      key={c.value}
                      icon={<IconWrapper icon={c.icon} size={16} />}
                      label={c.label}
                      onClick={() => setFeedFilter(c.value)}
                      variant={feedFilter === c.value ? "filled" : "outlined"}
                      color={feedFilter === c.value ? "primary" : "default"}
                      sx={{ fontWeight: 600, textTransform: "none" }}
                    />
                  ))}
                </Stack>
              </Paper>
            </Box>

            <TechArena />
            <LivePods pods={livePods} loading={false} />
            <BountyBoard variant="carousel" items={bountyItems} />

            {loading ? (
              <Box sx={{ py: 2 }}>
                <ThreadFeedSkeleton count={4} />
              </Box>
            ) : filteredThreads.length === 0 ? (
              <FeedEmptyState
                filter={emptyFeedFilter}
                searchTerm={searchQuery.trim() || undefined}
                onCreate={() => setCreateDialogOpen(true)}
                onClearFilters={emptyFeedFilter === "search" ? clearFilters : undefined}
              />
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("community.threadCount", { count: filteredThreads.length })}
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>{t("community.perPage")}</InputLabel>
                    <Select
                      value={pageSize}
                      label={t("community.perPage")}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {paginatedThreads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onVote={handleVote}
                      onBookmark={handleBookmark}
                    />
                  ))}
                </Box>

                {totalPages > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      gap: 2,
                      mt: 4,
                    }}
                  >
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                    <Typography variant="caption" color="text.secondary">
                      {t("community.showingRange", {
                        start: startItem,
                        end: endItem,
                        total: filteredThreads.length,
                      })}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          <Box
            sx={{
              width: { xs: "100%", lg: 320 },
              flexShrink: 0,
              display: { xs: "none", lg: "block" },
            }}
          >
            <RightSidebar
              dailyQuest={dailyQuest}
              trendingTopics={trendingTopics}
              onJoinQuest={handleJoinQuest}
              questLoading={questJoinBusy}
            />
          </Box>
        </Box>

        <MobileFilterSheet
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          filter={feedFilter}
          onFilterChange={setFeedFilter}
          sort={sortBy}
          onSortChange={setSortBy}
        />

        <CreateThreadDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateThread}
          availableTags={tags}
        />
      </Container>
    </MainLayout>
  );
}
