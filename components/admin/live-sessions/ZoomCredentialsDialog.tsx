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
import { LoadingButton } from "@/components/common/LoadingButton";
import type { ZoomDiagnostics } from "@/lib/services/zoom.service";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { zoomService, ZoomCredentials } from "@/lib/services/zoom.service";
import { config } from "@/lib/config";
import { ZoomSetupGuide } from "./ZoomSetupGuide";

interface ZoomCredentialsDialogProps {
  /** Run the connection check as soon as the dialog opens (from the card's Check button). */
  autoCheck?: boolean;
  onAutoCheckHandled?: () => void;
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

export function ZoomCredentialsDialog({ open, onClose, autoCheck, onAutoCheckHandled}: ZoomCredentialsDialogProps) {
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
  const [checking, setChecking] = useState(false);
  const [diagnostics, setDiagnostics] = useState<ZoomDiagnostics | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

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

  /**
   * Verify the saved connection against Zoom for real. Deliberately separate from Save: an admin
   * should be able to re-check at any time without re-entering the client secret (which the GET
   * never returns), and the check is read-only so it can be run before every term starts.
   */
  useEffect(() => {
    if (!open || !autoCheck) return;
    void handleCheckConnection();
    onAutoCheckHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoCheck]);

  const handleCheckConnection = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      setDiagnostics(await zoomService.runZoomDiagnostics());
    } catch (e) {
      const detail = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCheckError(detail || "Couldn't reach Zoom to run the check. Please try again.");
      setDiagnostics(null);
    } finally {
      setChecking(false);
    }
  };

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

  // Webhook URL is deterministic from the API base + tenant id, so show it immediately (don't make
  // the admin save first just to read the URL they need to paste into Zoom).
  const derivedWebhookUrl = (
    webhookUrl?.trim() || `${config.apiBaseUrl}/webhooks/clients/${config.clientId}/zoom/`
  ).trim();

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
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:video-account" size={24} color="var(--accent-indigo)" />
          <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--font-primary)" }}>
            {t("adminLiveSessions.zoomCredentialsTitle")}
          </span>
        </Box>
        <IconButton
          aria-label={t("adminLiveSessions.close")}
          onClick={onClose}
          size="small"
          sx={{ color: "var(--font-secondary)" }}
        >
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
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
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--font-secondary)", mb: 0.5, display: "block" }}
                >
                  {t("adminLiveSessions.subscriptionEndpointUrl")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    value={derivedWebhookUrl}
                    size="small"
                    fullWidth
                    InputProps={{ readOnly: true }}
                    sx={{ "& .MuiInputBase-input": { fontSize: "0.8rem", fontFamily: "monospace" } }}
                  />
                  <IconButton
                    size="small"
                    disabled={!derivedWebhookUrl}
                    onClick={() => {
                      if (!derivedWebhookUrl) return;
                      navigator.clipboard.writeText(derivedWebhookUrl).then(
                        () => showToast(t("adminLiveSessions.webhookUrlCopied"), "success"),
                        () => showToast(t("adminLiveSessions.failedToCopy"), "error")
                      );
                    }}
                    aria-label={t("adminLiveSessions.copyWebhookUrl")}
                  >
                    <IconWrapper icon="mdi:content-copy" size={18} />
                  </IconButton>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--font-tertiary)", mt: 0.5, display: "block" }}
                >
                  {t("adminLiveSessions.webhookEndpointHint")}
                </Typography>
                <Chip
                  label={webhookConfigured ? t("adminLiveSessions.webhookActive") : t("adminLiveSessions.webhookPending", "Webhook not verified yet")}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: webhookConfigured
                      ? "color-mix(in srgb, var(--success-500) 16%, transparent)"
                      : "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                    color: webhookConfigured ? "var(--success-500)" : "var(--warning-500)",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              </Box>
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
                startIcon={<IconWrapper icon="mdi:help-circle-outline" size={18} />}
                endIcon={
                  <IconWrapper icon={showSetupHelp ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />
                }
                sx={{
                  textTransform: "none",
                  color: "var(--accent-indigo)",
                  "&:hover": {
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                  },
                }}
              >
                {showSetupHelp
                  ? t("adminLiveSessions.hideSetupGuide", "Hide setup guide")
                  : t("adminLiveSessions.viewSetupGuide", "First time? View the step-by-step setup guide")}
              </Button>
              <Collapse in={showSetupHelp}>
                <ZoomSetupGuide webhookUrl={derivedWebhookUrl} />
              </Collapse>
            </Box>
            {/* Results of the connection check. Rendered above the actions so a failure is read
                before the admin closes the dialog assuming everything is fine. */}
            {(diagnostics || checkError) && (
              <Box sx={{ mb: 2, p: 1.75, borderRadius: "12px", border: "1px solid var(--border-default)" }}>
                {checkError && (
                  <Typography sx={{ color: "#ef4444", fontWeight: 700, fontSize: "0.86rem" }}>
                    {checkError}
                  </Typography>
                )}
                {diagnostics && (
                  <>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", mb: 1,
                      color: diagnostics.overall === "ok" ? "#10b981"
                        : diagnostics.overall === "warn" ? "#f59e0b" : "#ef4444" }}>
                      {diagnostics.overall === "ok"
                        ? "Everything checks out — you're ready to schedule."
                        : diagnostics.overall === "warn"
                        ? "Works, but some optional features are unavailable."
                        : "Something needs fixing before you schedule a session."}
                    </Typography>
                    {diagnostics.checks.map((c) => {
                      const tone =
                        c.status === "ok" ? "#10b981"
                        : c.status === "warn" ? "#f59e0b"
                        : c.status === "fail" ? "#ef4444" : "var(--font-tertiary)";
                      const icon =
                        c.status === "ok" ? "mdi:check-circle"
                        : c.status === "warn" ? "mdi:alert-circle"
                        : c.status === "fail" ? "mdi:close-circle" : "mdi:minus-circle-outline";
                      return (
                        <Box key={c.key} sx={{ display: "flex", gap: 1, py: 0.6,
                          borderTop: "1px solid var(--border-default)" }}>
                          <IconWrapper icon={icon} size={17} color={tone} style={{ flexShrink: 0, marginTop: 2 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.84rem" }}>{c.label}</Typography>
                            <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)", wordBreak: "break-word" }}>
                              {c.detail}
                            </Typography>
                            {c.fix && (
                              <Typography sx={{ fontSize: "0.78rem", color: tone, mt: 0.25, wordBreak: "break-word" }}>
                                Fix: {c.fix}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </>
                )}
              </Box>
            )}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <LoadingButton
                variant="outlined"
                onClick={handleCheckConnection}
                loading={checking}
                loadingText="Checking…"
                startIcon={<IconWrapper icon="mdi:shield-check-outline" size={18} />}
                sx={{ mr: "auto", borderRadius: "12px", textTransform: "none", fontWeight: 700 }}
              >
                Check connection
              </LoadingButton>
              <Button
                onClick={onClose}
                sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}
              >
                {t("adminLiveSessions.cancel")}
              </Button>
              <LoadingButton
                variant="contained"
                onClick={handleSave}
                loading={saving}
                loadingText={t("common.saving")}
                startIcon={<IconWrapper icon="mdi:content-save" size={18} />}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "var(--accent-indigo)",
                  color: "#fff",
                  "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                  "&.Mui-disabled": {
                    color: "var(--font-secondary)",
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 24%, var(--surface) 76%)",
                  },
                }}
              >
                {t("adminLiveSessions.save")}
              </LoadingButton>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
