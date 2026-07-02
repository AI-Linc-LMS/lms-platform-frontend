"use client";

import { Box, Typography, Link } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

/** Inline monospace scope/value token. */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="code"
      sx={{
        fontFamily: "monospace",
        fontSize: "0.72rem",
        bgcolor: "var(--surface)",
        border: "1px solid var(--border-default)",
        borderRadius: 0.5,
        px: 0.5,
        py: "1px",
        color: "var(--font-primary)",
        wordBreak: "break-all",
      }}
    >
      {children}
    </Box>
  );
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 2, mb: 0.75 }}>
      {children}
    </Typography>
  );
}

const extLink = { color: "var(--accent-indigo)", fontWeight: 600 };
const liSx = { mb: 0.75, color: "var(--font-secondary)", fontSize: "0.8125rem", lineHeight: 1.55 };

/**
 * Step-by-step Google Meet / Calendar setup guide shown (collapsed by default) inside the Google
 * Credentials modal. Mirrors ZoomSetupGuide. `redirectUri` is the exact OAuth redirect URI the
 * connect flow uses (deterministic from the backend) — the #1 thing to whitelist, since a mismatch
 * yields the "Access blocked: redirect_uri_mismatch" error.
 */
export function GoogleSetupGuide({ redirectUri }: { redirectUri?: string }) {
  const { t } = useTranslation("common");
  const uri = redirectUri || "https://<your-backend>/central-auth/oauth/google/calendar/callback";

  return (
    <Box
      sx={{
        mt: 1,
        p: 2,
        bgcolor: "var(--surface)",
        borderRadius: 1.5,
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Prerequisites */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          p: 1.25,
          mb: 1,
          borderRadius: 1,
          bgcolor: "color-mix(in srgb, var(--warning-500) 10%, var(--surface) 90%)",
          border: "1px solid color-mix(in srgb, var(--warning-500) 28%, var(--border-default) 72%)",
        }}
      >
        <IconWrapper icon="mdi:shield-key-outline" size={18} color="var(--warning-500)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
          {t(
            "adminLiveSessions.googleGuidePrereq",
            "You need access to the Google Cloud project that owns the platform's OAuth app (or provide your own under Advanced). You'll also need a Google account to host the meetings — its calendar holds the events and its refresh token is stored. A regular Gmail account works; a Google Workspace account is fine too."
          )}
        </Typography>
      </Box>

      {/* Part 1 */}
      <StepHeading>{t("adminLiveSessions.googleGuidePart1", "Part 1 — Configure the Google Cloud OAuth app")}</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Open the{" "}
          <Link href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener" sx={extLink}>
            Google Cloud Console
          </Link>{" "}
          and select the project that owns your OAuth client.
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Enable the Calendar API</strong>:{" "}
          <Link href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noopener" sx={extLink}>
            APIs &amp; Services → Library → Google Calendar API → Enable
          </Link>
          . Without this, meeting creation fails with a 403.
        </Box>
        <Box component="li" sx={liSx}>
          <strong>OAuth consent screen</strong> → add the scope <Code>.../auth/calendar.events</Code> (plus{" "}
          <Code>openid</Code> and <Code>email</Code>, usually already present for login).
        </Box>
        <Box component="li" sx={liSx}>
          If the app is in <strong>Testing</strong> mode, add the Google account you&apos;ll connect under{" "}
          <strong>Test users</strong> — otherwise Google shows &quot;app isn&apos;t verified&quot; / access_denied.
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Credentials</strong> → open your <strong>OAuth 2.0 Client ID</strong> →{" "}
          <strong>Authorized redirect URIs</strong> → <strong>+ Add URI</strong> and paste{" "}
          <strong>exactly</strong>:
          <Box sx={{ mt: 0.5 }}>
            <Code>{uri}</Code>
          </Box>
          <Box sx={{ mt: 0.5 }}>
            Then <strong>Save</strong>. Exact match matters: no trailing slash, <Code>https</Code> not{" "}
            <Code>http</Code>, exact host. A mismatch is the <Code>redirect_uri_mismatch</Code> error.
          </Box>
        </Box>
      </Box>

      {/* Part 2 */}
      <StepHeading>{t("adminLiveSessions.googleGuidePart2", "Part 2 — Connect (this screen)")}</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Click <strong>Connect Google</strong> and choose the account that will host the meetings.
        </Box>
        <Box component="li" sx={liSx}>
          On the Google consent screen, grant <strong>Calendar</strong> access. You&apos;ll be redirected back and
          the card will show <strong>&quot;Google Meet is connected&quot;</strong>.
        </Box>
        <Box component="li" sx={liSx}>
          Optional: open <strong>Settings</strong> to set a specific <strong>Calendar ID</strong> or{" "}
          <strong>timezone</strong> (defaults to the account&apos;s primary calendar).
        </Box>
      </Box>

      {/* Part 3 — bring your own app (optional) */}
      <StepHeading>{t("adminLiveSessions.googleGuidePart3", "Part 3 — Use your own Google app (optional)")}</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Under <strong>Advanced</strong> above you can paste your own <strong>OAuth client ID / secret</strong>{" "}
          instead of the platform&apos;s. If you do, add the same redirect URI to <em>your</em> client and{" "}
          <strong>Reconnect</strong> afterwards.
        </Box>
      </Box>

      {/* Production note */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          mt: 2,
          p: 1.25,
          borderRadius: 1,
          bgcolor: "color-mix(in srgb, var(--accent-indigo) 9%, var(--surface) 91%)",
          border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, var(--border-default) 72%)",
        }}
      >
        <IconWrapper icon="mdi:check-decagram-outline" size={18} color="var(--accent-indigo)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
          {t(
            "adminLiveSessions.googleGuideVerifyNote",
            "calendar.events is a sensitive scope. For dev/testing the Test-users allowlist is enough; to open it to everyone, the OAuth app must go through Google's verification review once."
          )}
        </Typography>
      </Box>
    </Box>
  );
}
