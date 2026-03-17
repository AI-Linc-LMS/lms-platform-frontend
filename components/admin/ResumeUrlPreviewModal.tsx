"use client";

import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ResumeUrlPreviewModalProps {
  open: boolean;
  onClose: () => void;
  resumeUrl: string | null;
  resumeName?: string;
}

export function ResumeUrlPreviewModal({
  open,
  onClose,
  resumeUrl,
  resumeName = "Resume",
}: ResumeUrlPreviewModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#fafafa",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {resumeName}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {resumeUrl && (
            <IconButton
              size="small"
              component="a"
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconWrapper icon="mdi:open-in-new" size={22} />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose}>
            <IconWrapper icon="mdi:close" size={22} />
          </IconButton>
        </Box>
      </Box>
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 500,
          backgroundColor: "#f1f5f9",
        }}
      >
        {resumeUrl ? (
          <iframe
            src={resumeUrl}
            title={resumeName}
            style={{
              width: "100%",
              height: "70vh",
              border: "none",
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No resume URL available
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
