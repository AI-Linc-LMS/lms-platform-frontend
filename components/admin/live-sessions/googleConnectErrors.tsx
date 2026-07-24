"use client";

import { Box, Paper, Typography, IconButton, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Plain-language guidance for every way the Google "Connect" round-trip can fail.
 *
 * The backend callback now routes ALL consent failures back here with ?google_connected=0&
 * error=<code> (it used to dead-end on a bare 400 for the "Access blocked" path). This maps
 * each code to what a NON-TECHNICAL admin should actually do - the #1 case being Google's
 * "Access blocked" interstitial (error=access_denied), which has four distinct causes that
 * look identical to the person clicking Connect.
 */

export interface GoogleConnectErrorInfo {
  title: string;
  intro: string;
  /** Ordered, concrete fixes - each one line, no jargon where avoidable. */
  fixes: string[];
}

const ACCESS_BLOCKED: GoogleConnectErrorInfo = {
  title: "Google showed “Access blocked” (or you cancelled)",
  intro:
    "Google refused before asking for permissions. This is a Google-side setting on the OAuth app or your Google account - one of these four, in order of likelihood:",
  fixes: [
    "The app is in “Testing” mode and your Google account isn't on its Test users list → in Google Cloud Console open “APIs & Services → OAuth consent screen → Audience/Test users” and add the exact Google account you're connecting, then retry.",
    "You connected with a personal account but the app is “Internal” → either use an account from the app's Google Workspace organization, or set the consent screen User type to “External”.",
    "Your Google Workspace organization blocks unverified third-party apps → a Workspace admin must allow this app in “Admin console → Security → API controls → App access control”.",
    "The app is published but not verified by Google → on the warning screen you can click “Advanced → Go to <app> (unsafe)” to proceed, or complete Google's verification once for a clean screen.",
  ],
};

const ERROR_MAP: Record<string, GoogleConnectErrorInfo> = {
  access_denied: ACCESS_BLOCKED,
  org_internal: ACCESS_BLOCKED,
  admin_policy_enforced: {
    title: "Your Google Workspace blocks this app",
    intro: "Your organization's Google admin has restricted which apps can access Google data.",
    fixes: [
      "Ask your Google Workspace admin to allow this app in “Admin console → Security → API controls → App access control”, then retry Connect.",
    ],
  },
  invalid_state: {
    title: "The connection attempt expired",
    intro: "The secure hand-off between this page and Google is only valid for 10 minutes.",
    fixes: ["Just click “Connect Google” again and complete the Google screens within a few minutes."],
  },
  not_configured: {
    title: "Google isn't configured on the platform yet",
    intro: "There is no Google OAuth app set up for this environment.",
    fixes: [
      "If you manage the platform: set the Google OAuth client ID/secret (or add your own under Advanced in Settings), then retry.",
      "Otherwise contact your platform administrator.",
    ],
  },
  token_exchange_failed: {
    title: "Couldn't reach Google to finish connecting",
    intro: "The final token exchange with Google failed - usually a temporary network problem.",
    fixes: ["Wait a moment and click “Connect Google” again."],
  },
  token_rejected: {
    title: "Google rejected the connection",
    intro: "Google refused the final token exchange. This usually means the OAuth client secret is wrong, or the redirect URI isn't whitelisted exactly.",
    fixes: [
      "Copy the redirect URI shown on this card and make sure it's listed EXACTLY under “Authorized redirect URIs” on the OAuth client (https, no trailing slash).",
      "If you use your own Google app (Advanced), re-check the client ID and secret, then Reconnect.",
    ],
  },
  no_refresh_token: {
    title: "Google didn't grant offline access",
    intro: "The connection completed but Google didn't return the long-lived token the platform needs.",
    fixes: [
      "Retry Connect and approve ALL requested permissions (don't untick anything on the consent screen).",
      "If it keeps happening, remove the app's access at myaccount.google.com → Security → Third-party access, then Connect again.",
    ],
  },
};

const FALLBACK: GoogleConnectErrorInfo = {
  title: "Google connection failed",
  intro: "The connection didn't complete.",
  fixes: [
    "Retry “Connect Google”. If it fails again, open the Setup guide below and re-check each step - the redirect URI and the Test users list are the usual culprits.",
  ],
};

export function googleConnectErrorInfo(code: string | null | undefined): GoogleConnectErrorInfo {
  return ERROR_MAP[(code || "").trim()] ?? FALLBACK;
}

/** Dismissible troubleshooting panel rendered by GoogleSetupCard after a failed connect. */
export function GoogleConnectErrorPanel({
  code,
  onDismiss,
  onRetry,
}: {
  code: string;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const info = googleConnectErrorInfo(code);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid color-mix(in srgb, var(--error-500, #ef4444) 35%, var(--border-default) 65%)",
        bgcolor: "color-mix(in srgb, var(--error-500, #ef4444) 7%, var(--surface) 93%)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
        <IconWrapper icon="mdi:shield-alert-outline" size={20} color="var(--error-500, #ef4444)" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
            {info.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25 }}>
            {info.intro}
          </Typography>
          <Box component="ol" sx={{ m: 0, mt: 1, pl: 2.5 }}>
            {info.fixes.map((fix, i) => (
              <Box key={i} component="li" sx={{ mb: 0.5, color: "var(--font-secondary)", fontSize: "0.8125rem", lineHeight: 1.55 }}>
                {fix}
              </Box>
            ))}
          </Box>
          <Button size="small" onClick={onRetry} sx={{ mt: 1, textTransform: "none", fontWeight: 700 }}>
            Try connecting again
          </Button>
        </Box>
        <IconButton size="small" onClick={onDismiss} aria-label="Dismiss">
          <IconWrapper icon="mdi:close" size={16} />
        </IconButton>
      </Box>
    </Paper>
  );
}
