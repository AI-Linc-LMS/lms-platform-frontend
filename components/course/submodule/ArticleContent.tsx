"use client";

import { Paper, Typography, Box, Chip, LinearProgress, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ContentDetail } from "@/lib/services/courses.service";
import { useEffect, useRef, useState } from "react";
import { AccessTime, CheckCircleOutline } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Heuristic: content that looks like markdown (headers, code fences, etc.) vs HTML */
function looksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (/^<[a-z][\s\S]*>/i.test(trimmed)) return false; // starts with HTML tag
  if (trimmed.includes("## ") || trimmed.includes("### ") || trimmed.includes("```")) return true;
  if (/^\s*[-*]\s+/m.test(trimmed) || /^\s*\d+\.\s+/m.test(trimmed)) return true; // list
  if (/\*\*[^*]+\*\*/.test(trimmed)) return true; // bold
  return false;
}

const articleBodySx = {
  "& h1": {
    color: "var(--font-primary)",
    fontWeight: 700,
    fontSize: "2rem",
    mb: 2,
    mt: 0,
  },
  "& h2": {
    color: "var(--font-primary)",
    fontWeight: 600,
    fontSize: "1.5rem",
    mt: 3,
    mb: 1.5,
  },
  "& h3": {
    color: "var(--font-primary)",
    fontWeight: 600,
    fontSize: "1.25rem",
    mt: 2,
    mb: 1,
  },
  "& h4, & h5, & h6": {
    color: "var(--font-primary)",
    fontWeight: 600,
    mt: 2,
    mb: 1,
  },
  "& p": {
    color: "var(--font-secondary)",
    lineHeight: 1.8,
    mb: 1.5,
    fontSize: "1rem",
  },
  "& ul, & ol": {
    color: "var(--font-secondary)",
    pl: 3,
    mb: 1.5,
    lineHeight: 1.8,
  },
  "& li": { mb: 0.75 },
  "& a": {
    color: "var(--accent-indigo)",
    textDecoration: "none",
    "&:hover": { textDecoration: "underline" },
  },
  "& img": {
    maxWidth: "100%",
    height: "auto",
    borderRadius: 1,
    mb: 2,
    mt: 2,
  },
  "& blockquote": {
    borderInlineStart: "4px solid var(--accent-indigo)",
    paddingInlineStart: 16,
    marginInlineStart: 0,
    fontStyle: "italic",
    color: "var(--font-secondary)",
    mb: 2,
  },
  "& code": {
    backgroundColor: "var(--surface)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontFamily: "monospace",
    color: "var(--font-primary)",
  },
  "& pre": {
    backgroundColor: "color-mix(in srgb, var(--surface) 55%, var(--background) 45%)",
    color: "var(--font-primary)",
    padding: 2,
    borderRadius: 1,
    overflowX: "auto",
    mb: 2,
    "& code": {
      backgroundColor: "transparent",
      padding: 0,
      color: "var(--font-primary)",
    },
  },
  "& table": {
    width: "100%",
    borderCollapse: "collapse",
    mb: 2,
  },
  "& th, & td": {
    border: "1px solid var(--border-default)",
    padding: 1,
    textAlign: "start",
  },
  "& th": {
    backgroundColor: "var(--surface)",
    fontWeight: 600,
    color: "var(--font-primary)",
  },
} as const;

interface ArticleContentProps {
  content: ContentDetail;
  courseId: number;
  onArticleComplete?: () => void;
  /** When true, article is already completed (e.g. from progress); hide "Mark as read" and show completed state */
  isCompleted?: boolean;
}

export function ArticleContent({ 
  content, 
  courseId,
  onArticleComplete,
  isCompleted = false,
}: ArticleContentProps) {
  const { t } = useTranslation("common");
  const articleRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const readingTimeMinutes = content.details?.reading_time_minutes || 
    Math.ceil((content.details?.content?.length || 0) / 1000) || 5; // Estimate: 1000 chars per minute

  // Track scroll progress only (for progress bar). Do not auto-mark as complete.
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
      } else {
        setReadProgress(100);
      }
    };

    handleScroll();
    articleElement.addEventListener("scroll", handleScroll);
    return () => articleElement.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMarkAsRead = () => {
    if (hasMarkedComplete || !onArticleComplete) return;
    setHasMarkedComplete(true);
    setReadProgress(100);
    onArticleComplete();
  };

  const articleContent = content.details?.content || content.details?.description || "";
  const isMarkdown = articleContent ? looksLikeMarkdown(articleContent) : false;

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
              backgroundColor: "var(--border-default)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 2,
                backgroundColor: "var(--accent-indigo)",
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", mt: 0.5, display: "block" }}
          >
            {Math.round(readProgress)}% read
          </Typography>
        </Box>
      )}

      {/* Reading Time Chip + Mark as read */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Chip
          icon={<AccessTime sx={{ fontSize: 16 }} />}
          label={t("courses.minRead", { count: readingTimeMinutes })}
          size="small"
          sx={{
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
            color: "var(--accent-indigo)",
            fontWeight: 500,
          }}
        />
        {(isCompleted || hasMarkedComplete) ? (
          <Chip
            icon={<CheckCircleOutline sx={{ fontSize: 16 }} />}
            label="Completed"
            size="small"
            sx={{
              backgroundColor:
                "color-mix(in srgb, var(--success-500) 16%, var(--surface) 84%)",
              color: "var(--success-500)",
              fontWeight: 500,
            }}
          />
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CheckCircleOutline />}
            onClick={handleMarkAsRead}
            sx={{
              borderColor: "var(--success-500)",
              color: "var(--success-500)",
              "&:hover": {
                borderColor:
                  "color-mix(in srgb, var(--success-500) 80%, var(--font-primary) 20%)",
                backgroundColor:
                  "color-mix(in srgb, var(--success-500) 8%, transparent)",
              },
            }}
          >
            {t("courses.markAsRead")}
          </Button>
        )}
      </Box>

      {/* Article Content */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: "var(--card-bg)",
          borderRadius: 2,
          border: "1px solid var(--border-default)",
          maxHeight: "70vh",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "var(--surface)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "var(--border-default)",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor:
                "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
            },
          },
        }}
        ref={articleRef}
      >
        {articleContent ? (
          <Box sx={articleBodySx}>
            {isMarkdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {articleContent}
              </ReactMarkdown>
            ) : (
              <Box
                component="div"
                dangerouslySetInnerHTML={{ __html: articleContent }}
              />
            )}
          </Box>
        ) : (
          <Typography variant="body1" sx={{ color: "var(--font-secondary)" }}>
            No content available for this article.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

