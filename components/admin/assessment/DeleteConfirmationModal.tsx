"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  loading = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <IconWrapper icon="mdi:alert-circle" size={24} color="#ef4444" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Delete Assessment
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Are you sure you want to delete this assessment?
        </Typography>
        <Box
          sx={{
            p: 2,
            bgcolor: "#fef2f2",
            borderRadius: 1,
            border: "1px solid #fecaca",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#991b1b" }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 2, color: "#6b7280" }}>
          This action cannot be undone. All associated data will be permanently
          deleted.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <IconWrapper icon="mdi:delete" size={18} />
            )
          }
          sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

