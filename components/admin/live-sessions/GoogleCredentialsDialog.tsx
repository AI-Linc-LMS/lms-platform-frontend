"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Collapse,
} from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { googleService, GoogleCredentials, GoogleCredentialsInput } from "@/lib/services/google.service";
import { GoogleSetupGuide } from "./GoogleSetupGuide";

interface GoogleCredentialsDialogProps {
  open: boolean;
  creds: GoogleCredentials | null;
  /** OAuth redirect URI to whitelist in the Google Cloud OAuth client. */
  redirectUri?: string;
  onClose: () => void;
  onChanged: () => void; // reload status after save/disconnect
  onConnect: () => void; // start / reconnect OAuth
  connecting: boolean;
}

function getApiErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const data = (e as { response?: { data?: unknown } }).response?.data;
    if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string")
      return (data as { error: string }).error;
  }
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong. Please try again.";
}

/**
 * Optional Google Meet settings: the connection status + Connect/Reconnect/Disconnect, plus
 * calendar id / timezone / active, and an "Advanced" section for a per-tenant Google OAuth app.
 * Most tenants only ever click "Connect Google" on the card and never open this.
 */
export function GoogleCredentialsDialog({ open, creds, redirectUri, onClose, onChanged, onConnect, connecting }: GoogleCredentialsDialogProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [form, setForm] = useState<GoogleCredentialsInput>({});

  useEffect(() => {
    if (!open) return;
    setForm({
      calendar_id: creds?.calendar_id ?? "primary",
      timezone: creds?.timezone ?? "",
      is_active: creds?.is_active ?? true,
      google_client_id: "",
      google_client_secret: "",
    });
    setShowAdvanced(false);
    setShowGuide(false);
  }, [open, creds]);

  const connected = Boolean(creds?.is_connected);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: GoogleCredentialsInput = { is_active: form.is_active };
      if (form.calendar_id?.trim()) payload.calendar_id = form.calendar_id.trim();
      if (form.timezone?.trim()) payload.timezone = form.timezone.trim();
      if (form.google_client_id?.trim()) payload.google_client_id = form.google_client_id.trim();
      if (form.google_client_secret?.trim()) payload.google_client_secret = form.google_client_secret.trim();
      await googleService.putGoogleCredentials(payload);
      showToast(t("adminLiveSessions.googleSettingsSaved", "Google settings saved."), "success");
      onChanged();
      onClose();
    } catch (e: unknown) {
      showToast(getApiErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await googleService.disconnectGoogle();
      showToast(t("adminLiveSessions.googleDisconnected", "Google account disconnected."), "success");
      onChanged();
      onClose();
    } catch (e: unknown) {
      showToast(getApiErrorMessage(e), "error");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="logos:google-meet" size={22} />
          <span>{t("adminLiveSessions.googleSettingsTitle", "Google Meet settings")}</span>
        </Box>
        <IconButton aria-label={t("adminLiveSessions.close", "Close")} onClick={onClose} size="small">
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Connection status + connect/disconnect */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={connected ? t("adminLiveSessions.connected", "Connected") : t("adminLiveSessions.notConnected", "Not connected")}
              size="small"
              sx={{
                bgcolor: connected ? "color-mix(in srgb, var(--success-500) 16%, transparent)" : "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                color: connected ? "var(--success-500)" : "var(--warning-500)",
                fontWeight: 600,
              }}
            />
            {connected && creds?.connected_email && (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                {creds.connected_email}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {connected && (
              <LoadingButton
                variant="text"
                onClick={handleDisconnect}
                loading={disconnecting}
                loadingText={t("adminLiveSessions.disconnecting", "Disconnecting…")}
                sx={{ textTransform: "none", color: "var(--error-500, #ef4444)" }}
              >
                {t("adminLiveSessions.disconnect", "Disconnect")}
              </LoadingButton>
            )}
            <Button
              variant="outlined"
              onClick={onConnect}
              disabled={connecting}
              startIcon={<IconWrapper icon="mdi:google" size={16} />}
              sx={{ textTransform: "none" }}
            >
              {connected ? t("adminLiveSessions.reconnect", "Reconnect") : t("adminLiveSessions.connectGoogle", "Connect Google")}
            </Button>
          </Box>
        </Box>

        {redirectUri && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", mb: 0.5, display: "block" }}>
              {t("adminLiveSessions.googleRedirectUriLabel", "Authorized redirect URI (add this in Google Cloud Console → Google Auth Platform → Clients)")}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                value={redirectUri}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ "& .MuiInputBase-input": { fontSize: "0.78rem", fontFamily: "monospace" } }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(redirectUri).then(
                    () => showToast(t("adminLiveSessions.redirectUriCopied", "Redirect URI copied"), "success"),
                    () => showToast(t("adminLiveSessions.failedToCopy", "Failed to copy"), "error")
                  );
                }}
                aria-label={t("adminLiveSessions.copyRedirectUri", "Copy redirect URI")}
              >
                <IconWrapper icon="mdi:content-copy" size={18} />
              </IconButton>
            </Box>
          </Box>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 1 }}>
          <TextField
            label={t("adminLiveSessions.calendarId", "Calendar ID")}
            value={form.calendar_id ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, calendar_id: e.target.value }))}
            size="small"
            fullWidth
            placeholder="primary"
            helperText={t("adminLiveSessions.calendarIdHelper", "Calendar to create meetings on (default: primary).")}
          />
          <TextField
            label={t("adminLiveSessions.timezoneOptional", "Timezone (optional)")}
            value={form.timezone ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            size="small"
            fullWidth
            placeholder="Asia/Kolkata"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active ?? true}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                color="primary"
              />
            }
            label={t("adminLiveSessions.active", "Active")}
          />
        </Box>

        <Button
          size="small"
          onClick={() => setShowAdvanced((v) => !v)}
          endIcon={<IconWrapper icon={showAdvanced ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />}
          sx={{ textTransform: "none", color: "var(--font-secondary)" }}
        >
          {t("adminLiveSessions.advancedOwnApp", "Advanced: use your own Google app")}
        </Button>
        <Collapse in={showAdvanced}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mt: 1, mb: 1 }}>
            <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
              {t("adminLiveSessions.ownAppHelper", "Optional. Leave blank to use the platform's Google app. If set, reconnect Google afterwards.")}
            </Typography>
            <TextField
              label={t("adminLiveSessions.googleClientId", "Google OAuth client ID")}
              value={form.google_client_id ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, google_client_id: e.target.value }))}
              size="small"
              fullWidth
              autoComplete="off"
            />
            <TextField
              label={t("adminLiveSessions.googleClientSecret", "Google OAuth client secret")}
              type="password"
              value={form.google_client_secret ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, google_client_secret: e.target.value }))}
              size="small"
              fullWidth
              autoComplete="off"
              helperText={t("adminLiveSessions.leaveBlankKeep", "Leave blank to keep the existing secret.")}
            />
          </Box>
        </Collapse>

        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            onClick={() => setShowGuide((v) => !v)}
            startIcon={<IconWrapper icon="mdi:help-circle-outline" size={18} />}
            endIcon={<IconWrapper icon={showGuide ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />}
            sx={{
              textTransform: "none",
              color: "var(--accent-indigo)",
              "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)" },
            }}
          >
            {showGuide
              ? t("adminLiveSessions.hideGoogleGuide", "Hide setup guide")
              : t("adminLiveSessions.viewGoogleGuide", "First time? View the step-by-step Google setup guide")}
          </Button>
          <Collapse in={showGuide}>
            <GoogleSetupGuide redirectUri={redirectUri} />
          </Collapse>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
          <Button onClick={onClose}>{t("adminLiveSessions.cancel", "Cancel")}</Button>
          <LoadingButton
            variant="contained"
            onClick={handleSave}
            loading={saving}
            loadingText={t("common.saving", "Saving…")}
            startIcon={<IconWrapper icon="mdi:content-save" size={18} />}
            sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
          >
            {t("adminLiveSessions.save", "Save")}
          </LoadingButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
