"use client";

import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  attachmentLabel,
  isImageAttachment,
} from "./attachment-utils";
import { AttachmentPreviewDialog } from "./AttachmentPreviewDialog";

interface Props {
  urls: string[];
  heading?: string;
  dense?: boolean;
}

export function AttachmentList({ urls, heading, dense = false }: Props) {
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(
    null,
  );

  if (!urls || urls.length === 0) return null;

  return (
    <Box sx={{ mt: heading ? 1.5 : 0 }}>
      {heading && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "var(--font-secondary)",
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            mb: 1,
          }}
        >
          {heading}
        </Typography>
      )}

      <Stack spacing={1}>
        {urls.map((u, i) => {
          if (!u) return null;
          const label = attachmentLabel(u, i);
          const isImage = isImageAttachment(u);

          const handleActivate = (e: React.MouseEvent | React.KeyboardEvent) => {
            if (isImage) {
              e.preventDefault();
              setPreview({ url: u, label });
            }
          };

          return (
            <Box
              key={`${u}-${i}`}
              component={isImage ? "div" : "a"}
              {...(isImage
                ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: handleActivate,
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") handleActivate(e);
                    },
                  }
                : {
                    href: u,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: dense ? 1.25 : 1.5,
                py: dense ? 1 : 1.25,
                border: "1px solid var(--border-default)",
                borderRadius: 2,
                backgroundColor: "var(--card-bg)",
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: "var(--info-accent)",
                  backgroundColor: "var(--surface)",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
                },
                "&:focus-visible": {
                  outline: "2px solid var(--ticket-brand)",
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: dense ? 36 : 42,
                  height: dense ? 36 : 42,
                  flexShrink: 0,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isImage
                    ? "var(--info-surface)"
                    : "var(--surface)",
                  border: "1px solid",
                  borderColor: isImage
                    ? "var(--info-border)"
                    : "var(--border-default)",
                }}
              >
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <IconWrapper
                    icon="mdi:file-document-outline"
                    size={20}
                    color="var(--font-secondary)"
                  />
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "var(--ticket-text-strong)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--font-secondary)", fontSize: "0.7rem" }}
                >
                  {isImage ? "Image · click to preview" : "Document · opens in new tab"}
                </Typography>
              </Box>

              <IconWrapper
                icon={isImage ? "mdi:eye-outline" : "mdi:open-in-new"}
                size={18}
                color="var(--font-secondary)"
              />
            </Box>
          );
        })}
      </Stack>

      <AttachmentPreviewDialog
        open={!!preview}
        url={preview?.url ?? null}
        label={preview?.label ?? ""}
        onClose={() => setPreview(null)}
      />
    </Box>
  );
}
