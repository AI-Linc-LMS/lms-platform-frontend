"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  CircularProgress,
  Button,
  Typography,
  Tooltip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { resumeService } from "@/lib/services/resume.service";

interface ResumeViewerModalProps {
  open: boolean;
  onClose: () => void;
  resumeId: number | null;
  resumeName?: string;
}

export function ResumeViewerModal({
  open,
  onClose,
  resumeId,
  resumeName = "Resume",
}: ResumeViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !resumeId) {
      setPdfUrl(null);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    resumeService
      .getResumePdfBlobUrl(resumeId)
      .then((url) => {
        if (cancelled) return;
        setPdfUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, resumeId]);

  const handleClose = () => {
    setPdfUrl(null);
    onClose();
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = (resumeName || "resume").replace(/\.pdf$/i, "") + ".pdf";
      link.click();
    } else if (resumeId) {
      resumeService.openDownload(resumeId);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: "96vw",
          width: { xs: "100%", sm: 900, md: 1000, lg: 1100 },
          height: "92vh",
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.6)",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:file-pdf-box" size={24} color="#dc2626" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: "#111827",
                fontSize: "1rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {resumeName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
              PDF Document
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {pdfUrl && !loading && !error && (
            <Tooltip title="Download">
              <IconButton
                onClick={handleDownload}
                size="medium"
                sx={{
                  color: "#0a66c2",
                  "&:hover": {
                    backgroundColor: "rgba(10, 102, 194, 0.08)",
                    color: "#004182",
                  },
                }}
                aria-label="download"
              >
                <IconWrapper icon="mdi:download" size={22} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Close">
            <IconButton
              onClick={handleClose}
              size="medium"
              sx={{
                color: "#6b7280",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.06)",
                  color: "#111827",
                },
              }}
              aria-label="close"
            >
              <IconWrapper icon="mdi:close" size={22} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f1f5f9",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <CircularProgress size={48} sx={{ color: "#0a66c2" }} />
              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
                Loading PDF…
              </Typography>
            </motion.div>
          )}
          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: 40,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 2,
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:file-document-alert-outline" size={36} color="#dc2626" />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#111827" }}>
                Failed to load PDF
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#64748b", maxWidth: 320, lineHeight: 1.6 }}
              >
                Try downloading the file instead, or check your connection and try again.
              </Typography>
              <Button
                variant="contained"
                startIcon={<IconWrapper icon="mdi:download" size={18} />}
                onClick={handleDownload}
                sx={{
                  mt: 0.5,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  backgroundColor: "#0a66c2",
                  "&:hover": { backgroundColor: "#004182" },
                }}
              >
                Download
              </Button>
            </motion.div>
          )}
          {pdfUrl && !loading && !error && (
            <motion.div
              key="pdf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                width: "100%",
                height: "100%",
                padding: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "calc(92vh - 88px)",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <iframe
                  src={pdfUrl}
                  title={resumeName}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    minHeight: 500,
                    display: "block",
                  }}
                />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
