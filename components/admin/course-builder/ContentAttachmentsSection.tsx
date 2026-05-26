"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminCourseBuilderService,
  type ContentAttachment,
  type ContentAttachmentType,
} from "@/lib/services/admin/admin-course-builder.service";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { AttachmentPreview } from "./AttachmentPreview";

const ACCEPT_TYPES =
  ".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,application/pdf,image/*";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const TYPE_META: Record<
  ContentAttachmentType,
  { icon: string; color: string; label: string }
> = {
  pdf: { icon: "mdi:file-pdf-box", color: "var(--error-500)", label: "PDF" },
  image: { icon: "mdi:image", color: "var(--accent-purple)", label: "Image" },
  document: {
    icon: "mdi:file-word-box",
    color: "var(--accent-indigo)",
    label: "Document",
  },
  text: { icon: "mdi:file-document", color: "var(--success-500)", label: "Text" },
  other: { icon: "mdi:file", color: "var(--font-secondary)", label: "File" },
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

interface ContentAttachmentsSectionProps {
  courseId: number;
  contentId: number;
  readOnly?: boolean;
}

export function ContentAttachmentsSection({
  courseId,
  contentId,
  readOnly = false,
}: ContentAttachmentsSectionProps) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<ContentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentAttachment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAttachments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminCourseBuilderService.getContentAttachments(
        courseId,
        contentId
      );
      setAttachments(data);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to load attachments";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [courseId, contentId, showToast]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const handleUploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of arr) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`${file.name} exceeds 50 MB limit`, "error");
        continue;
      }
      try {
        await adminCourseBuilderService.uploadContentAttachment(
          courseId,
          contentId,
          file
        );
        ok++;
      } catch (error: unknown) {
        showToast(
          `${file.name}: ${
            error instanceof Error ? error.message : "upload failed"
          }`,
          "error"
        );
      }
    }
    setUploading(false);
    if (ok > 0) {
      showToast(
        `${ok} attachment${ok > 1 ? "s" : ""} uploaded`,
        "success"
      );
      loadAttachments();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminCourseBuilderService.deleteContentAttachment(
        courseId,
        contentId,
        deleteTarget.id
      );
      showToast("Attachment deleted", "success");
      if (expandedId === deleteTarget.id) setExpandedId(null);
      setDeleteTarget(null);
      loadAttachments();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete attachment",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper
            icon="mdi:paperclip"
            size={16}
            color="var(--font-secondary)"
          />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "var(--font-primary)" }}
          >
            Attachments
          </Typography>
          {attachments.length > 0 && (
            <Chip
              label={attachments.length}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.65rem",
                fontWeight: 600,
                bgcolor: "var(--surface)",
                color: "var(--font-secondary)",
              }}
            />
          )}
        </Box>
        {!readOnly && (
          <LoadingButton
            size="small"
            loading={uploading}
            loadingText={t("common.uploading")}
            startIcon={<IconWrapper icon="mdi:plus" size={14} />}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              color: "var(--accent-indigo)",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          >
            Add file
          </LoadingButton>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={18} />
        </Box>
      ) : attachments.length === 0 ? (
        <Typography
          variant="caption"
          sx={{
            color: "var(--font-tertiary)",
            fontStyle: "italic",
            display: "block",
            py: 1,
          }}
        >
          No attachments for this content
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {attachments.map((att) => {
            const meta = TYPE_META[att.file_type] || TYPE_META.other;
            const isExpanded = expandedId === att.id;
            const displayName =
              att.title?.trim() ||
              att.original_filename ||
              `Attachment #${att.id}`;
            return (
              <Box
                key={att.id}
                sx={{
                  border: "1px solid var(--border-default)",
                  borderRadius: 1.5,
                  overflow: "hidden",
                  bgcolor: "var(--card-bg)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "var(--surface)" },
                    transition: "background 0.15s",
                  }}
                  onClick={() =>
                    setExpandedId((prev) => (prev === att.id ? null : att.id))
                  }
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: `color-mix(in srgb, ${meta.color} 12%, var(--surface) 88%)`,
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper icon={meta.icon} size={18} color={meta.color} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "var(--font-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {displayName}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.25 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: meta.color, fontWeight: 600 }}
                      >
                        {meta.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                        · {formatBytes(att.file_size)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{ display: "flex", gap: 0.25, alignItems: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {att.file_url && (
                      <Tooltip title="Open in new tab">
                        <IconButton
                          size="small"
                          component="a"
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: "var(--font-secondary)" }}
                        >
                          <IconWrapper icon="mdi:open-in-new" size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {att.file_url && (
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          component="a"
                          href={att.file_url}
                          download={att.original_filename}
                          sx={{ color: "var(--font-secondary)" }}
                        >
                          <IconWrapper icon="mdi:download" size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={isExpanded ? "Hide preview" : "Show preview"}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setExpandedId((prev) =>
                            prev === att.id ? null : att.id
                          )
                        }
                        sx={{ color: "var(--accent-indigo)" }}
                      >
                        <IconWrapper
                          icon={isExpanded ? "mdi:eye-off" : "mdi:eye"}
                          size={16}
                        />
                      </IconButton>
                    </Tooltip>
                    {!readOnly && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(att)}
                          sx={{ color: "var(--error-500)" }}
                        >
                          <IconWrapper icon="mdi:delete" size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                {isExpanded && (
                  <Box
                    sx={{
                      borderTop: "1px solid var(--border-default)",
                      p: 1.5,
                      bgcolor: "var(--surface)",
                    }}
                  >
                    <AttachmentPreview attachment={att} />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Delete attachment"
        message={`Are you sure you want to delete "${
          deleteTarget?.title || deleteTarget?.original_filename || ""
        }"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </Box>
  );
}
