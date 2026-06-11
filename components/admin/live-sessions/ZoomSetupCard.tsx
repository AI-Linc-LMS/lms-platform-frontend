"use client";

import { Box, Paper, Typography, Button, Chip, IconButton, Tooltip, Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";

export interface ZoomSetupStatus {
  loading: boolean;
  configured: boolean; // account_id + client_id present
  active: boolean; // is_active toggle on
  webhookConfigured: boolean; // webhook secret saved + verified
  webhookUrl: string | null;
}

interface ZoomSetupCardProps {
  status: ZoomSetupStatus;
  onConfigure: () => void;
}

/**
 * Surfaces the Zoom connection state at the top of the admin live-sessions page so admins always
 * know what's set up and what's left — replacing the easy-to-miss header button + once-only auto-open.
 */
export function ZoomSetupCard({ status, onConfigure }: ZoomSetupCardProps) {
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

  // Fully connected — compact confirmation row.
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
