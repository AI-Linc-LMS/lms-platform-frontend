"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ThreadCard } from "@/components/community/ThreadCard";
import { CreateThreadDialog } from "@/components/community/CreateThreadDialog";
import {
  communityService,
  Thread,
  Tag,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";

export default function CommunityPage() {
  const { showToast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [threadsData, tagsData] = await Promise.all([
        communityService.getThreads(),
        communityService.getTags(),
      ]);
      setThreads(threadsData);
      setTags(tagsData);
    } catch (error) {
      showToast("Failed to load community data", "error");
    } finally {
      setLoading(false);
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
      showToast("Thread created successfully!", "success");
    } catch (error) {
      showToast("Failed to create thread", "error");
      throw error;
    }
  };

  const handleVote = async (threadId: number, type: "upvote" | "downvote") => {
    try {
      await communityService.voteThread(threadId, type);
      // Update local state
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                [type === "upvote" ? "upvotes" : "downvotes"]:
                  thread[type === "upvote" ? "upvotes" : "downvotes"] + 1,
              }
            : thread
        )
      );
    } catch (error) {
      showToast("Failed to vote", "error");
    }
  };

  const handleBookmark = async (threadId: number) => {
    try {
      await communityService.bookmarkThread(threadId);
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? { ...thread, bookmarks_count: thread.bookmarks_count + 1 }
            : thread
        )
      );
      showToast("Thread bookmarked!", "success");
    } catch (error) {
      showToast("Failed to bookmark thread", "error");
    }
  };

  // Filter and sort threads
  const filteredThreads = useMemo(() => {
    return threads
      .filter((thread) => {
        // Filter by search query
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
          // popular: sort by score
          const scoreA = a.upvotes - a.downvotes;
          const scoreB = b.upvotes - b.downvotes;
          return scoreB - scoreA;
        }
      });
  }, [threads, searchQuery, sortBy]);

  // Pagination
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
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Community Forum
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ask questions, share knowledge, and connect with fellow learners
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<IconWrapper icon="mdi:plus" />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                textTransform: "none",
              }}
            >
              Ask Question
            </Button>
          </Box>

          {/* Search and Filters */}
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #e5e7eb" }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Search */}
              <TextField
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flex: 1, minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconWrapper icon="mdi:magnify" size={20} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Sort Tabs */}
              <Tabs
                value={sortBy}
                onChange={(_, value) => setSortBy(value)}
                sx={{ minHeight: 40 }}
              >
                <Tab
                  label="Recent"
                  value="recent"
                  sx={{ minHeight: 40, textTransform: "none" }}
                />
                <Tab
                  label="Popular"
                  value="popular"
                  sx={{ minHeight: 40, textTransform: "none" }}
                />
              </Tabs>
            </Box>
          </Paper>
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
              border: "1px solid #e5e7eb",
            }}
          >
            <IconWrapper
              icon="mdi:forum-outline"
              size={64}
              color="#d1d5db"
              style={{ marginBottom: 16 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No threads found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? "Try a different search term"
                : "Be the first to start a discussion!"}
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
                {filteredThreads.length}{" "}
                {filteredThreads.length === 1 ? "thread" : "threads"} found
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Per Page</InputLabel>
                <Select
                  value={pageSize}
                  label="Per Page"
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
                  Showing {startItem} - {endItem} of {filteredThreads.length}
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
          availableTags={tags}
        />
      </Container>
    </MainLayout>
  );
}
