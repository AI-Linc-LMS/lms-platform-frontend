"use client";

import { Box, Paper, Typography, Button, Chip, IconButton, Tooltip, Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";

export interface ZoomSetupStatus {
  loading: boolean;
  configured: boolean; // account_id + client_id present (S2S)
  active: boolean; // is_active toggle on
  webhookConfigured: boolean; // webhook secret saved + verified
  webhookUrl: string | null;
  // One-click OAuth ("Connect Zoom")
  oauthAvailable: boolean; // platform Zoom OAuth app configured on the server
  oauthConnected: boolean; // this tenant connected via OAuth
  connectedEmail: string | null;
  needsReconnect: boolean;
}

interface ZoomSetupCardProps {
  status: ZoomSetupStatus;
  onConfigure: () => void;
  /** Start the one-click OAuth connect (redirects to Zoom). */
  onConnect?: () => void;
  /** Disconnect the OAuth-connected Zoom account. */
  onDisconnect?: () => void;
  connecting?: boolean;
}

/**
 * Surfaces the Zoom connection state at the top of the admin live-sessions page so admins always
 * know what's set up and what's left - replacing the easy-to-miss header button + once-only auto-open.
 */
export function ZoomSetupCard({ status, onConfigure, onConnect, onDisconnect, connecting }: ZoomSetupCardProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  if (status.loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.25, mb: 3, borderRadius: 2, border: "1px solid var(--border-default)" }}>
        <Skeleton variant="text" width={220} height={28} />
        <Skeleton variant="text" width="60%" />
      </Paper>
    );
  }

  // ── One-click OAuth: connected confirmation ──────────────────────────────
  if (status.oauthConnected && !status.needsReconnect) {
    const accent = "var(--success-500)";
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: "18px",
          border: `1px solid color-mix(in srgb, ${accent} 32%, var(--border-default) 68%)`,
          bgcolor: `color-mix(in srgb, ${accent} 8%, var(--surface) 92%)`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
          <IconWrapper icon="mdi:check-decagram" size={24} color={accent} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              {t("adminLiveSessions.zoomConnectedTitle", "Zoom is connected and ready")}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
              {status.connectedEmail
                ? t("adminLiveSessions.zoomConnectedAs", "Connected as {{email}}", { email: status.connectedEmail })
                : t("adminLiveSessions.zoomConnectedDesc", "Meetings, attendance, recordings and transcripts will sync automatically.")}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {onConnect && (
            <Button size="small" onClick={onConnect} disabled={connecting} sx={{ textTransform: "none", borderRadius: "12px", color: "var(--font-secondary)" }}>
              {t("adminLiveSessions.reconnectZoom", "Reconnect")}
            </Button>
          )}
          {onDisconnect && (
            <Button size="small" onClick={onDisconnect} sx={{ textTransform: "none", borderRadius: "12px", color: "var(--error-500)" }}>
              {t("adminLiveSessions.disconnectZoom", "Disconnect")}
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  // ── One-click OAuth: not connected (or needs reconnect) → prominent Connect button ──
  if (status.oauthAvailable) {
    const needs = status.needsReconnect;
    const accent = needs ? "var(--warning-500)" : "var(--accent-indigo)";
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: "18px",
          border: `1px solid color-mix(in srgb, ${accent} 30%, var(--border-default) 70%)`,
          bgcolor: "var(--card-bg)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: "1 1 320px" }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", flexShrink: 0, bgcolor: `color-mix(in srgb, ${accent} 14%, var(--surface) 86%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconWrapper icon="mdi:video-account" size={24} color={accent} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              {needs
                ? t("adminLiveSessions.zoomReconnectTitle", "Reconnect your Zoom account")
                : t("adminLiveSessions.zoomOauthTitle", "Connect Zoom in one click")}
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25 }}>
              {needs
                ? t("adminLiveSessions.zoomReconnectDesc", "Your Zoom authorization expired. Reconnect to keep hosting sessions.")
                : t("adminLiveSessions.zoomOauthDesc", "Authorize once with your Zoom account - no app IDs or secrets to copy. Scheduling a session then auto-creates the Zoom meeting.")}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Button
            variant="contained"
            onClick={onConnect}
            disabled={connecting}
            startIcon={<IconWrapper icon="mdi:video-plus" size={18} color="#fff" />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", whiteSpace: "nowrap", bgcolor: "var(--accent-indigo)", color: "#fff", "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
          >
            {connecting
              ? t("adminLiveSessions.connecting", "Connecting…")
              : needs
                ? t("adminLiveSessions.reconnectZoom", "Reconnect Zoom")
                : t("adminLiveSessions.connectZoom", "Connect Zoom")}
          </Button>
          <Button size="small" onClick={onConfigure} sx={{ textTransform: "none", color: "var(--font-tertiary)", fontSize: "0.75rem" }}>
            {t("adminLiveSessions.enterCredentialsManually", "Enter credentials manually")}
          </Button>
        </Box>
      </Paper>
    );
  }

  const ready = status.configured && status.active && status.webhookConfigured;
  const accent = ready ? "var(--success-500)" : status.configured ? "var(--accent-indigo)" : "var(--warning-500)";

  const copyWebhook = () => {
    const url = status.webhookUrl?.trim();
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => showToast(t("adminLiveSessions.webhookUrlCopied", "Webhook URL copied"), "success"),
      () => showToast(t("adminLiveSessions.failedToCopy", "Failed to copy"), "error")
    );
  };

  // Fully connected - compact confirmation row.
  if (ready) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          borderRadius: 2,
          border: `1px solid color-mix(in srgb, ${accent} 32%, var(--border-default) 68%)`,
          bgcolor: `color-mix(in srgb, ${accent} 8%, var(--surface) 92%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <IconWrapper icon="mdi:check-decagram" size={24} color={accent} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              {t("adminLiveSessions.zoomConnectedTitle", "Zoom is connected and ready")}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
              {t("adminLiveSessions.zoomConnectedDesc", "Meetings, attendance, recordings and transcripts will sync automatically.")}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {status.webhookUrl && (
            <Tooltip title={t("adminLiveSessions.copyWebhookUrl", "Copy webhook URL")}>
              <IconButton size="small" onClick={copyWebhook} aria-label={t("adminLiveSessions.copyWebhookUrl", "Copy webhook URL")}>
                <IconWrapper icon="mdi:content-copy" size={18} />
              </IconButton>
            </Tooltip>
          )}
          <Button size="small" onClick={onConfigure} sx={{ textTransform: "none", color: accent }}>
            {t("adminLiveSessions.manageZoom", "Manage")}
          </Button>
        </Box>
      </Paper>
    );
  }

  // Steps: connect credentials -> activate -> webhook. Show progress + a clear CTA.
  const steps = [
    {
      done: status.configured,
      label: t("adminLiveSessions.stepCredentials", "Add your Zoom Server-to-Server app credentials"),
    },
    {
      done: status.configured && status.active,
      label: t("adminLiveSessions.stepActivate", "Turn the integration on (Active)"),
    },
    {
      done: status.webhookConfigured,
      label: t("adminLiveSessions.stepWebhook", "Add the webhook URL + secret in Zoom for auto-sync"),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 2,
        border: `1px solid color-mix(in srgb, ${accent} 34%, var(--border-default) 66%)`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 8%, var(--surface) 92%), color-mix(in srgb, ${accent} 15%, var(--surface) 85%))`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flex: "1 1 320px" }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: `color-mix(in srgb, ${accent} 20%, var(--card-bg) 80%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:video-account" size={22} color={accent} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                {status.configured
                  ? t("adminLiveSessions.zoomFinishSetupTitle", "Finish connecting Zoom")
                  : t("adminLiveSessions.zoomConnectTitle", "Connect Zoom to host live classes")}
              </Typography>
              <Chip
                label={t("adminLiveSessions.setupProgress", "{{done}}/{{total}} done", { done: doneCount, total: steps.length })}
                size="small"
                sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: `color-mix(in srgb, ${accent} 18%, var(--card-bg) 82%)`, color: accent }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25, mb: 1.5 }}>
              {t(
                "adminLiveSessions.zoomSetupHelp",
                "Create a Server-to-Server OAuth app in the Zoom Marketplace, then paste its credentials here. Once connected, scheduling a session auto-creates the Zoom meeting and emails enrolled students."
              )}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.5 }}>
              {steps.map((s, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconWrapper
                    icon={s.done ? "mdi:check-circle" : "mdi:circle-outline"}
                    size={18}
                    color={s.done ? "var(--success-500)" : "var(--font-tertiary)"}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: s.done ? "var(--font-tertiary)" : "var(--font-primary)", textDecoration: s.done ? "line-through" : "none", fontSize: "0.82rem" }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            {status.configured && status.webhookUrl && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontFamily: "monospace", fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>
                  {status.webhookUrl}
                </Typography>
                <Tooltip title={t("adminLiveSessions.copyWebhookUrl", "Copy webhook URL")}>
                  <IconButton size="small" onClick={copyWebhook}>
                    <IconWrapper icon="mdi:content-copy" size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={onConfigure}
          startIcon={<IconWrapper icon="mdi:cog-outline" size={18} />}
          sx={{
            bgcolor: "var(--accent-indigo)",
            color: "var(--font-light)",
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
          }}
        >
          {status.configured
            ? t("adminLiveSessions.finishSetup", "Finish setup")
            : t("adminLiveSessions.setUpZoom", "Set up Zoom")}
        </Button>
      </Box>
    </Paper>
  );
}
