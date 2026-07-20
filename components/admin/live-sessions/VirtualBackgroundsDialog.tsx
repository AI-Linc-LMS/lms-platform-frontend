"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  VirtualBackground,
} from "@/lib/services/admin/admin-live-activities.service";
import { getZoomApiErrorMessage } from "@/lib/utils/live-session-errors";
import { InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";

interface VirtualBackgroundsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Manage account-level Zoom virtual backgrounds (applies account-wide, not per-meeting). */
export function VirtualBackgroundsDialog({
  open,
  onClose,
}: VirtualBackgroundsDialogProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [backgrounds, setBackgrounds] = useState<VirtualBackground[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminLiveActivitiesService
      .listVirtualBackgrounds()
      .then((data) => {
        setBackgrounds(data.virtual_backgrounds ?? []);
        setNote(data.note ?? "");
      })
      .catch((e) => showToast(getZoomApiErrorMessage(String(e)), "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const result = await adminLiveActivitiesService.uploadVirtualBackground(file);
      if (result.status === "error") {
        showToast(getZoomApiErrorMessage(result.message), "error");
        return;
      }
      showToast(t("adminLiveSessions.backgroundUploaded", "Background uploaded"), "success");
      load();
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await adminLiveActivitiesService.deleteVirtualBackground(id);
      showToast(t("adminLiveSessions.backgroundDeleted", "Background deleted"), "success");
      load();
    } catch (e: unknown) {
      showToast(getZoomApiErrorMessage(String(e)), "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--font-primary)" }}>
            {t("adminLiveSessions.virtualBackgroundsTitle", "Virtual backgrounds")}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: "var(--font-secondary)" }}>
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <InfoCallout icon="mdi:information-outline">
            {note ||
              t(
                "adminLiveSessions.virtualBackgroundsNote",
                "Virtual backgrounds are managed at the Zoom account level and apply account-wide; Zoom provides no per-meeting virtual background API."
              )}
          </InfoCallout>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : backgrounds.length === 0 ? (
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 2 }}>
            {t("adminLiveSessions.noBackgrounds", "No virtual backgrounds uploaded yet.")}
          </Typography>
        ) : (
          <List dense>
            {backgrounds.map((bg) => (
              <ListItem
                key={bg.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(bg.id)}
                    disabled={deletingId === bg.id}
                    aria-label="delete"
                  >
                    {deletingId === bg.id ? (
                      <CircularProgress size={18} />
                    ) : (
                      <IconWrapper icon="mdi:delete-outline" size={20} />
                    )}
                  </IconButton>
                }
              >
                <ListItemText
                  primary={bg.name || bg.id}
                  secondary={bg.type}
                />
              </ListItem>
            ))}
          </List>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            color: "var(--font-secondary)",
          }}
        >
          {t("adminLiveSessions.close", "Close")}
        </Button>
        <Button
          variant="contained"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          startIcon={
            uploading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <IconWrapper icon="mdi:upload" size={18} />
            )
          }
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            background: "var(--accent-indigo)",
            color: "#fff",
            "&:hover": { background: "var(--accent-indigo-dark)" },
          }}
        >
          {t("adminLiveSessions.uploadBackground", "Upload image")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
