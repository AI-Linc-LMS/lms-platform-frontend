"use client";

import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface Props {
  open: boolean;
  url: string | null;
  label: string;
  onClose: () => void;
}

export function AttachmentPreviewDialog({ open, url, label, onClose }: Props) {
  return (
    <Dialog
      open={open && !!url}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "var(--ticket-text-strong)",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          position: "relative",
          backgroundColor: "var(--ticket-text-strong)",
          minHeight: 360,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            zIndex: 2,
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              backgroundColor: "rgba(15,23,42,0.72)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.12)",
              maxWidth: { xs: "55%", sm: "70%" },
              overflow: "hidden",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-light)",
                fontWeight: 600,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {label}
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.75}>
            {url && (
              <Button
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<IconWrapper icon="mdi:open-in-new" size={16} />}
                size="small"
                sx={{
                  textTransform: "none",
                  color: "var(--font-light)",
                  backgroundColor: "rgba(15,23,42,0.72)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 999,
                  fontWeight: 600,
                  px: 1.5,
                  "&:hover": {
                    backgroundColor: "rgba(30,41,59,0.85)",
                  },
                }}
              >
                Open
              </Button>
            )}
            <IconButton
              onClick={onClose}
              aria-label="Close preview"
              sx={{
                color: "var(--font-light)",
                backgroundColor: "rgba(15,23,42,0.72)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.12)",
                "&:hover": { backgroundColor: "rgba(30,41,59,0.85)" },
              }}
            >
              <IconWrapper icon="mdi:close" size={20} />
            </IconButton>
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage:
              "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, transparent 70%)",
            p: { xs: 2, sm: 4 },
            pt: { xs: 8, sm: 9 },
          }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={label}
              style={{
                maxWidth: "100%",
                maxHeight: "78vh",
                objectFit: "contain",
                borderRadius: 8,
                boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
              }}
            />
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
