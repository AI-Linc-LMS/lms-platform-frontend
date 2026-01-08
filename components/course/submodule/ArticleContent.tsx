"use client";

import { Paper, Typography, Box, Chip, LinearProgress } from "@mui/material";
import { ContentDetail } from "@/lib/services/courses.service";
import { useEffect, useRef, useState } from "react";
import { AccessTime } from "@mui/icons-material";

interface ArticleContentProps {
  content: ContentDetail;
  courseId: number;
  onArticleComplete?: () => void;
}

export function ArticleContent({ 
  content, 
  courseId,
  onArticleComplete 
}: ArticleContentProps) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const readingTimeMinutes = content.details?.reading_time_minutes || 
    Math.ceil((content.details?.content?.length || 0) / 1000) || 5; // Estimate: 1000 chars per minute

  // Track scroll progress and mark as complete when user scrolls to bottom
  useEffect(() => {
    const articleElement = articleRef.current;
    if (!articleElement) return;

    const handleScroll = () => {
      const scrollTop = articleElement.scrollTop;
      const scrollHeight = articleElement.scrollHeight;
      const clientHeight = articleElement.clientHeight;
      
      if (scrollHeight > clientHeight) {
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setReadProgress(Math.min(100, Math.max(0, progress)));
        
        // Mark as complete when user scrolls to 90% or more
        if (progress >= 90 && !hasMarkedComplete && onArticleComplete) {
          setHasMarkedComplete(true);
          onArticleComplete();
        }
      } else {
        // If content fits in viewport, mark as complete immediately
        if (!hasMarkedComplete && onArticleComplete) {
          setHasMarkedComplete(true);
          onArticleComplete();
        }
      }
    };

    // Check initial scroll position
    handleScroll();

    articleElement.addEventListener("scroll", handleScroll);
    return () => articleElement.removeEventListener("scroll", handleScroll);
  }, [hasMarkedComplete, onArticleComplete]);

  // Track view activity when component mounts
  useEffect(() => {
    if (!hasTrackedView && content.id) {
      // Track view activity - this will be handled by the parent component
      setHasTrackedView(true);
    }
  }, [content.id, hasTrackedView]);

  const articleContent = content.details?.content || content.details?.description || "";

  return (
    <Box sx={{ mb: 3 }}>
      {/* Reading Progress Indicator */}
      {readProgress > 0 && readProgress < 100 && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={readProgress}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: "#e5e7eb",
              "& .MuiLinearProgress-bar": {
                borderRadius: 2,
                backgroundColor: "#3b82f6",
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", mt: 0.5, display: "block" }}
          >
            {Math.round(readProgress)}% read
          </Typography>
        </Box>
      )}

      {/* Reading Time Chip */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Chip
          icon={<AccessTime sx={{ fontSize: 16 }} />}
          label={`${readingTimeMinutes} min read`}
          size="small"
          sx={{
            backgroundColor: "#eff6ff",
            color: "#1e40af",
            fontWeight: 500,
          }}
        />
        {hasMarkedComplete && (
          <Chip
            label="Completed"
            size="small"
            sx={{
              backgroundColor: "#d1fae5",
              color: "#065f46",
              fontWeight: 500,
            }}
          />
        )}
      </Box>

      {/* Article Content */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          maxHeight: "70vh",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f3f4f6",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#94a3b8",
            },
          },
        }}
        ref={articleRef}
      >
        {articleContent ? (
          <Box
            dangerouslySetInnerHTML={{
              __html: articleContent,
            }}
            sx={{
              "& h1": {
                color: "#1a1f2e",
                fontWeight: 700,
                fontSize: "2rem",
                mb: 2,
                mt: 0,
              },
              "& h2": {
                color: "#1a1f2e",
                fontWeight: 600,
                fontSize: "1.5rem",
                mt: 3,
                mb: 1.5,
              },
              "& h3": {
                color: "#1a1f2e",
                fontWeight: 600,
                fontSize: "1.25rem",
                mt: 2,
                mb: 1,
              },
              "& h4, & h5, & h6": {
                color: "#1a1f2e",
                fontWeight: 600,
                mt: 2,
                mb: 1,
              },
              "& p": {
                color: "#4b5563",
                lineHeight: 1.8,
                mb: 1.5,
                fontSize: "1rem",
              },
              "& ul, & ol": {
                color: "#4b5563",
                pl: 3,
                mb: 1.5,
                lineHeight: 1.8,
              },
              "& li": {
                mb: 0.75,
              },
              "& a": {
                color: "#3b82f6",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              },
              "& img": {
                maxWidth: "100%",
                height: "auto",
                borderRadius: 1,
                mb: 2,
                mt: 2,
              },
              "& blockquote": {
                borderLeft: "4px solid #3b82f6",
                pl: 2,
                ml: 0,
                fontStyle: "italic",
                color: "#6b7280",
                mb: 2,
              },
              "& code": {
                backgroundColor: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontFamily: "monospace",
                color: "#1a1f2e",
              },
              "& pre": {
                backgroundColor: "#1a1f2e",
                color: "#f9fafb",
                padding: 2,
                borderRadius: 1,
                overflowX: "auto",
                mb: 2,
                "& code": {
                  backgroundColor: "transparent",
                  padding: 0,
                  color: "#f9fafb",
                },
              },
              "& table": {
                width: "100%",
                borderCollapse: "collapse",
                mb: 2,
              },
              "& th, & td": {
                border: "1px solid #e5e7eb",
                padding: 1,
                textAlign: "left",
              },
              "& th": {
                backgroundColor: "#f9fafb",
                fontWeight: 600,
                color: "#1a1f2e",
              },
            }}
          />
        ) : (
          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            No content available for this article.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

