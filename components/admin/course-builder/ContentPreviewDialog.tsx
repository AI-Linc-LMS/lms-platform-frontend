"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  adminContentManagementService,
  ContentDetails,
} from "@/lib/services/admin/admin-content-management.service";
import { config } from "@/lib/config";
import { VideoTutorialView } from "@/components/admin/content-management/VideoTutorialView";
import { CodingProblemView } from "@/components/admin/content-management/CodingProblemView";
import { QuizView } from "@/components/admin/content-management/QuizView";
import { ArticleView } from "@/components/admin/content-management/ArticleView";
import { AssignmentView } from "@/components/admin/content-management/AssignmentView";
import {
  extractArticleBodyAndAttachments,
} from "@/lib/utils/articleAttachments";

function renderPreviewBody(content: ContentDetails, t: TFunction<"common">) {
  switch (content.type) {
    case "VideoTutorial":
      return <VideoTutorialView content={content} />;
    case "CodingProblem":
    case "DevCodingProblem":
      return <CodingProblemView content={content} />;
    case "Quiz":
      return <QuizView content={content} />;
    case "Article": {
      const raw = String(content.content_details?.content ?? "");
      const { body } = extractArticleBodyAndAttachments(raw);
      const patched: ContentDetails = {
        ...content,
        content_details: { ...content.content_details, content: body },
      };
      return <ArticleView content={patched} />;
    }
    case "Assignment":
      return <AssignmentView content={content} />;
    default:
      return (
        <Paper sx={{ p: 3, m: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {content.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("adminContentManagement.contentTypeNotSupported", {
              type: content.type,
            })}
          </Typography>
        </Paper>
      );
  }
}

interface ContentPreviewDialogProps {
  open: boolean;
  contentId: number | null;
  onClose: () => void;
}

export function ContentPreviewDialog({
  open,
  contentId,
  onClose,
}: ContentPreviewDialogProps) {
  const { t } = useTranslation("common");
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (contentId == null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminContentManagementService.getContentDetails(
        config.clientId,
        contentId
      );
      setContent(data);
    } catch (e: unknown) {
      setContent(null);
      setError(
        e instanceof Error ? e.message : t("adminContentManagement.failedToLoadContent")
      );
    } finally {
      setLoading(false);
    }
  }, [contentId, t]);

  useEffect(() => {
    if (!open || contentId == null) {
      setContent(null);
      setError(null);
      return;
    }
    void load();
  }, [open, contentId, load]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      aria-labelledby="content-preview-title"
    >
      <DialogTitle id="content-preview-title" sx={{ fontWeight: 700 }}>
        {content?.title ?? "Content preview"}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          p: 0,
          minHeight: 320,
          bgcolor: "#f9fafb",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : content ? (
          <Box sx={{ maxHeight: "70vh", overflow: "auto" }}>
            {renderPreviewBody(content, t)}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
