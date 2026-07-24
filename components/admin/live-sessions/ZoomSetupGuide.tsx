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
 * Step-by-step Zoom setup guide shown (collapsed by default) inside the Zoom Credentials modal.
 * Webinars use the SAME Server-to-Server app - the webinar scopes/events are folded in here, not a
 * separate flow. `webhookUrl` is the tenant's deterministic endpoint URL to paste into Zoom.
 */
export function ZoomSetupGuide({ webhookUrl }: { webhookUrl: string }) {
  const { t } = useTranslation("common");

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
            "adminLiveSessions.guidePrereq",
            "You must be a Zoom account owner/admin to create this app. Recordings + transcripts need a paid plan (Pro or higher) with cloud recording. Webinars additionally need the Zoom Webinar add-on license."
          )}
        </Typography>
      </Box>

      {/* Part 1 */}
      <StepHeading>{t("adminLiveSessions.guidePart1", "Part 1 - Create the Zoom app & get your credentials")}</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Sign in to the{" "}
          <Link href="https://marketplace.zoom.us/" target="_blank" rel="noopener" sx={extLink}>
            Zoom App Marketplace
          </Link>{" "}
          with your Zoom admin login.
        </Box>
        <Box component="li" sx={liSx}>
          Top-right <strong>Develop → Build App</strong> (
          <Link href="https://marketplace.zoom.us/develop/create" target="_blank" rel="noopener" sx={extLink}>
            direct link
          </Link>
          ).
        </Box>
        <Box component="li" sx={liSx}>
          Choose <strong>Server-to-Server OAuth</strong> → <strong>Create</strong>. Name it e.g. “AI Linc LMS”.
        </Box>
        <Box component="li" sx={liSx}>
          <strong>App Credentials</strong> tab - copy <strong>Account ID</strong>, <strong>Client ID</strong> and{" "}
          <strong>Client Secret</strong> into the matching fields above.
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Information</strong> tab - fill the required basics (name, descriptions, company, developer name + email).
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Scopes</strong> tab → <strong>+ Add Scopes</strong>:
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
            <Box component="li" sx={liSx}>
              Meeting - <Code>meeting:write:admin</Code>, <Code>meeting:read:admin</Code>
            </Box>
            <Box component="li" sx={liSx}>
              Cloud Recording - <Code>cloud_recording:read:list_recording_files:admin</Code>
            </Box>
            <Box component="li" sx={liSx}>
              Report (attendance) - <Code>report:read:admin</Code>
            </Box>
            <Box component="li" sx={liSx}>
              <strong>Webinars (optional)</strong> - <Code>webinar:write:admin</Code>, <Code>webinar:read:admin</Code>{" "}
              <em>(needs the Zoom Webinar add-on)</em>
            </Box>
          </Box>
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Feature</strong> tab → <strong>Event Subscriptions</strong>:
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
            <Box component="li" sx={liSx}>
              Copy the <strong>Secret Token</strong> (near the top) → paste it into <strong>Webhook Secret</strong> above.
              ⚠️ Easy to miss - it’s above the events list.
            </Box>
            <Box component="li" sx={liSx}>
              Event notification endpoint URL: <Code>{webhookUrl}</Code> (the same URL shown above).
            </Box>
            <Box component="li" sx={liSx}>
              <strong>+ Add Events</strong> → Meeting → <em>Started</em> & <em>Ended</em>, Recording →{" "}
              <em>All recordings completed</em>. For webinars also add Webinar → <em>Started</em> & <em>Ended</em>.
            </Box>
            <Box component="li" sx={liSx}>
              <strong>Don’t click Validate yet</strong> - do Part 2 first.
            </Box>
          </Box>
        </Box>
        <Box component="li" sx={liSx}>
          <strong>Activation</strong> tab - you’ll come back and Activate the app after Part 3.
        </Box>
      </Box>

      {/* Part 2 */}
      <StepHeading>{t("adminLiveSessions.guidePart2", "Part 2 - Save the values here (this screen)")}</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Paste <strong>Account ID</strong>, <strong>Client ID</strong>, <strong>Client Secret</strong> and the{" "}
          <strong>Webhook Secret</strong> (= the Secret Token) into the fields above.
        </Box>
        <Box component="li" sx={liSx}>
          Toggle <strong>Active</strong> <strong>ON</strong> - required, or webhook validation fails with a 403.
        </Box>
        <Box component="li" sx={liSx}>
          Click <strong>Save</strong>.
        </Box>
      </Box>

      {/* Part 3 */}
      <StepHeading>{t("adminLiveSessions.guidePart3", "Part 3 - Validate & activate")}</StepHeading>
      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
        <Box component="li" sx={liSx}>
          Back in Zoom → <strong>Event Subscriptions</strong> → click <strong>Validate</strong> - it should turn green.
        </Box>
        <Box component="li" sx={liSx}>
          Go to the <strong>Activation</strong> tab → <strong>Activate</strong> the app.
        </Box>
      </Box>

      {/* Webinar note */}
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
        <IconWrapper icon="mdi:presentation" size={18} color="var(--accent-indigo)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
          {t(
            "adminLiveSessions.guideWebinarNote",
            "Webinars use the same Server-to-Server app - just add the webinar scopes and the Webinar → Started/Ended events above, and make sure your Zoom account has the Webinar add-on. No separate app or webhook is needed."
          )}
        </Typography>
      </Box>
    </Box>
  );
}
