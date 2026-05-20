"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Chip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AttachmentPreview } from "@/components/admin/course-builder/AttachmentPreview";
import type { ContentAttachmentInfo } from "@/lib/services/courses.service";
import type { ContentAttachmentType } from "@/lib/services/admin/admin-course-builder.service";

interface LessonAttachmentsProps {
  attachments: ContentAttachmentInfo[];
}

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
  text: {
    icon: "mdi:file-document",
    color: "var(--success-500)",
    label: "Text",
  },
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

/** Types that have a usable inline preview and should auto-expand on the student view. */
const AUTO_EXPAND_TYPES = new Set<ContentAttachmentType>([
  "pdf",
  "image",
  "text",
  "document",
]);

export function LessonAttachments({ attachments }: LessonAttachmentsProps) {
  const { t } = useTranslation("common");
  // Default: every renderable attachment is expanded. Users can collapse with the eye icon.
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const isExpanded = (att: ContentAttachmentInfo) =>
    AUTO_EXPAND_TYPES.has(att.file_type) && !collapsedIds.has(att.id);

  const toggle = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 3,
        p: { xs: 2, sm: 3 },
        backgroundColor: "var(--card-bg)",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconWrapper
          icon="mdi:paperclip"
          size={20}
          color="var(--font-secondary)"
        />
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "var(--font-primary)" }}
        >
          {t("courses.attachedFiles", { defaultValue: "Attached files" })}
        </Typography>
        <Chip
          label={attachments.length}
          size="small"
          sx={{
            height: 22,
            fontSize: "0.7rem",
            fontWeight: 600,
            bgcolor: "var(--surface)",
            color: "var(--font-secondary)",
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {attachments.map((att) => {
          const meta = TYPE_META[att.file_type] || TYPE_META.other;
          const expanded = isExpanded(att);
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
                  py: 1.25,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "var(--surface)" },
                  transition: "background 0.15s",
                }}
                onClick={() => toggle(att.id)}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: `color-mix(in srgb, ${meta.color} 12%, var(--surface) 88%)`,
                    flexShrink: 0,
                  }}
                >
                  <IconWrapper icon={meta.icon} size={22} color={meta.color} />
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
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      mt: 0.25,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: meta.color, fontWeight: 600 }}
                    >
                      {meta.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-tertiary)" }}
                    >
                      · {formatBytes(att.file_size)}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{ display: "flex", gap: 0.25, alignItems: "center" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {att.file_url && (
                    <Tooltip
                      title={t("courses.openInNewTab", {
                        defaultValue: "Open in new tab",
                      })}
                    >
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
                    <Tooltip
                      title={t("courses.download", { defaultValue: "Download" })}
                    >
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
                  <Tooltip
                    title={
                      expanded
                        ? t("courses.hidePreview", {
                            defaultValue: "Hide preview",
                          })
                        : t("courses.showPreview", {
                            defaultValue: "Show preview",
                          })
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={() => toggle(att.id)}
                      sx={{ color: "var(--accent-indigo)" }}
                    >
                      <IconWrapper
                        icon={expanded ? "mdi:eye-off" : "mdi:eye"}
                        size={16}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {expanded && (
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
    </Paper>
  );
}
