"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
  Chip,
  Collapse,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { zoomService, ZoomCredentials } from "@/lib/services/zoom.service";

const PRODUCTION_WEBHOOK_BASE = "https://be-app.ailinc.com";

interface ZoomCredentialsDialogProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm: ZoomCredentials = {
  account_id: "",
  zoom_client_id: "",
  zoom_client_secret: "",
  zoom_webhook_secret: "",
  is_active: false,
  timezone: "",
};

function getApiErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const res = (e as { response?: { data?: unknown } }).response;
    const data = res?.data;
    if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string")
      return (data as { error: string }).error;
    if (data && typeof data === "object") {
      const entries = Object.entries(data).filter(([, v]) => Array.isArray(v) && v.length);
      if (entries.length) return entries.map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; ");
    }
  }
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong. Please try again.";
}

export function ZoomCredentialsDialog({ open, onClose }: ZoomCredentialsDialogProps) {
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [form, setForm] = useState<ZoomCredentials>(emptyForm);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);

  const displayWebhookUrl =
    clientInfo?.slug != null
      ? `${PRODUCTION_WEBHOOK_BASE}/webhooks/zoom/${clientInfo.slug}/`
      : `${PRODUCTION_WEBHOOK_BASE}/webhooks/zoom/<client_slug>/`;

  const loadCredentials = async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const data = await zoomService.getZoomCredentials();
      setHasExistingConfig(data != null);
      setWebhookUrl(data?.webhook_url ?? null);
      setWebhookConfigured(data?.webhook_configured ?? false);
      setForm(
        data
          ? {
              account_id: data.account_id ?? "",
              zoom_client_id: data.zoom_client_id ?? "",
              zoom_client_secret: "",
              zoom_webhook_secret: "",
              is_active: data.is_active ?? false,
              timezone: data.timezone ?? "",
            }
          : { ...emptyForm }
      );
    } catch (e: unknown) {
      const message = getApiErrorMessage(e);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadCredentials();
  }, [open]);

  const handleSave = async () => {
    setError(null);
    // Create: all three required. Update: secret optional (leave blank to keep existing).
    if (!hasExistingConfig) {
      const missing: string[] = [];
      if (!(form.account_id && form.account_id.trim())) missing.push("Account ID");
      if (!(form.zoom_client_id && form.zoom_client_id.trim())) missing.push("Zoom Client ID");
      if (!(form.zoom_client_secret && form.zoom_client_secret.trim())) missing.push("Zoom Client Secret");
      if (missing.length) {
        setError(`Required when setting up for the first time: ${missing.join(", ")}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Partial<ZoomCredentials> = {
        is_active: form.is_active,
      };
      if (form.account_id?.trim()) payload.account_id = form.account_id.trim();
      if (form.zoom_client_id?.trim()) payload.zoom_client_id = form.zoom_client_id.trim();
      if (form.zoom_client_secret?.trim()) payload.zoom_client_secret = form.zoom_client_secret.trim();
      if (form.zoom_webhook_secret?.trim()) payload.zoom_webhook_secret = form.zoom_webhook_secret.trim();
      if (form.timezone?.trim()) payload.timezone = form.timezone.trim();

      await zoomService.putZoomCredentials(payload);
      showToast("Zoom credentials saved successfully", "success");
      onClose();
    } catch (e: unknown) {
      const message = getApiErrorMessage(e);
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:video-account" size={24} color="#6366f1" />
          <span>Zoom credentials</span>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
          Configure Zoom account and API credentials for this client. Used for creating and managing live sessions.
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {error && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                label={hasExistingConfig ? "Account ID" : "Account ID *"}
                value={form.account_id ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, account_id: e.target.value }))}
                size="small"
                fullWidth
              />
              <TextField
                label={hasExistingConfig ? "Zoom Client ID" : "Zoom Client ID *"}
                value={form.zoom_client_id ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, zoom_client_id: e.target.value }))}
                size="small"
                fullWidth
              />
              <TextField
                label={
                  hasExistingConfig
                    ? "Zoom Client Secret (leave blank to keep existing)"
                    : "Zoom Client Secret *"
                }
                type="password"
                value={form.zoom_client_secret ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, zoom_client_secret: e.target.value }))}
                size="small"
                fullWidth
                autoComplete="off"
              />
              <TextField
                label={
                  hasExistingConfig
                    ? "Webhook Secret (leave blank to keep existing)"
                    : "Webhook Secret"
                }
                type="password"
                value={form.zoom_webhook_secret ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, zoom_webhook_secret: e.target.value }))}
                size="small"
                fullWidth
                autoComplete="off"
                helperText="From Zoom Marketplace → your app → Event Subscriptions → Secret token."
              />
              {hasExistingConfig && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block" }}>
                    Webhook URL (for Zoom Event Subscriptions)
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      value={displayWebhookUrl}
                      size="small"
                      fullWidth
                      InputProps={{ readOnly: true }}
                      sx={{ "& .MuiInputBase-input": { fontSize: "0.8rem", fontFamily: "monospace" } }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(displayWebhookUrl).then(
                          () => showToast("Webhook URL copied", "success"),
                          () => showToast("Failed to copy", "error")
                        );
                      }}
                      aria-label="Copy webhook URL"
                    >
                      <IconWrapper icon="mdi:content-copy" size={18} />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" sx={{ color: "#9ca3af", mt: 0.5, display: "block" }}>
                    In Zoom Marketplace → your app → Event Subscriptions, set Endpoint URL to this value.
                  </Typography>
                  {!clientInfo?.slug && (
                    <Typography variant="caption" sx={{ color: "#6b7280", mt: 0.5, display: "block" }}>
                      Replace &lt;client_slug&gt; with your client&apos;s slug (from backend/admin).
                    </Typography>
                  )}
                  {webhookConfigured && (
                    <Chip
                      label="Webhook active"
                      size="small"
                      sx={{ mt: 1, bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }}
                    />
                  )}
                </Box>
              )}
              <TextField
                label="Timezone (optional)"
                value={form.timezone ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                size="small"
                fullWidth
                placeholder="e.g. Asia/Kolkata, America/New_York"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active ?? false}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                size="small"
                onClick={() => setShowSetupHelp((v) => !v)}
                startIcon={
                  <IconWrapper icon={showSetupHelp ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />
                }
                sx={{ textTransform: "none", color: "#6366f1" }}
              >
                Zoom Marketplace setup (scopes &amp; webhook)
              </Button>
              <Collapse in={showSetupHelp}>
                <Box sx={{ mt: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e2e8f0" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>
                    Required scopes (Zoom Marketplace → your app → Feature)
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "0.8125rem", color: "#475569" }}>
                    <li><strong>Meeting:write</strong> — create meetings</li>
                    <li><strong>Recording:read</strong> (or Recording:read:admin) — sync cloud recordings</li>
                    <li><strong>Meeting:read:admin</strong> — fetch past-meeting participants (attendance)</li>
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                    After adding scopes, re-authorize the app if Zoom prompts you so new tokens include them.
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mt: 2, mb: 1 }}>
                    Event Subscriptions (Zoom Marketplace → your app → Event Subscriptions)
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "0.8125rem", color: "#475569" }}>
                    <li><strong>Endpoint URL</strong> — use the Webhook URL above (or production URL when deploying)</li>
                    <li><strong>Secret token</strong> — copy from Zoom and paste into &quot;Webhook Secret&quot; above</li>
                    <li>Subscribe to: <strong>Meeting has ended</strong> (meeting.ended) and <strong>Recording has been completed</strong> (recording.completed)</li>
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                    Production webhook base: <strong>{PRODUCTION_WEBHOOK_BASE}</strong> — use <code style={{ fontSize: "0.75rem" }}>https://be-app.ailinc.com/webhooks/zoom/&lt;client_slug&gt;/</code> with your client&apos;s slug.
                  </Typography>
                </Box>
              </Collapse>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={
                  saving ? <CircularProgress size={18} color="inherit" /> : <IconWrapper icon="mdi:content-save" size={18} />
                }
                sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
