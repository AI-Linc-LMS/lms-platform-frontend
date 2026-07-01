"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Paper, Typography, Button, Chip, Skeleton, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { googleService, GoogleCredentials } from "@/lib/services/google.service";
import { GoogleCredentialsDialog } from "./GoogleCredentialsDialog";

/**
 * Google Meet connection card for the admin live-sessions page. Mirrors ZoomSetupCard, but the
 * Google flow is a one-click OAuth "Connect Google" (we store a refresh token) rather than pasted
 * credentials. Self-contained: loads its own status so the page only has to render it.
 */
export function GoogleSetupCard() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creds, setCreds] = useState<GoogleCredentials | null>(null);
  const [redirectUri, setRedirectUri] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { credentials, redirectUri: uri } = await googleService.getGoogleCredentials();
      setCreds(credentials);
      setRedirectUri(uri);
    } catch {
      setCreds(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const copyRedirectUri = () => {
    if (!redirectUri) return;
    navigator.clipboard.writeText(redirectUri).then(
      () => showToast(t("adminLiveSessions.redirectUriCopied", "Redirect URI copied"), "success"),
      () => showToast(t("adminLiveSessions.failedToCopy", "Failed to copy"), "error")
    );
  };

  useEffect(() => {
    load();
  }, [load]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Bounce back to this page; the backend callback stores the refresh token.
      const url = await googleService.startConnect("/admin/live-sessions");
      window.location.href = url;
    } catch {
      setConnecting(false);
      showToast(
        t("adminLiveSessions.googleConnectFailed", "Couldn't start Google connection. Check that Google is configured."),
        "error"
      );
    }
  };

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 2.25, borderRadius: 2, border: "1px solid var(--border-default)" }}>
        <Skeleton variant="text" width={220} height={28} />
        <Skeleton variant="text" width="55%" />
      </Paper>
    );
  }

  const connected = Boolean(creds?.is_connected);
  const active = Boolean(creds?.is_active);
  const ready = connected && active;
  const accent = ready ? "var(--success-500)" : "var(--warning-500)";

  // Connected + active — compact confirmation row.
  if (ready) {
    return (
      <>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
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
            <IconWrapper icon="logos:google-meet" size={22} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                {t("adminLiveSessions.googleConnectedTitle", "Google Meet is connected")}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                {creds?.connected_email
                  ? t("adminLiveSessions.googleConnectedAs", "Meetings are scheduled on {{email}}", { email: creds.connected_email })
                  : t("adminLiveSessions.googleConnectedDesc", "Scheduling a Google Meet session auto-creates the meeting and calendar invite.")}
              </Typography>
            </Box>
          </Box>
          <Button size="small" onClick={() => setSettingsOpen(true)} sx={{ textTransform: "none", color: accent }}>
            {t("adminLiveSessions.manageGoogle", "Manage")}
          </Button>
        </Paper>
        <GoogleCredentialsDialog
          open={settingsOpen}
          creds={creds}
          redirectUri={redirectUri}
          onClose={() => setSettingsOpen(false)}
          onChanged={load}
          onConnect={handleConnect}
          connecting={connecting}
        />
      </>
    );
  }

  // Not connected (or inactive) — connect CTA.
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
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
                bgcolor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="logos:google-meet" size={20} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                  {t("adminLiveSessions.googleConnectTitle", "Connect Google to host Meet sessions")}
                </Typography>
                {connected && !active && (
                  <Chip
                    label={t("adminLiveSessions.googleInactive", "Inactive")}
                    size="small"
                    sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: "color-mix(in srgb, var(--warning-500) 18%, var(--card-bg) 82%)", color: "var(--warning-500)" }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25, mb: 0.5 }}>
                {t(
                  "adminLiveSessions.googleSetupHelp",
                  "Connect a Google account once. After that, scheduling a Google Meet session auto-creates the meeting, adds it to the calendar, and emails enrolled students an invite."
                )}
              </Typography>
              {redirectUri && (
                <Box sx={{ mb: 0.75 }}>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.25 }}>
                    {t("adminLiveSessions.googleRedirectUriHint", "First, add this redirect URI to your Google Cloud OAuth client (Authorized redirect URIs):")}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-tertiary)", fontFamily: "monospace", fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}
                    >
                      {redirectUri}
                    </Typography>
                    <Tooltip title={t("adminLiveSessions.copyRedirectUri", "Copy redirect URI")}>
                      <IconButton size="small" onClick={copyRedirectUri} aria-label={t("adminLiveSessions.copyRedirectUri", "Copy redirect URI")}>
                        <IconWrapper icon="mdi:content-copy" size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
              {creds?.connected_email && (
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                  {t("adminLiveSessions.googleLastConnected", "Last connected: {{email}}", { email: creds.connected_email })}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {connected && (
              <Button onClick={() => setSettingsOpen(true)} sx={{ textTransform: "none", color: "var(--font-secondary)" }}>
                {t("adminLiveSessions.settings", "Settings")}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleConnect}
              disabled={connecting}
              startIcon={<IconWrapper icon="mdi:google" size={18} color="#fff" />}
              sx={{
                bgcolor: "var(--accent-indigo)",
                color: "var(--font-light)",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              }}
            >
              {connected
                ? t("adminLiveSessions.reconnectGoogle", "Reconnect Google")
                : t("adminLiveSessions.connectGoogle", "Connect Google")}
            </Button>
          </Box>
        </Box>
      </Paper>
      <GoogleCredentialsDialog
        open={settingsOpen}
        creds={creds}
        onClose={() => setSettingsOpen(false)}
        onChanged={load}
        onConnect={handleConnect}
        connecting={connecting}
      />
    </>
  );
}
