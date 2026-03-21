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
  /** When true, modal uses full viewport width (96vw) */
  fullWidth?: boolean;
  /** Context for subtitle: "resume" = choosing resume, "review" = reviewing before submit */
  context?: "resume" | "review";
}

export function ResumeViewerModal({
  open,
  onClose,
  resumeId,
  resumeName = "Resume",
  fullWidth = false,
  context = "resume",
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
          width: fullWidth ? "96vw" : { xs: "100%", sm: 900, md: 1000, lg: 1100 },
          height: "92vh",
          borderRadius: { xs: 0, sm: 2.5 },
          boxShadow: "0 32px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(99, 102, 241, 0.08)",
          overflow: "hidden",
          border: "1px solid rgba(99, 102, 241, 0.12)",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
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
          py: 1.75,
          background: "linear-gradient(180deg, #ffffff 0%, #fafbff 100%)",
          borderBottom: "1px solid rgba(99, 102, 241, 0.1)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0.1) 100%)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.06) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:file-pdf-box" size={26} color="#6366f1" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                fontSize: "1.05rem",
                letterSpacing: "-0.02em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {resumeName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 500 }}>
              {context === "review" ? "Review before submitting" : "PDF preview"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {pdfUrl && !loading && !error && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconWrapper icon="mdi:download" size={18} />}
              onClick={handleDownload}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                borderColor: "#6366f1",
                color: "#6366f1",
                fontSize: "0.8125rem",
                py: 0.875,
                px: 2,
                "&:hover": {
                  borderColor: "#4f46e5",
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                },
              }}
            >
              Download
            </Button>
          )}
          <Tooltip title="Close">
            <IconButton
              onClick={handleClose}
              size="medium"
              sx={{
                color: "#64748b",
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                  color: "#6366f1",
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
          background: "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
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
                gap: 24,
              }}
            >
              <Box sx={{ position: "relative" }}>
                <CircularProgress size={56} sx={{ color: "#6366f1" }} />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:file-pdf-box" size={24} color="#6366f1" style={{ opacity: 0.6 }} />
                </Box>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#334155", fontWeight: 600 }}>
                  Loading your resume…
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.25 }}>
                  Preparing preview
                </Typography>
              </Box>
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
                gap: 20,
                padding: 48,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 2.5,
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:file-document-alert-outline" size={40} color="#ef4444" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1.05rem" }}>
                  Couldn&apos;t load preview
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#64748b", maxWidth: 320, lineHeight: 1.6, mt: 0.5 }}
                >
                  Try downloading the file instead, or check your connection and try again.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<IconWrapper icon="mdi:download" size={18} />}
                onClick={handleDownload}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  backgroundColor: "#6366f1",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
                  "&:hover": {
                    backgroundColor: "#4f46e5",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
                  },
                }}
              >
                Download resume
              </Button>
            </motion.div>
          )}
          {pdfUrl && !loading && !error && (
            <motion.div
              key="pdf"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                width: "100%",
                height: "100%",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  width: "100%",
                  maxHeight: "calc(92vh - 140px)",
                  borderRadius: 2.5,
                  overflow: "hidden",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <iframe
                  src={pdfUrl}
                  title={resumeName}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    minHeight: 480,
                    display: "block",
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                Press Esc to close
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
