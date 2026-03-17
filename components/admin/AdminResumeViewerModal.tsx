"use client";

import { useState, useEffect, useRef } from "react";
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
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminProfileService } from "@/lib/services/admin/admin-profile.service";

interface AdminResumeViewerModalProps {
  open: boolean;
  onClose: () => void;
  studentId: number;
  resumeId: number | null;
  resumeName?: string;
}

export function AdminResumeViewerModal({
  open,
  onClose,
  studentId,
  resumeId,
  resumeName = "Resume",
}: AdminResumeViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !resumeId || !studentId) {
      setPdfUrl(null);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    adminProfileService
      .getStudentResumePdfBlobUrl(studentId, resumeId)
      .then((url) => {
        if (cancelled) return;
        urlRef.current = url;
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
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [open, resumeId, studentId]);

  const handleClose = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    onClose();
  };

  const handleDownload = async () => {
    if (!studentId || !resumeId) return;
    try {
      const blob = await adminProfileService.getStudentResumePdfBlob(studentId, resumeId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = (resumeName || "resume").replace(/\.pdf$/i, "") + ".pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Ignore download errors
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload} disabled={!pdfUrl && !loading}>
              <IconWrapper icon="mdi:download" size={22} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={handleClose}>
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
        {loading && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <CircularProgress size={48} sx={{ color: "#0a66c2" }} />
            <Typography variant="body2" color="text.secondary">
              Loading resume…
            </Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <IconWrapper icon="mdi:file-document-alert-outline" size={48} color="#dc2626" />
            <Typography variant="body2" color="text.secondary">
              Failed to load resume
            </Typography>
          </Box>
        )}
        {pdfUrl && !loading && !error && (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1`}
            title={resumeName}
            style={{
              width: "100%",
              height: "70vh",
              border: "none",
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
