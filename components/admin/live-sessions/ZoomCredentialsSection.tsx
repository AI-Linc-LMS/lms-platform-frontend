"use client";

import { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { accountsService, ZoomCredentials } from "@/lib/services/accounts.service";

export function ZoomCredentialsSection() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ZoomCredentials>({
    account_id: "",
    zoom_client_id: "",
    zoom_client_secret: "",
    is_active: false,
    timezone: "",
  });

  const loadCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountsService.getZoomCredentials();
      setForm(
        data
          ? {
              account_id: data.account_id ?? "",
              zoom_client_id: data.zoom_client_id ?? "",
              zoom_client_secret: "", // API never returns secret
              is_active: data.is_active ?? false,
              timezone: data.timezone ?? "",
            }
          : {
              account_id: "",
              zoom_client_id: "",
              zoom_client_secret: "",
              is_active: false,
              timezone: "",
            }
      );
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to load Zoom credentials";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await accountsService.putZoomCredentials({
        account_id: form.account_id || undefined,
        zoom_client_id: form.zoom_client_id || undefined,
        zoom_client_secret: form.zoom_client_secret || undefined,
        is_active: form.is_active,
        timezone: form.timezone || undefined,
      });
      showToast("Zoom credentials saved successfully", "success");
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to save Zoom credentials";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading Zoom credentials…
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        border: "1px solid #e5e7eb",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconWrapper icon="mdi:video-account" size={24} color="#6366f1" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          Zoom credentials
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
        Configure Zoom account and API credentials for this client. Used for
        creating and managing live sessions.
      </Typography>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mb: 2,
        }}
      >
        <TextField
          label="Account ID"
          value={form.account_id ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, account_id: e.target.value }))
          }
          size="small"
          fullWidth
        />
        <TextField
          label="Zoom Client ID"
          value={form.zoom_client_id ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, zoom_client_id: e.target.value }))
          }
          size="small"
          fullWidth
        />
        <TextField
          label="Zoom Client Secret"
          type="password"
          value={form.zoom_client_secret ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, zoom_client_secret: e.target.value }))
          }
          size="small"
          fullWidth
          sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}
        />
        <TextField
          label="Timezone"
          value={form.timezone ?? ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, timezone: e.target.value }))
          }
          size="small"
          fullWidth
          placeholder="e.g. America/New_York"
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.is_active ?? false}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              color="primary"
            />
          }
          label="Active"
        />
      </Box>

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving}
        startIcon={
          saving ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <IconWrapper icon="mdi:content-save" size={18} />
          )
        }
        sx={{
          bgcolor: "#6366f1",
          "&:hover": { bgcolor: "#4f46e5" },
        }}
      >
        {saving ? "Saving…" : "Save"}
      </Button>
    </Paper>
  );
}
