"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["application/pdf"];

interface ResumeUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export function ResumeUploadDialog({
  open,
  onClose,
  onUpload,
}: ResumeUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setError("");
      setUploading(false);
    }
  }, [open]);

  const validateAndSetFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only PDF files are allowed");
      return;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_SIZE_MB) {
      setError(`File size must not exceed ${MAX_SIZE_MB}MB`);
      return;
    }
    setSelectedFile(file);
    setError("");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    try {
      await onUpload(selectedFile);
      onClose();
    } catch {
      setError("Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#f8fafc",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: "linear-gradient(135deg, rgba(10, 102, 194, 0.12) 0%, rgba(10, 102, 194, 0.06) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:file-document-plus-outline" size={26} color="#0a66c2" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", fontSize: "1.25rem" }}>
              Upload Resume
            </Typography>
            <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.8125rem" }}>
              PDF only, max {MAX_SIZE_MB}MB
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={uploading} aria-label="close">
          <IconWrapper icon="mdi:close" size={22} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
        <Box
          sx={{
            border: "2px dashed #e2e8f0",
            borderRadius: 3,
            p: 5,
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: "#f8fafc",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(10, 102, 194, 0.04)",
              borderColor: "#0a66c2",
            },
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <IconWrapper
            icon="mdi:file-document-outline"
            size={56}
            color={selectedFile ? "#0a66c2" : "#94a3b8"}
          />
          <Typography
            variant="body1"
            sx={{
              mt: 1.5,
              color: selectedFile ? "#0a66c2" : "#475569",
              fontWeight: 600,
              fontSize: "0.9375rem",
            }}
          >
            {selectedFile ? selectedFile.name : "Drag and drop a PDF here, or click to select"}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#94a3b8" }}>
            PDF only, max {MAX_SIZE_MB}MB
          </Typography>
        </Box>
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 500 }}>
            {error}
          </Typography>
        )}
        {uploading && (
          <LinearProgress
            sx={{
              mt: 2,
              height: 6,
              borderRadius: 3,
              "& .MuiLinearProgress-bar": { borderRadius: 3 },
            }}
          />
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderTop: "1px solid rgba(0,0,0,0.08)",
          gap: 1.5,
          flexDirection: { xs: "column-reverse", sm: "row" },
          backgroundColor: "#ffffff",
        }}
      >
        <Button
          onClick={handleClose}
          disabled={uploading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#64748b",
            borderRadius: 2,
            px: 3,
            py: 1.25,
            border: "1px solid rgba(0,0,0,0.12)",
            "&:hover": { backgroundColor: "#f1f5f9" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          startIcon={<IconWrapper icon="mdi:upload" size={20} />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            py: 1.25,
            backgroundColor: "#0a66c2",
            "&:hover": { backgroundColor: "#004182" },
          }}
        >
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
