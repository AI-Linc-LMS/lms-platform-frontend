"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
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
  Chip,
  Divider,
} from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ThreadCard } from "@/components/community/ThreadCard";
import { CreateThreadDialog } from "@/components/community/CreateThreadDialog";
import { BountySection } from "@/components/community/BountySection";
import { MilestoneWidget } from "@/components/community/MilestoneWidget";
import { ShareDialog } from "@/components/community/ShareDialog";
import { ReportDialog } from "@/components/community/ReportDialog";
import { LiveRoomsStrip } from "@/components/community/LiveRoomsStrip";
import { CreateRoomDialog } from "@/components/community/CreateRoomDialog";
import { CommunityHelpButton } from "@/components/community/CommunityHelpButton";
import { useXPGain } from "@/components/community/XPGainProvider";
import { useAuth } from "@/lib/auth/auth-context";
import {
  communityService,
  Thread,
  BountyItem,
  PostType,
  POST_TYPE_CONFIG,
  UserXP,
  ReportReason,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";

type ActiveFilter = "all" | PostType | "my_posts" | "bookmarks" | "following";

interface ThreadExtras {
  post_type: PostType;
  poll_options?: string[];
  resource_url?: string;
  tried_steps?: string;
  humor_tone?: string;
  punchline?: string;
  stance?: string;
  tldr?: string;
  image_urls?: string[];
}

const POST_TYPES = Object.keys(POST_TYPE_CONFIG) as PostType[];
const THREAD_EXTRAS_KEY = `community_thread_extras_${config.clientId}`;
const PROFILE_LOCAL_KEY = `user_profile_extra_${config.clientId}`;

function getCurrentUserAuthor() {
  try {
    const raw = localStorage.getItem(PROFILE_LOCAL_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        id: p.id ?? 0,
        user_name: p.user_name ?? "",
        name: p.name ?? p.full_name ?? p.user_name ?? "You",
        profile_pic_url: p.profile_pic_url ?? p.avatar ?? "",
        role: p.role ?? "student",
      };
    }
  } catch {}
  return null;
}

function loadThreadExtras(): Map<number, ThreadExtras> {
  try {
    const stored = localStorage.getItem(THREAD_EXTRAS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(
        Object.entries(parsed).map(([id, extras]) => [Number(id), extras as ThreadExtras])
      );
    }
  } catch {}
  return new Map();
}

function saveThreadExtras(extras: Map<number, ThreadExtras>): void {
  try {
    localStorage.setItem(THREAD_EXTRAS_KEY, JSON.stringify(Object.fromEntries(extras)));
  } catch {}
}

function getCurrentUserName(): string | null {
  try {
    const raw = localStorage.getItem(PROFILE_LOCAL_KEY);
    if (raw) {
      const profile = JSON.parse(raw);
      return profile.user_name || null;
    }
  } catch {}
  return null;
}

const FILTER_CONFIG: { key: ActiveFilter; label: string; icon: string; color: string }[] = [
  { key: "all", label: "All Posts", icon: "mdi:view-grid-outline", color: "#6b7280" },
  ...POST_TYPES.map((t) => ({
    key: t as ActiveFilter,
    label: POST_TYPE_CONFIG[t].label,
    icon: POST_TYPE_CONFIG[t].icon,
    color: POST_TYPE_CONFIG[t].color,
  })),
  { key: "following", label: "Following", icon: "mdi:account-heart-outline", color: "#ec4899" },
  { key: "my_posts", label: "My Posts", icon: "mdi:account-outline", color: "#6b7280" },
  { key: "bookmarks", label: "Saved", icon: "mdi:bookmark", color: "#0ea5e9" },
];

export default function CommunityPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showXPGain } = useXPGain();
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [bounties, setBounties] = useState<BountyItem[]>([]);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bountyDialog, setBountyDialog] = useState<{ open: boolean; threadId: number | null; points: string }>({
    open: false, threadId: null, points: "",
  });
  const [selectedPostType] = useState<PostType>("question");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTag, setSelectedTag] = useState<{ id?: number; name: string } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: number; title: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: number } | null>(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  // Use auth-context role rather than scraping localStorage - the previous
  // approach failed for users who hadn't visited /profile in this session.
  const canCreateRooms = useMemo(
    () => ["admin", "instructor", "superadmin"].includes(user?.role ?? ""),
    [user?.role]
  );
  const threadExtrasRef = useRef<Map<number, ThreadExtras>>(new Map());
  const optimisticVotesRef = useRef<Map<number, "upvote" | "downvote" | null>>(new Map());
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
    } catch {}
    return new Map();
  };

  const saveVotesToStorage = (votes: Map<number, "upvote" | "downvote" | null>) => {
    try {
      sessionStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(Object.fromEntries(votes)));
    } catch {}
  };

  const loadBookmarksFromStorage = (): Map<number, boolean> => {
    try {
      const stored = sessionStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(
          Object.entries(parsed).map(([id, bookmarked]) => [Number(id), bookmarked as boolean])
        );
      }
    } catch {}
    return new Map();
  };

  const saveBookmarksToStorage = (bookmarks: Map<number, boolean>) => {
    try {
      sessionStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Object.fromEntries(bookmarks)));
    } catch {}
  };

  useEffect(() => {
    optimisticVotesRef.current = loadVotesFromStorage();
    optimisticBookmarksRef.current = loadBookmarksFromStorage();
    threadExtrasRef.current = loadThreadExtras();
    loadData();
    communityService.getUserXP().then(setUserXP).catch(() => {});
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadData();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, activeFilter, selectedTag]);

  // Honor ?tag=<name> on the URL - set on mount and whenever it changes.
  useEffect(() => {
    const tagParam = searchParams?.get("tag");
    if (tagParam) {
      setSelectedTag({ name: tagParam });
    }
  }, [searchParams]);

  // Refetch when toggling in or out of the bookmarks-only view.
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const mergeExtrasIntoThread = (thread: Thread): Thread => {
    const extras = threadExtrasRef.current.get(thread.id);
    // Backend now stores post_type/image_urls/poll_options; fall back to localStorage extras
    // only when the backend value is absent/empty (e.g. threads created before the migration).
    return {
      ...thread,
      post_type: thread.post_type || extras?.post_type,
      poll_options: thread.poll_options?.length ? thread.poll_options : extras?.poll_options,
      image_urls: thread.image_urls?.length ? thread.image_urls : extras?.image_urls,
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const threadFetch =
        activeFilter === "bookmarks"
          ? communityService.getMyBookmarks()
          : activeFilter === "following"
          ? communityService.getFollowingFeed()
          : communityService.getThreads();
      const [threadsData, bountiesData] = await Promise.all([
        threadFetch,
        communityService.getBounties().catch(() => [] as BountyItem[]),
      ]);
      setBounties(bountiesData);

      const mergedThreads = threadsData.map((backendThread) => {
        const optimisticVote = optimisticVotesRef.current.get(backendThread.id);
        const optimisticBookmark = optimisticBookmarksRef.current.get(backendThread.id);

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

        return mergeExtrasIntoThread({
          ...backendThread,
          user_vote: userVote,
          user_bookmarked: userBookmarked,
        });
      });

      saveVotesToStorage(optimisticVotesRef.current);
      saveBookmarksToStorage(optimisticBookmarksRef.current);
      setThreads(mergedThreads);
    } catch {
      showToast(t("community.failedToLoad"), "error");
    } finally {
      setLoading(false);
    }
  };

  const refreshXP = () => communityService.getUserXP().then(setUserXP).catch(() => {});

  const handleCreateThread = async (data: {
    title: string;
    body: string;
    tag_ids: number[];
    post_type: PostType;
    poll_options?: string[];
    resource_url?: string;
    tried_steps?: string;
    humor_tone?: string;
    punchline?: string;
    stance?: string;
    tldr?: string;
    image_urls?: string[];
  }) => {
    const tempId = -Date.now();
    const author = getCurrentUserAuthor() ?? {
      id: 0, user_name: "", name: "You", profile_pic_url: "", role: "student" as const,
    };

    const optimisticThread: Thread = {
      id: tempId,
      title: data.title,
      body: data.body,
      author,
      tags: [],
      upvotes: 0,
      downvotes: 0,
      user_vote: null,
      bookmarks_count: 0,
      user_bookmarked: false,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      post_type: data.post_type,
      poll_options: data.poll_options,
      image_urls: data.image_urls,
    };

    const extras: ThreadExtras = {
      post_type: data.post_type,
      poll_options: data.poll_options,
      resource_url: data.resource_url,
      tried_steps: data.tried_steps,
      humor_tone: data.humor_tone,
      punchline: data.punchline,
      stance: data.stance,
      tldr: data.tldr,
      image_urls: data.image_urls,
    };

    threadExtrasRef.current.set(tempId, extras);

    setThreads((prev) => [optimisticThread, ...prev]);

    // Fire API in background - dialog closes immediately
    communityService
      .createThread({
        title: data.title,
        body: data.body,
        tag_ids: data.tag_ids,
        post_type: data.post_type,
        poll_options: data.poll_options,
        image_urls: data.image_urls,
      })
      .then((newThread) => {
        threadExtrasRef.current.set(newThread.id, extras);
        threadExtrasRef.current.delete(tempId);
        saveThreadExtras(threadExtrasRef.current);

        setThreads((prev) =>
          prev.map((t) =>
            t.id === tempId
              ? { ...newThread, post_type: data.post_type, poll_options: data.poll_options, image_urls: data.image_urls }
              : t
          )
        );
        showXPGain(10, "mdi:rocket-launch-outline", "Posted");
        refreshXP();
        showToast(t("community.threadCreated"), "success");
      })
      .catch(() => {
        setThreads((prev) => prev.filter((t) => t.id !== tempId));
        threadExtrasRef.current.delete(tempId);
        showToast(t("community.failedToCreateThread"), "error");
      });
  };

  const handleVote = async (threadId: number, type: "upvote" | "downvote") => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    const currentVote = thread.user_vote ?? null;
    let newUpvotes = thread.upvotes;
    let newDownvotes = thread.downvotes;
    let newUserVote: "upvote" | "downvote" | null = null;

    if (currentVote === type) {
      if (type === "upvote") newUpvotes = Math.max(0, newUpvotes - 1);
      else newDownvotes = Math.max(0, newDownvotes - 1);
      newUserVote = null;
    } else if (currentVote === null) {
      if (type === "upvote") newUpvotes += 1;
      else newDownvotes += 1;
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
      prev.map((t) =>
        t.id === threadId
          ? { ...t, upvotes: newUpvotes, downvotes: newDownvotes, user_vote: newUserVote }
          : t
      )
    );

    try {
      await communityService.voteThread(threadId, type);
      // XP awarded on every new/changed vote; toggling off awards none.
      if (currentVote !== type) {
        showXPGain(2, type === "upvote" ? "mdi:thumb-up" : "mdi:thumb-down", "Voted");
      }
      // Trust the optimistic update - no re-fetch needed. The previous code
      // called getThreads() after every vote which was the main source of the
      // perceived lag.
      saveVotesToStorage(optimisticVotesRef.current);
    } catch {
      optimisticVotesRef.current.delete(threadId);
      saveVotesToStorage(optimisticVotesRef.current);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, upvotes: thread.upvotes, downvotes: thread.downvotes, user_vote: thread.user_vote ?? null }
            : t
        )
      );
      showToast(t("community.failedToVote"), "error");
    }
  };

  const handleQuickComment = async (threadId: number, body: string) => {
    setThreads((prev) =>
      prev.map((t) => t.id === threadId ? { ...t, comments_count: t.comments_count + 1 } : t)
    );
    try {
      await communityService.createComment(threadId, { body });
      showXPGain(5, "mdi:comment-outline", "Replied");
      refreshXP();
      showToast(t("community.commentAdded"), "success");
    } catch {
      setThreads((prev) =>
        prev.map((t) => t.id === threadId ? { ...t, comments_count: Math.max(0, t.comments_count - 1) } : t)
      );
      showToast(t("community.failedToAddComment"), "error");
    }
  };

  const handlePollVote = async (threadId: number, optionIndex: number) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread || !thread.poll_options) return;

    const currentVote = thread.user_poll_vote ?? null;
    const pollResults = [...(thread.poll_results ?? thread.poll_options.map(() => 0))];
    let newUserPollVote: number | null;

    if (currentVote === optionIndex) {
      pollResults[optionIndex] = Math.max(0, pollResults[optionIndex] - 1);
      newUserPollVote = null;
    } else {
      if (currentVote !== null) {
        pollResults[currentVote] = Math.max(0, pollResults[currentVote] - 1);
      }
      pollResults[optionIndex] = (pollResults[optionIndex] ?? 0) + 1;
      newUserPollVote = optionIndex;
    }

    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, poll_results: pollResults, user_poll_vote: newUserPollVote }
          : t
      )
    );

    try {
      const result = await communityService.votePoll(threadId, optionIndex);
      // Backend awards XP only on first poll vote - not on switching options or removing.
      if (currentVote === null) {
        showXPGain(1, "mdi:chart-bar", "Poll voted");
      }
      refreshXP();
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, poll_results: result.poll_results, user_poll_vote: result.user_poll_vote }
            : t
        )
      );
    } catch {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, poll_results: thread.poll_results, user_poll_vote: thread.user_poll_vote ?? null }
            : t
        )
      );
      showToast(t("community.failedToVote"), "error");
    }
  };

  const handleOfferBounty = (threadId: number) => {
    setBountyDialog({ open: true, threadId, points: "" });
  };

  const handleSubmitBounty = async () => {
    const { threadId, points } = bountyDialog;
    if (!threadId) return;
    const pts = parseInt(points, 10);
    if (!pts || pts <= 0) { showToast("Enter a valid points amount.", "error"); return; }
    setBountyDialog((prev) => ({ ...prev, open: false }));
    try {
      const bountyInfo = await communityService.createBounty(threadId, pts);
      setThreads((prev) => prev.map((t) => t.id === threadId ? { ...t, bounty: bountyInfo } : t));
      setBounties((prev) => {
        const thread = threads.find((t) => t.id === threadId);
        if (!thread) return prev;
        const updated = prev.map((b) =>
          b.thread_id === threadId ? { ...b, points: pts, has_bounty: true } : b
        );
        return updated.sort((a, b) => b.points - a.points);
      });
      showToast("Bounty placed!", "success");
    } catch {
      showToast("Failed to place bounty.", "error");
    }
  };

  const handleBookmark = async (threadId: number) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    const isBookmarked = thread.user_bookmarked ?? false;
    const newBookmarksCount = isBookmarked
      ? Math.max(0, thread.bookmarks_count - 1)
      : thread.bookmarks_count + 1;
    const newUserBookmarked = !isBookmarked;

    optimisticBookmarksRef.current.set(threadId, newUserBookmarked);
    saveBookmarksToStorage(optimisticBookmarksRef.current);
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, bookmarks_count: newBookmarksCount, user_bookmarked: newUserBookmarked }
          : t
      )
    );

    try {
      await communityService.bookmarkThread(threadId);
      // Backend awards XP only on create, not on un-bookmark.
      if (!isBookmarked) {
        showXPGain(1, "mdi:bookmark", "Saved");
      }
      // Trust the optimistic update - re-fetching every thread on each click
      // was the cause of the perceived bookmark lag.
      saveBookmarksToStorage(optimisticBookmarksRef.current);
      showToast(
        newUserBookmarked
          ? t("community.threadBookmarked")
          : t("community.bookmarkRemoved"),
        "success"
      );
    } catch {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, bookmarks_count: thread.bookmarks_count, user_bookmarked: thread.user_bookmarked ?? false }
            : t
        )
      );
      optimisticBookmarksRef.current.delete(threadId);
      showToast(t("community.failedToBookmark"), "error");
    }
  };

  const filteredThreads = useMemo(() => {
    const currentUserName = getCurrentUserName();
    return threads
      .filter((thread) => {
        // Post type / my posts filter. "bookmarks" + "following" are server-side
        // (handled in loadData), so we just pass them through here.
        if (
          activeFilter !== "all" &&
          activeFilter !== "bookmarks" &&
          activeFilter !== "following"
        ) {
          if (activeFilter === "my_posts") {
            // Prefer the backend's authoritative current_user_is_author flag
            // (always correct). Fall back to local username comparison only
            // when the backend didn't return the field (older payloads).
            if (thread.current_user_is_author !== undefined) {
              if (!thread.current_user_is_author) return false;
            } else {
              if (!currentUserName) return false;
              if (thread.author.user_name !== currentUserName) return false;
            }
          } else {
            const threadType = thread.post_type ?? "question";
            if (threadType !== activeFilter) return false;
          }
        }
        // Active tag chip filter - match by id when known, else by name (e.g.
        // when arriving via ?tag=python without a pre-resolved id).
        if (selectedTag) {
          const matched = thread.tags.some((t) =>
            selectedTag.id ? t.id === selectedTag.id : t.name.toLowerCase() === selectedTag.name.toLowerCase()
          );
          if (!matched) return false;
        }
        // Search filter
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
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
      });
  }, [threads, searchQuery, sortBy, activeFilter, selectedTag]);

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

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Engage"
        title="Community"
        description="Ask questions, share wins, and connect with peers across your cohort in the forum."
        accent="emerald"
        icon="mdi:forum"
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <CommunityHelpButton />
            <HeaderActionButton
              icon="mdi:plus"
              onClick={() => setCreateDialogOpen(true)}
            >
              New post
            </HeaderActionButton>
          </Box>
        }
      />
      {/* Two-column layout - sidebar hidden below md */}
      <Box sx={{ display: "flex", gap: { md: 3, lg: 3.5 }, alignItems: "flex-start" }}>
        {/* Main content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

        {/* Live rooms / bounty / filters strip */}
        <Box sx={{ mb: 4 }}>
          {/* Live rooms strip (Instagram-style live circles). Hidden when empty
              unless the viewer can host. */}
          <Box data-tour-id="tour-live-rooms">
            <LiveRoomsStrip
              canCreate={canCreateRooms}
              onCreateClick={() => setCreateRoomOpen(true)}
            />
          </Box>

          {/* Bounty Section */}
          <Box data-tour-id="tour-bounties">
            <BountySection bounties={bounties} />
          </Box>

          {/* Search + Filters */}
          <Paper
            data-tour-id="tour-filters"
            elevation={0}
            sx={{
              p: 2,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              borderRadius: 2,
            }}
          >
            {/* Row 1: Search */}
            <TextField
              placeholder={t("community.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconWrapper icon="mdi:magnify" size={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Row 2: Filter pills + Sort */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1.75,
                flexWrap: "wrap",
              }}
            >
              {/* Filter pills */}
              <Box
                sx={{
                  display: "flex",
                  gap: 0.75,
                  flexWrap: "wrap",
                  flex: 1,
                  alignItems: "center",
                }}
              >
                {FILTER_CONFIG.map((f) => {
                  const active = activeFilter === f.key;
                  return (
                    <Chip
                      key={f.key}
                      icon={
                        <IconWrapper
                          icon={f.icon}
                          size={13}
                          color={active ? f.color : "var(--font-tertiary)"}
                        />
                      }
                      label={f.label}
                      onClick={() => setActiveFilter(f.key)}
                      size="small"
                      sx={{
                        cursor: "pointer",
                        height: 28,
                        fontSize: "0.78rem",
                        fontWeight: active ? 700 : 500,
                        backgroundColor: active ? `${f.color}15` : "transparent",
                        color: active ? f.color : "#111111",
                        border: `1px solid ${active ? f.color : "#c0c0c0"}`,
                        "& .MuiChip-icon": { ml: 0.75 },
                        transition: "all 0.15s ease",
                        "&:hover": {
                          backgroundColor: `${f.color}10`,
                          borderColor: f.color,
                          color: f.color,
                        },
                      }}
                    />
                  );
                })}
              </Box>

              {/* Divider */}
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />

              {/* Sort Tabs */}
              <Tabs
                value={sortBy}
                onChange={(_, value) => setSortBy(value)}
                sx={{
                  minHeight: 32,
                  "& .MuiTabs-indicator": { height: 2, borderRadius: 2 },
                }}
              >
                <Tab
                  label="Recent"
                  value="recent"
                  icon={<IconWrapper icon="mdi:clock-outline" size={14} />}
                  iconPosition="start"
                  sx={{
                    minHeight: 32,
                    textTransform: "none",
                    fontSize: "0.82rem",
                    fontWeight: sortBy === "recent" ? 600 : 400,
                    py: 0,
                    gap: 0.5,
                  }}
                />
                <Tab
                  label="Popular"
                  value="popular"
                  icon={<IconWrapper icon="mdi:fire" size={14} />}
                  iconPosition="start"
                  sx={{
                    minHeight: 32,
                    textTransform: "none",
                    fontSize: "0.82rem",
                    fontWeight: sortBy === "popular" ? 600 : 400,
                    py: 0,
                    gap: 0.5,
                  }}
                />
              </Tabs>
            </Box>
          </Paper>

          {/* Active tag-filter chip (click tag on a card to set) */}
          {selectedTag && (
            <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Filtered by tag:
              </Typography>
              <Chip
                label={`#${selectedTag.name}`}
                onDelete={() => setSelectedTag(null)}
                size="small"
                sx={{
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 18%, var(--surface) 82%)",
                  color: "var(--accent-indigo)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            </Box>
          )}
        </Box>

        {/* Thread List */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredThreads.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <IconWrapper icon="mdi:forum-outline" size={64} color="var(--font-tertiary)" />
            <Typography variant="h6" color="text.secondary">
              {t("community.noThreadsFound")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? t("community.tryDifferentSearch")
                : activeFilter === "bookmarks"
                ? "You haven't bookmarked anything yet. Tap the bookmark icon on a post to save it here."
                : activeFilter === "following"
                ? "Your Following feed is quiet. Open a profile and tap Follow to start filling this in."
                : activeFilter !== "all"
                ? "No posts in this category yet."
                : t("community.beFirstToStart")}
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Results count and Per Page selector */}
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
                  onPollVote={handlePollVote}
                  onComment={handleQuickComment}
                  onOfferBounty={handleOfferBounty}
                  onTagClick={(tag) => setSelectedTag(tag)}
                  onAuthorClick={(authorId) => router.push(`/community/user/${authorId}`)}
                  onShare={(id) => setShareTarget({ id, title: thread.title })}
                  onReport={(id) => setReportTarget({ id })}
                  currentUserName={getCurrentUserName()}
                />
              ))}
            </Box>

            {/* Pagination */}
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

        {/* Create Thread Dialog */}
        <CreateThreadDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={handleCreateThread}
          initialPostType={selectedPostType}
        />

        {/* Share dialog */}
        {shareTarget && (
          <ShareDialog
            open
            onClose={() => setShareTarget(null)}
            title={shareTarget.title}
            url={`${typeof window !== "undefined" ? window.location.origin : ""}/community/${shareTarget.id}`}
          />
        )}

        {/* Report dialog */}
        {reportTarget && (
          <ReportDialog
            open
            onClose={() => setReportTarget(null)}
            target="thread"
            onSubmit={async (payload: { reason: ReportReason; details?: string }) => {
              await communityService.reportThread(reportTarget.id, payload);
              showToast("Report submitted. Thanks for letting us know.", "success");
            }}
          />
        )}

        {/* Create-room dialog (admin / instructor) */}
        <CreateRoomDialog
          open={createRoomOpen}
          onClose={() => setCreateRoomOpen(false)}
          onCreated={(room) => router.push(`/community/rooms/${room.id}`)}
        />

        {/* Offer Bounty Dialog */}
        {bountyDialog.open && (
          <Box
            onClick={() => setBountyDialog((p) => ({ ...p, open: false }))}
            sx={{
              position: "fixed", inset: 0, zIndex: 1300,
              backgroundColor: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                backgroundColor: "var(--card-bg)", borderRadius: "14px",
                p: 3, width: 340, border: "1px solid var(--border-default)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <IconWrapper icon="mdi:fire" size={20} color="#f59e0b" />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: "var(--font-primary)" }}>
                  Offer a Bounty
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2, lineHeight: 1.6 }}>
                Set an IP reward to attract quality answers. The best answer you accept earns the points.
              </Typography>
              <TextField
                label="Points (IP)"
                type="number"
                value={bountyDialog.points}
                onChange={(e) => setBountyDialog((p) => ({ ...p, points: e.target.value }))}
                fullWidth
                size="small"
                autoFocus
                inputProps={{ min: 1 }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmitBounty(); }}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  size="small"
                  onClick={() => setBountyDialog((p) => ({ ...p, open: false }))}
                  sx={{ textTransform: "none", color: "var(--font-secondary)" }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSubmitBounty}
                  disabled={!bountyDialog.points || parseInt(bountyDialog.points) <= 0}
                  sx={{
                    textTransform: "none", fontWeight: 600, borderRadius: "8px",
                    backgroundColor: "#f59e0b", boxShadow: "none",
                    "&:hover": { backgroundColor: "#d97706", boxShadow: "none" },
                  }}
                >
                  Place Bounty
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        </Box>{/* end main content */}

        {/* Right sidebar - fluid width, sticky */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: { md: "26%", lg: "23%", xl: "20%" },
            maxWidth: 320,
            minWidth: 220,
            flexShrink: 0,
            position: "sticky",
            top: 80,
          }}
        >
          {/* Leaderboard shortcut - mirrors MilestoneWidget visuals so the two
              cards read as a unit: same radius, top accent strip, and uppercase
              header pattern. */}
          <Box
            data-tour-id="tour-leaderboard"
            onClick={() => router.push("/community/leaderboard")}
            sx={{
              mb: 2,
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
              borderRadius: "14px",
              overflow: "hidden",
              width: "100%",
              cursor: "pointer",
              transition: "all 0.15s",
              "&:hover": {
                borderColor: "rgba(251,191,36,0.5)",
                boxShadow: "0 4px 14px rgba(251,191,36,0.15)",
                "& .leaderboard-chevron": { transform: "translateX(3px)" },
              },
            }}
          >
            {/* Same 3px top strip as MilestoneWidget */}
            <Box sx={{ height: 3, backgroundColor: "#fbbf24" }} />

            <Box sx={{ p: 2 }}>
              {/* Header - matches MilestoneWidget's "YOUR PROGRESS" pattern */}
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                  mb: 1.5,
                }}
              >
                Leaderboard
              </Typography>

              {/* Hero row - matches MilestoneWidget's icon-tile + text pattern */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    flexShrink: 0,
                    borderRadius: "12px",
                    backgroundColor: "rgba(251,191,36,0.12)",
                    border: "1.5px solid rgba(251,191,36,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:trophy-outline" size={26} color="#fbbf24" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "var(--font-primary)",
                      lineHeight: 1.2,
                    }}
                  >
                    Top contributors
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--font-secondary)",
                      mt: 0.25,
                    }}
                  >
                    See who&apos;s earned the most IP
                  </Typography>
                </Box>
                <Box
                  className="leaderboard-chevron"
                  sx={{
                    display: "inline-flex",
                    color: "#fbbf24",
                    transition: "transform 0.18s",
                  }}
                >
                  <IconWrapper icon="mdi:chevron-right" size={20} />
                </Box>
              </Box>
            </Box>
          </Box>

          {userXP && (
            <Box data-tour-id="tour-milestones">
              <MilestoneWidget xp={userXP} />
            </Box>
          )}

        </Box>

        </Box>{/* end two-column layout */}
    </PageShell>
  );
}
