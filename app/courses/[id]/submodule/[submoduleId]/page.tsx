"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogContent,
  CircularProgress,
  Button,
  DialogTitle,
  Drawer,
  IconButton,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import {
  coursesService,
  SubModuleDetailResponse,
  SubModuleContentItem,
  ContentDetail,
  CourseDetail,
} from "@/lib/services/courses.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { SubmoduleSidebar } from "@/components/course/submodule/SubmoduleSidebar";
import { SubmoduleContentHeader } from "@/components/course/submodule/SubmoduleContentHeader";
import { SubmoduleContentViewer } from "@/components/course/submodule/SubmoduleContentViewer";
import { invalidateStreakCache } from "@/lib/hooks/useLeaderboardAndStreak";
import { profileService } from "@/lib/services/profile.service";

export default function SubmoduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const submoduleId = Number(params.submoduleId);
  const [submoduleData, setSubmoduleData] =
    useState<SubModuleDetailResponse | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [currentContent, setCurrentContent] = useState<ContentDetail | null>(
    null
  );
  const [selectedContentId, setSelectedContentId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [pastSubmissions, setPastSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isFirstVideoView, setIsFirstVideoView] = useState(true);
  const [videoPlayedTime, setVideoPlayedTime] = useState(0);
  const [videoCanSeek, setVideoCanSeek] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [showLoadingNextDialog, setShowLoadingNextDialog] = useState(false);
  const [loadingNextContent, setLoadingNextContent] = useState(false);
  const [isAutoNavigating, setIsAutoNavigating] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(5);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const autoNavigateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedSubmissionsIdRef = useRef<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showToast } = useToast();

  useEffect(() => {
    if (!courseId || !submoduleId) return;
    loadSubmoduleData();
    loadCourseDetail();
  }, [courseId, submoduleId]);

  // Preserve selectedContentId on refresh using URL search params
  useEffect(() => {
    if (submoduleData && submoduleData.data.length > 0) {
      // Try to get contentId from URL search params
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const contentIdParam = searchParams.get("contentId");

        if (contentIdParam) {
          const contentId = Number(contentIdParam);
          const contentExists = submoduleData.data.some(
            (item) => item.id === contentId
          );
          if (contentExists && contentId !== selectedContentId) {
            handleContentSelect(contentId);
            return; // Don't auto-select first if we found a valid contentId
          }
        }
      }

      // Only auto-select first content if no content is selected and no contentId in URL
      if (!selectedContentId) {
        const firstContent = submoduleData.data[0];
        handleContentSelect(firstContent.id);
      }
    }
  }, [submoduleData]);

  useEffect(() => {
    if (selectedContentId) {
      // Reset flags when content changes to prevent infinite loop
      setIsAutoNavigating(false);

      const currentItem = submoduleData?.data.find(
        (item) => item.id === selectedContentId
      );
      if (currentItem?.content_type === "VideoTutorial") {
        // loadContentDetail will load comments, so no need to call loadComments separately
        loadContentDetail(selectedContentId);
      } else {
        loadContentDetail(selectedContentId);
        setComments([]);
      }
      // Load past submissions for quiz/assignment (CodingProblem handles its own)

      if (
        currentItem &&
        (currentItem.content_type === "Quiz" ||
          currentItem.content_type === "Assignment") &&
        lastFetchedSubmissionsIdRef.current !== selectedContentId
      ) {
        lastFetchedSubmissionsIdRef.current = selectedContentId;
        loadPastSubmissions(selectedContentId);
      } else if (currentItem?.content_type === "CodingProblem") {
        // Reset the ref for coding problems so if we switch back to a quiz it triggers
        lastFetchedSubmissionsIdRef.current = null;
      }
      // Check if this is the first video view (only if not completed)
      if (currentItem?.content_type === "VideoTutorial") {
        const isCompleted = currentItem.status === "complete";
        setIsFirstVideoView(!isCompleted);
        setVideoPlayedTime(0);
        setVideoCanSeek(isCompleted); // Allow seeking if already completed
        setVideoCompleted(isCompleted);
      } else {
        setIsFirstVideoView(false);
        setVideoCanSeek(true);
        setVideoCompleted(false);
      }

      // Track view activity for Article content
      if (currentItem?.content_type === "Article" && selectedContentId) {
        trackActivity(selectedContentId, "view").catch((error) => {
          // Error tracking article view
        });
      }
      // View activity tracking removed - only track start and complete
    }
  }, [selectedContentId]);

  // Sync sidebar submission count with pastSubmissions
  useEffect(() => {
    if (selectedContentId && submoduleData && !loadingSubmissions) {
      const currentItem = submoduleData.data.find(
        (item) => item.id === selectedContentId
      );
      if (
        currentItem &&
        (currentItem.content_type === "Quiz" ||
          currentItem.content_type === "Assignment") &&
        currentItem.submissions !== pastSubmissions.length
      ) {
        // Update the submission count to match the actual number of past submissions
        setSubmoduleData((prevData) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            data: prevData.data.map((item) =>
              item.id === selectedContentId
                ? { ...item, submissions: pastSubmissions.length }
                : item
            ),
          };
        });
      }
    }
  }, [pastSubmissions.length, selectedContentId, loadingSubmissions]);

  // Track video playback time and enable seeking after watching for a while
  useEffect(() => {
    if (
      isFirstVideoView &&
      !videoCanSeek &&
      currentContent?.content_type === "VideoTutorial"
    ) {
      // Start timer when video starts playing
      const timer = setInterval(() => {
        setVideoPlayedTime((prev) => {
          const newTime = prev + 1;
          // Enable seeking after watching for 30 seconds
          if (newTime >= 30) {
            setVideoCanSeek(true);
            setIsFirstVideoView(false);
            clearInterval(timer);
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isFirstVideoView, videoCanSeek, currentContent?.content_type]);

  // Cleanup auto-navigate timer when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      if (autoNavigateTimerRef.current) {
        clearInterval(autoNavigateTimerRef.current);
        autoNavigateTimerRef.current = null;
      }
    };
  }, []);

  // Clear timer when dialog is closed
  useEffect(() => {
    if (!showLoadingNextDialog && autoNavigateTimerRef.current) {
      clearInterval(autoNavigateTimerRef.current);
      autoNavigateTimerRef.current = null;
    }
  }, [showLoadingNextDialog]);

  // Video completion is now handled by the VideoPlayer component via onVideoComplete callback

  const loadSubmoduleData = async (
    preserveSelectedContent = false
  ): Promise<SubModuleDetailResponse | null> => {
    try {
      if (!preserveSelectedContent) {
        setLoading(true);
      }

      const currentSelectedId = preserveSelectedContent
        ? selectedContentId
        : null;

      const data = await coursesService.getSubModuleWithContents(
        courseId,
        submoduleId
      );
      setSubmoduleData(data);

      if (preserveSelectedContent && currentSelectedId) {
        setSelectedContentId(currentSelectedId);
      }

      return data;
    } catch (error: any) {
      showToast("Failed to load submodule data", "error");
      return null;
    } finally {
      if (!preserveSelectedContent) {
        setLoading(false);
      }
    }
  };

  const loadCourseDetail = async () => {
    try {
      const data = await coursesService.getCourseDetail(courseId);
      setCourseDetail(data);
    } catch (error) {
      // Error loading course detail
    }
  };

  const loadContentDetail = async (contentId: number) => {
    try {
      setContentLoading(true);
      const data = await coursesService.getContentDetail(courseId, contentId);
      setCurrentContent(data);
      // Load comments only for VideoTutorial content type
      if (data.content_type === "VideoTutorial") {
        // Try to fetch comments directly from API
        try {
          const commentsData = await coursesService.getComments(
            courseId,
            contentId
          );
          setComments(commentsData || []);
        } catch (commentError) {
          // If direct comment fetch fails, use comments from content detail if available
          if ((data as any).comments) {
            setComments((data as any).comments || []);
          } else {
            setComments([]);
          }
        }
      } else {
        // Clear comments for non-video content
        setComments([]);
      }
    } catch (error: any) {
      showToast("Failed to load content", "error");
    } finally {
      setContentLoading(false);
    }
  };

  const loadComments = async (contentId: number) => {
    try {
      // Only load comments for VideoTutorial content type
      const currentItem = submoduleData?.data.find(
        (item) => item.id === contentId
      );
      if (currentItem?.content_type === "VideoTutorial") {
        // Try to fetch comments directly from API
        try {
          const commentsData = await coursesService.getComments(
            courseId,
            contentId
          );
          setComments(commentsData || []);
        } catch (commentError) {
          // If direct comment fetch fails, check if currentContent has comments
          if (currentContent && (currentContent as any).comments) {
            setComments((currentContent as any).comments || []);
          } else {
            setComments([]);
          }
        }
      } else {
        setComments([]);
      }
    } catch (error) {
      setComments([]);
    }
  };

  // Reload comments without setting contentLoading (to avoid video pause)
  const reloadCommentsOnly = async (contentId: number) => {
    try {
      // Try to fetch comments directly first
      try {
        const commentsData = await coursesService.getComments(
          courseId,
          contentId
        );
        setComments(commentsData || []);
      } catch (commentError) {
        // If direct comment fetch fails, fall back to getContentDetail
        const data = await coursesService.getContentDetail(courseId, contentId);
        if ((data as any).comments) {
          setComments((data as any).comments || []);
        } else {
          setComments([]);
        }
        // Also update currentContent silently to keep it in sync
        setCurrentContent(data);
      }
    } catch (error) {
      // Silently fail - comments will show the optimistic update
    }
  };

  const loadPastSubmissions = async (contentId: number) => {
    try {
      setLoadingSubmissions(true);
      const data = await coursesService.getPastSubmissions(courseId, contentId);
      setPastSubmissions(data || []);
    } catch (error) {
      setPastSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const trackActivity = async (
    contentId: number,
    activityType: "view" | "start" | "complete"
  ) => {
    try {
      if (!submoduleData || !submoduleData.data) {
        return;
      }

      const currentItem = submoduleData.data.find(
        (item) => item.id === contentId
      );

      if (!currentItem) {
        return;
      }

      // Use content type as activity_type (e.g., "VideoTutorial", "Quiz")
      const result = await coursesService.createUserActivity(
        courseId,
        contentId,
        currentItem.content_type,
        { activity_type: activityType }
      );

      return result;
    } catch (error) {
      // Error tracking activity
      throw error; // Re-throw to allow caller to handle
    }
  };

  // Refresh streak data after content completion
  const refreshStreakAfterCompletion = async () => {
    try {
      // Invalidate cache to force fresh data
      invalidateStreakCache();
      
      // Get current month in YYYY-MM format
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;
      
      // Fetch fresh streak data
      await profileService.getMonthlyStreak(monthStr);
      
      // Dispatch event to notify MainLayout and AppBar to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("submodule-complete"));
      }
    } catch (error) {
      // Silently fail - streak update is not critical
      // Still dispatch event so UI can refresh if possible
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("submodule-complete"));
      }
    }
  };

  // Check if all submodule content is completed and trigger streak check
  const checkSubmoduleCompletion = (data?: SubModuleDetailResponse | null) => {
    const dataToCheck = data || submoduleData;
    if (!dataToCheck || !dataToCheck.data || dataToCheck.data.length === 0) {
      return;
    }

    const allCompleted = dataToCheck.data.every(
      (item) => item.status === "complete"
    );

    if (allCompleted && typeof window !== "undefined") {
      // Dispatch event to trigger streak congratulations modal
      window.dispatchEvent(new CustomEvent("submodule-complete"));
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedContentId) return;

    // Only allow comments for VideoTutorial content type
    const currentItem = submoduleData?.data.find(
      (item) => item.id === selectedContentId
    );
    if (currentItem?.content_type !== "VideoTutorial") {
      showToast("Comments are only available for videos", "info");
      return;
    }

    try {
      setSubmittingComment(true);
      await coursesService.addComment(courseId, selectedContentId, newComment);
      setNewComment("");
      showToast("Comment added successfully", "success");

      // Reload comments without setting contentLoading to avoid video pause
      // This ensures comments are persisted and displayed correctly after refresh
      await reloadCommentsOnly(selectedContentId);
    } catch (error: any) {
      showToast(
        error.response?.data?.detail ||
          error.response?.data?.comment?.[0] ||
          error.response?.data?.message ||
          "Failed to add comment",
        "error"
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleContentSelect = (contentId: number) => {
    setSelectedContentId(contentId);
    // Update URL to preserve state on refresh
    const url = new URL(window.location.href);
    url.searchParams.set("contentId", contentId.toString());
    window.history.replaceState({}, "", url.toString());
  };

  const handleNavigateContent = (direction: "next" | "previous") => {
    if (!currentContent || !submoduleData) {
      showToast("Cannot navigate: Content not loaded", "error");
      return;
    }

    // Use next_content/previous_content from currentContent if available
    let targetContent =
      direction === "next"
        ? currentContent.next_content
        : currentContent.previous_content;

    // Fallback: Find next/previous from submoduleData if next_content is not available
    if (!targetContent && submoduleData.data.length > 0) {
      const currentIndex = submoduleData.data.findIndex(
        (item) => item.id === currentContent.id
      );

      if (currentIndex !== -1) {
        if (
          direction === "next" &&
          currentIndex < submoduleData.data.length - 1
        ) {
          const nextItem = submoduleData.data[currentIndex + 1];
          targetContent = {
            id: nextItem.id,
            content_type: nextItem.content_type || "VideoTutorial",
          };
        } else if (direction === "previous" && currentIndex > 0) {
          const prevItem = submoduleData.data[currentIndex - 1];
          targetContent = {
            id: prevItem.id,
            content_type: prevItem.content_type || "VideoTutorial",
          };
        }
      }
    }

    if (targetContent && targetContent.id) {
      handleContentSelect(targetContent.id);
    } else {
      showToast(
        direction === "next"
          ? "No next content available"
          : "No previous content available",
        "info"
      );
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case "VideoTutorial":
        return "mdi:play-circle-outline";
      case "Quiz":
        return "mdi:clipboard-text-outline";
      case "Article":
        return "mdi:file-document-outline";
      case "Assignment":
        return "mdi:file-check-outline";
      case "CodingProblem":
        return "mdi:code-braces";
      default:
        return "mdi:file-document-outline";
    }
  };

  const getContentColor = (contentType: string) => {
    switch (contentType) {
      case "VideoTutorial":
        return "#ef4444";
      case "Quiz":
        return "#f59e0b";
      case "Article":
        return "#3b82f6";
      case "Assignment":
        return "#8b5cf6";
      case "CodingProblem":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <MainLayout hideSidebar={!isMobile} fullPage DrawerWidth={0}>
        <Loading fullScreen />
      </MainLayout>
    );
  }

  if (!loading && (!submoduleData || !courseDetail)) {
    return (
      <MainLayout hideSidebar={!isMobile} fullPage DrawerWidth={0}>
        <Box sx={{ p: 3 }}>
          {" "}
          <Loading fullScreen />
        </Box>
      </MainLayout>
    );
  }

  // Early return if data is not loaded
  if (!submoduleData || !courseDetail) {
    return null;
  }

  const currentIndex =
    submoduleData.data.findIndex((item) => item.id === selectedContentId) + 1;
  const totalContents = submoduleData.data.length;

  return (
    <MainLayout hideSidebar={!isMobile} fullPage DrawerWidth={0}>
      <Box
        sx={{
          display: "flex",
          height: "100%",
          maxHeight: "100%",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            sx={{
              width: 300,
              flexShrink: 0,
              height: "100%",
            }}
          >
            <SubmoduleSidebar
              courseDetail={courseDetail}
              submoduleName={submoduleData.submoduleName}
              moduleName={submoduleData.moduleName}
              contentItems={submoduleData.data}
              selectedContentId={selectedContentId}
              activeTab={activeTab}
              courseId={courseId}
              onTabChange={setActiveTab}
              onContentSelect={(contentId) => {
                handleContentSelect(contentId);
              }}
              getContentIcon={getContentIcon}
              getContentColor={getContentColor}
              formatDuration={formatDuration}
            />
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: "85%",
              maxWidth: 360,
            },
          }}
        >
          <SubmoduleSidebar
            courseDetail={courseDetail}
            submoduleName={submoduleData.submoduleName}
            moduleName={submoduleData.moduleName}
            contentItems={submoduleData.data}
            selectedContentId={selectedContentId}
            activeTab={activeTab}
            courseId={courseId}
            onTabChange={setActiveTab}
            onContentSelect={(contentId) => {
              handleContentSelect(contentId);
              setMobileDrawerOpen(false); // Close drawer after selection
            }}
            getContentIcon={getContentIcon}
            getContentColor={getContentColor}
            formatDuration={formatDuration}
          />
        </Drawer>

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0, // Prevents flex item from overflowing
          }}
        >
          {/* Content Header */}
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: { xs: 1.5, sm: 2 },
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              backgroundColor: "#ffffff",
              minHeight: { xs: "60px", sm: "72px" },
            }}
          >
            {/* TEST BUTTON - Remove after testing */}
            {currentContent?.content_type === "VideoTutorial" &&
              currentContent?.next_content && (
                <Button
                  onClick={() => {
                    setShowLoadingNextDialog(true);
                    setAutoRedirectCountdown(5);
                  }}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 2 }}
                >
                  TEST Dialog
                </Button>
              )}
            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileDrawerOpen(true)}
                size="small"
                sx={{
                  mr: 1,
                  flexShrink: 0,
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                  },
                }}
              >
                <IconWrapper icon="mdi:menu" size={24} color="#1a1f2e" />
              </IconButton>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                  {submoduleData.weekNo && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        backgroundColor: "#eef2ff",
                      }}
                    >
                      <IconWrapper
                        icon="mdi:calendar-week"
                        size={14}
                        color="#6366f1"
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6366f1",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      >
                        Week {submoduleData.weekNo}
                      </Typography>
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#6b7280",
                      fontSize: "0.75rem",
                    }}
                  >
                    Content {currentIndex} of {totalContents}
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#1a1f2e",
                    mt: 0.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: { xs: "0.95rem", sm: "1.25rem" },
                  }}
                >
                  {currentContent?.content_title || submoduleData.submoduleName}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}
            >
              <IconButton
                onClick={() => handleNavigateContent("previous")}
                disabled={
                  !(!!currentContent?.previous_content || currentIndex > 1)
                }
                size="small"
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  "&:hover": {
                    backgroundColor: "#f9fafb",
                  },
                  "&:disabled": {
                    opacity: 0.3,
                    cursor: "not-allowed",
                  },
                }}
              >
                <IconWrapper icon="mdi:chevron-left" size={20} />
              </IconButton>
              <IconButton
                onClick={() => handleNavigateContent("next")}
                disabled={
                  !(
                    !!currentContent?.next_content ||
                    currentIndex < totalContents
                  )
                }
                size="small"
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  "&:hover": {
                    backgroundColor: "#f9fafb",
                  },
                  "&:disabled": {
                    opacity: 0.3,
                    cursor: "not-allowed",
                  },
                }}
              >
                <IconWrapper icon="mdi:chevron-right" size={20} />
              </IconButton>
            </Box>
          </Box>

          {/* Content Viewer */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              p: { xs: 1, sm: 2, md: 3 },
              backgroundColor: "#f9fafb",
              minHeight: 0, // Allows flex child to shrink below content size
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#cbd5e1",
                borderRadius: "3px",
                "&:hover": {
                  backgroundColor: "#94a3b8",
                },
              },
            }}
          >
            {contentLoading ? (
              <Loading />
            ) : currentContent ? (
              <SubmoduleContentViewer
                content={currentContent}
                currentItem={submoduleData?.data.find(
                  (item) => item.id === selectedContentId
                )}
                courseId={courseId}
                isFirstVideoView={isFirstVideoView}
                videoCanSeek={videoCanSeek}
                pastSubmissions={pastSubmissions}
                loadingSubmissions={loadingSubmissions}
                comments={comments}
                newComment={newComment}
                submittingComment={submittingComment}
                onCommentChange={setNewComment}
                onSubmitComment={handleSubmitComment}
                onVideoStart={async () => {
                  if (selectedContentId) {
                    // Start activity tracking removed - only track complete
                    if (isFirstVideoView && !videoCanSeek) {
                      setVideoPlayedTime(0);
                    }
                  }
                }}
                onVideoComplete={async () => {
                  if (!selectedContentId) {
                    return;
                  }

                  // Always call activity endpoint when video completes
                  // This ensures the backend is notified of completion
                  try {
                    await trackActivity(selectedContentId, "complete");
                    // Refresh streak data immediately after completion
                    await refreshStreakAfterCompletion();
                  } catch (error) {
                    // Failed to track video completion activity
                    // Don't return early - still try to reload content
                    // Still try to refresh streak even if activity tracking failed
                    await refreshStreakAfterCompletion();
                  }

                  // Store the next content ID BEFORE any operations
                  const nextContentId = currentContent?.next_content?.id;

                  // Update local state without full reload
                  if (selectedContentId && submoduleData) {
                    const updatedData = {
                      ...submoduleData,
                      data: [...submoduleData.data],
                    };
                    const itemIndex = updatedData.data.findIndex(
                      (item) => item.id === selectedContentId
                    );
                    if (itemIndex !== -1) {
                      updatedData.data[itemIndex] = {
                        ...updatedData.data[itemIndex],
                        status: "complete",
                      };
                      setSubmoduleData(updatedData);
                      // Check if all content is completed
                      checkSubmoduleCompletion(updatedData);
                    }
                  }
                  setVideoCompleted(true);

                  // Auto-continue to next content if available

                  // Only auto-navigate if we're not already navigating and there's a next content
                  if (nextContentId && !isAutoNavigating) {
                    setIsAutoNavigating(true);
                    // Show next content dialog
                    setShowLoadingNextDialog(true);
                    setAutoRedirectCountdown(5);

                    // Clear any existing timer
                    if (autoNavigateTimerRef.current) {
                      clearInterval(autoNavigateTimerRef.current);
                    }

                    // Start countdown timer
                    let countdown = 5;
                    autoNavigateTimerRef.current = setInterval(() => {
                      countdown -= 1;
                      setAutoRedirectCountdown(countdown);

                      if (countdown <= 0) {
                        if (autoNavigateTimerRef.current) {
                          clearInterval(autoNavigateTimerRef.current);
                          autoNavigateTimerRef.current = null;
                        }
                        // Navigate to next content
                        try {
                          handleContentSelect(nextContentId);
                        } catch (error) {
                          // Failed to load next content
                          showToast("Failed to load next content", "error");
                        } finally {
                          // Close dialog and reset flag after navigation
                          setTimeout(() => {
                            setShowLoadingNextDialog(false);
                            setIsAutoNavigating(false);
                          }, 300);
                        }
                      }
                    }, 1000);
                  }
                }}
                onStartQuiz={async () => {
                  // Start activity tracking removed - only track complete
                  // Quiz will start on the same page via QuizContent component
                }}
                onQuizComplete={async (obtainedMarks?: number) => {
                  if (selectedContentId) {
                    lastFetchedSubmissionsIdRef.current = null;
                    await loadPastSubmissions(selectedContentId);

                    invalidateStreakCache();
                    const updatedData = await loadSubmoduleData(true);
                    
                    // Refresh streak data immediately after quiz completion
                    await refreshStreakAfterCompletion();
                    
                    if (updatedData) {
                      checkSubmoduleCompletion(updatedData);
                    }
                  }
                }}
                onStartAssignment={() => {
                  router.push(
                    `/courses/${courseId}/content/${currentContent.id}/assignment`
                  );
                }}
                onCodeChange={(value) => {
                  // Code changed
                }}
                onResetCode={() => {
                  // Reset code
                }}
                onSubmitCode={() => {
                  // Submit code
                }}
                onArticleComplete={async () => {
                  if (!selectedContentId) {
                    return;
                  }

                  try {
                    // Track article completion activity
                    await trackActivity(selectedContentId, "complete");
                    // Refresh streak data immediately after completion
                    await refreshStreakAfterCompletion();

                    // Update local state without full reload
                    if (submoduleData) {
                      const updatedData = {
                        ...submoduleData,
                        data: [...submoduleData.data],
                      };
                      const itemIndex = updatedData.data.findIndex(
                        (item) => item.id === selectedContentId
                      );
                      if (itemIndex !== -1) {
                        updatedData.data[itemIndex] = {
                          ...updatedData.data[itemIndex],
                          status: "complete",
                        };
                        setSubmoduleData(updatedData);
                        // Check if all content is completed after state update
                        setTimeout(() => {
                          checkSubmoduleCompletion();
                        }, 100);
                      }
                    }
                  } catch (error) {
                    // Failed to track article completion
                    // Still try to refresh streak even if activity tracking failed
                    await refreshStreakAfterCompletion();
                  }
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Select a content item to view
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Next Content Dialog */}
      <Dialog
        open={showLoadingNextDialog}
        onClose={() => {
          // Dialog close prevented
        }} // Prevent closing
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: { xs: "90%", sm: 400 },
            maxWidth: 500,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
            pb: 2,
            pt: 3,
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box
            sx={{
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              borderRadius: "50%",
              backgroundColor: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:check" size={28} color="#ffffff" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1a1f2e",
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              Video Completed!
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
              }}
            >
              Great job finishing this content
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 3, px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 2, sm: 3 },
            }}
          >
            {currentContent?.next_content && (
              <Box
                sx={{
                  backgroundColor: "#f9fafb",
                  borderRadius: 2,
                  p: { xs: 2, sm: 2.5 },
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#6b7280",
                    mb: 1,
                    fontWeight: 500,
                  }}
                >
                  Up Next:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1, sm: 1.5 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      borderRadius: 1,
                      backgroundColor: getContentColor(
                        currentContent.next_content.content_type
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper
                      icon={getContentIcon(
                        currentContent.next_content.content_type
                      )}
                      size={18}
                      color="#ffffff"
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#1a1f2e",
                        mb: 0.25,
                        fontSize: { xs: "0.85rem", sm: "0.875rem" },
                      }}
                    >
                      {currentContent.next_content.content_type}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6b7280",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      }}
                    >
                      Auto-starting in {autoRedirectCountdown} seconds...
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => {
                // Clear the auto-navigate timer
                if (autoNavigateTimerRef.current) {
                  clearInterval(autoNavigateTimerRef.current);
                  autoNavigateTimerRef.current = null;
                }

                if (currentContent?.next_content?.id) {
                  handleContentSelect(currentContent.next_content.id);
                  setShowLoadingNextDialog(false);
                  setIsAutoNavigating(false);
                }
              }}
              sx={{
                backgroundColor: "#6366f1",
                textTransform: "none",
                fontWeight: 600,
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: "0.9rem", sm: "1rem" },
                "&:hover": {
                  backgroundColor: "#4f46e5",
                },
              }}
            >
              Continue to Next Content
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
