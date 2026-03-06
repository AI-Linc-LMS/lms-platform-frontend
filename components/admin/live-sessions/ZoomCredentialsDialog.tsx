"use client";

import { useState, useEffect } from "react";
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
  CircularProgress,
  FormControlLabel,
  Switch,
  Chip,
  Collapse,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { zoomService, ZoomCredentials } from "@/lib/services/zoom.service";

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
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [form, setForm] = useState<ZoomCredentials>(emptyForm);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);

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
      if (!(form.account_id && form.account_id.trim())) missing.push(t("adminLiveSessions.accountId"));
      if (!(form.zoom_client_id && form.zoom_client_id.trim())) missing.push(t("adminLiveSessions.zoomClientId"));
      if (!(form.zoom_client_secret && form.zoom_client_secret.trim())) missing.push(t("adminLiveSessions.zoomClientSecretRequired"));
      if (missing.length) {
        setError(t("adminLiveSessions.requiredWhenSetup", { fields: missing.join(", ") }));
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
      showToast(t("adminLiveSessions.zoomCredentialsSaved"), "success");
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
          <span>{t("adminLiveSessions.zoomCredentialsTitle")}</span>
        </Box>
        <IconButton aria-label={t("adminLiveSessions.close")} onClick={onClose} size="small">
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
          {t("adminLiveSessions.zoomCredentialsDesc")}
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
                label={hasExistingConfig ? t("adminLiveSessions.accountId") : t("adminLiveSessions.accountIdRequired")}
                value={form.account_id ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, account_id: e.target.value }))}
                size="small"
                fullWidth
              />
              <TextField
                label={hasExistingConfig ? t("adminLiveSessions.zoomClientId") : t("adminLiveSessions.zoomClientIdRequired")}
                value={form.zoom_client_id ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, zoom_client_id: e.target.value }))}
                size="small"
                fullWidth
              />
              <TextField
                label={hasExistingConfig ? t("adminLiveSessions.zoomClientSecret") : t("adminLiveSessions.zoomClientSecretRequired")}
                type="password"
                value={form.zoom_client_secret ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, zoom_client_secret: e.target.value }))}
                size="small"
                fullWidth
                autoComplete="off"
              />
              <TextField
                label={hasExistingConfig ? t("adminLiveSessions.webhookSecret") : t("adminLiveSessions.webhookSecretLabel")}
                type="password"
                value={form.zoom_webhook_secret ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, zoom_webhook_secret: e.target.value }))}
                size="small"
                fullWidth
                autoComplete="off"
                helperText={t("adminLiveSessions.webhookSecretHelper")}
              />
              {hasExistingConfig && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, display: "block" }}>
                    {t("adminLiveSessions.subscriptionEndpointUrl")}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField
                      value={webhookUrl?.trim() ?? ""}
                      size="small"
                      fullWidth
                      placeholder={webhookUrl ? undefined : t("adminLiveSessions.saveCredentialsToSeeWebhook")}
                      InputProps={{ readOnly: true }}
                      sx={{ "& .MuiInputBase-input": { fontSize: "0.8rem", fontFamily: "monospace" } }}
                    />
                    <IconButton
                      size="small"
                      disabled={!webhookUrl?.trim()}
                      onClick={() => {
                        const url = webhookUrl?.trim();
                        if (!url) return;
                        navigator.clipboard.writeText(url).then(
                          () => showToast(t("adminLiveSessions.webhookUrlCopied"), "success"),
                          () => showToast(t("adminLiveSessions.failedToCopy"), "error")
                        );
                      }}
                      aria-label={t("adminLiveSessions.copyWebhookUrl")}
                    >
                      <IconWrapper icon="mdi:content-copy" size={18} />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" sx={{ color: "#9ca3af", mt: 0.5, display: "block" }}>
                    {t("adminLiveSessions.webhookEndpointHint")}
                  </Typography>
                  {webhookConfigured && (
                    <Chip
                      label={t("adminLiveSessions.webhookActive")}
                      size="small"
                      sx={{ mt: 1, bgcolor: "#d1fae5", color: "#065f46", fontWeight: 600, fontSize: "0.7rem" }}
                    />
                  )}
                </Box>
              )}
              <TextField
                label={t("adminLiveSessions.timezoneOptional")}
                value={form.timezone ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                size="small"
                fullWidth
                placeholder={t("adminLiveSessions.timezonePlaceholder")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active ?? false}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    color="primary"
                  />
                }
                label={t("adminLiveSessions.active")}
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
                {t("adminLiveSessions.zoomMarketplaceSetup")}
              </Button>
              <Collapse in={showSetupHelp}>
                <Box sx={{ mt: 1, p: 2, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e2e8f0" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>
                    {t("adminLiveSessions.requiredScopes")}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "0.8125rem", color: "#475569" }}>
                    <li>{t("adminLiveSessions.scopeMeetingWrite")}</li>
                    <li>{t("adminLiveSessions.scopeRecordingRead")}</li>
                    <li>{t("adminLiveSessions.scopeMeetingReadAdmin")}</li>
                  </Box>
                  <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                    {t("adminLiveSessions.reauthorizeHint")}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mt: 2, mb: 1 }}>
                    {t("adminLiveSessions.eventSubscriptions")}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: "0.8125rem", color: "#475569" }}>
                    <li>{t("adminLiveSessions.endpointUrlHint")}</li>
                    <li>{t("adminLiveSessions.secretTokenHint")}</li>
                    <li>{t("adminLiveSessions.subscribeToEvents")}</li>
                  </Box>
                </Box>
              </Collapse>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={onClose}>{t("adminLiveSessions.cancel")}</Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={
                  saving ? <CircularProgress size={18} color="inherit" /> : <IconWrapper icon="mdi:content-save" size={18} />
                }
                sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
              >
                {saving ? t("adminLiveSessions.saving") : t("adminLiveSessions.save")}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
