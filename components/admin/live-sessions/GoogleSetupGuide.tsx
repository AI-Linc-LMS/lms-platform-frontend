"use client";

import { Fragment, type ReactNode } from "react";
import { Box, Typography, Link, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";

/**
 * Step-by-step Google Meet / Calendar setup guide shown (collapsed by default) inside the Google
 * Credentials modal. Written for a NON-technical admin who has never opened Google Cloud Console.
 *
 * `redirectUri` is the exact OAuth redirect URI the connect flow uses (deterministic from the
 * backend) — the #1 thing to whitelist, since a mismatch yields "Access blocked: redirect_uri_mismatch".
 * Wherever a step needs it, the content stores the sentinel {@link REDIRECT_URI_TOKEN}; it is resolved
 * to the live value (with a copy button) at render time.
 *
 * Content is data-driven (below) and reflects the CURRENT console after Google's 2024–2025 reorg of
 * "APIs & Services → OAuth consent screen" into the "Google Auth Platform" surface (Overview /
 * Branding / Audience / Clients / Data Access / Verification center). Navigation was verified against
 * Google's own docs — do not "correct" it back to the old OAuth-consent-screen / Credentials labels.
 */

const REDIRECT_URI_TOKEN = "{{REDIRECT_URI}}";

interface GuideStep {
  instruction: string;
  /** Exact current UI breadcrumb / button label / where on the screen to look. */
  locate?: string;
  /** Plain-language "why this matters" or a gotcha. */
  note?: string;
  /** Exact value(s) to paste verbatim; may be the REDIRECT_URI_TOKEN sentinel. Rendered copyable. */
  code?: string;
  codeLabel?: string;
  linkHref?: string;
  linkLabel?: string;
}

interface GuideSection {
  title: string;
  subtitle?: string;
  steps: GuideStep[];
}

interface TroubleItem {
  symptom: string;
  cause: string;
  fix: string;
}

const PREREQ =
  "Most people never need this guide: on the card below just click “Connect Google”, pick the Google " +
  "account that will host your sessions, tick every permission, and you’re done. You only need the Google " +
  "Cloud steps below if (a) clicking Connect shows a red “Access blocked” page, or (b) you chose the " +
  "Advanced option to run the integration under your OWN Google app. What to have ready: a Google account " +
  "you can sign into (a personal @gmail.com works; a Workspace account is fine too). A “Google Cloud " +
  "project” is just a named container holding Google’s settings for one app — you’ll pick or create one in " +
  "Part 1. If you’re using our shared app, you can skip straight to Part 4, and only dip back into Part 2’s " +
  "Test-users step if Google blocks you.";

const SECTIONS: GuideSection[] = [
  {
    title: "Part 1 — Set up the Google Cloud project (turn on the 3 Google services)",
    subtitle:
      "A “project” is just a named box in Google Cloud that holds all the settings for one app. First pick or " +
      "create the box, then switch on the three Google services (“APIs”) the integration talks to. Do this in order.",
    steps: [
      {
        instruction:
          "Open the Google Cloud Console and sign in with the Google account you want to host your live sessions and calendar.",
        locate: "Use the link below. After sign-in you land on a dashboard with a dark blue bar across the very top.",
        linkHref: "https://console.cloud.google.com/",
        linkLabel: "Open Google Cloud Console",
        note: "Use the SAME account that will actually create the calendar events and Meet links — everything gets attached to whoever you sign in as here.",
      },
      {
        instruction:
          "Check which project is selected in the top blue bar. If it shows the wrong one (or “Select a project”), click it to open the project picker.",
        locate: "Top blue bar, right next to the “Google Cloud” logo — a dropdown showing a project name or “Select a project”.",
        note: "Everything you turn on applies ONLY to the project shown here. Confirming the right project before changing anything is the #1 thing people get wrong.",
      },
      {
        instruction:
          "Have a project already? Select it and skip to the next step. No project yet? In the picker click “NEW PROJECT” (top-right), type a Project name like “Live Sessions Integration”, leave Organization/Location as-is, and click “CREATE”. Wait ~1 minute, then reopen the picker and select it.",
        locate: "In the “Select a project” pop-up: list in the middle, “NEW PROJECT” at top-right. “CREATE” is the blue button at the bottom of the New Project page.",
        linkHref: "https://console.cloud.google.com/projectcreate",
        linkLabel: "Create a new project directly",
        note: "The Project name is just a friendly label you can change later. Google also assigns a permanent Project ID (shown in error messages) — accept the auto-generated one.",
      },
      {
        instruction:
          "Open the API Library to turn on the first service: click the hamburger menu (☰) at the top-left, then “APIs & Services”, then “Library”.",
        locate: "Hamburger ☰ (top-left, next to the logo) → “APIs & Services” → “Library”. The page header reads “API Library” and has a big search box.",
        linkHref: "https://console.cloud.google.com/apis/library",
        linkLabel: "Open the API Library",
        note: "An “API” is just a Google service your app is allowed to talk to; “enabling” one flips it on for your project. Don’t confuse “Library” (the catalog) with “Enabled APIs & services” (only ones already on).",
      },
      {
        instruction:
          "Search “Google Calendar API”, click its result card, then click the blue “Enable” button. Wait for the button to change to “Manage” — that means it’s on.",
        locate: "Detail page titled “Google Calendar API”; the blue “Enable” button is near the top and becomes “Manage” once enabled.",
        linkHref: "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
        linkLabel: "Go straight to the Calendar API page",
        note: "This is what mints the Meet link — a Meet link is created by making a calendar event. (Its internal id is calendar-json.googleapis.com even though the name says “Google Calendar API”.)",
      },
      {
        instruction:
          "Back in the Library, search “Google Meet”, click the card named “Google Meet REST API”, and click “Enable”.",
        locate: "The card/detail title reads “Google Meet REST API” — not plain “Google Meet API”. Searching “Google Meet API” still finds it.",
        linkHref: "https://console.cloud.google.com/apis/library/meet.googleapis.com",
        linkLabel: "Go straight to the Meet REST API page",
        note: "This lets us read the Meet meeting space and its transcript after the session.",
      },
      {
        instruction:
          "Once more in the Library, search “Google Drive API”, click its card, and click “Enable”. You should now have all three services on.",
        locate: "Detail page titled “Google Drive API”; blue “Enable” button near the top.",
        linkHref: "https://console.cloud.google.com/apis/library/drive.googleapis.com",
        linkLabel: "Go straight to the Drive API page",
        note: "Meet recordings land in Drive, so we need this to fetch them afterward. Enabling can take 30–60 seconds to fully take effect — that’s normal.",
      },
    ],
  },
  {
    title: "Part 2 — Configure who can connect (the consent screen)",
    subtitle:
      "The “consent screen” is the Google page that asks “do you allow this app to access your Calendar?”. Here " +
      "you set who’s allowed, list the exact permissions, and add yourself to the approved-tester list. NOTE: " +
      "Google reorganized this area — the old single “OAuth consent screen” page is gone and is now the “Google " +
      "Auth Platform”, split across sub-pages (Overview, Branding, Audience, Clients, Data Access, Verification " +
      "center). Older screenshots online will look different; follow the labels below.",
    steps: [
      {
        instruction:
          "Open the Google Auth Platform: hamburger ☰ → “APIs & Services” → “OAuth consent screen” (this now redirects into Google Auth Platform). On a brand-new project you’ll see an “Overview” page with a blue “GET STARTED” button — click it to begin the one-time setup.",
        locate: "The Google Auth Platform left sub-nav lists: Overview, Branding, Audience, Clients, Data Access, Verification center. On a fresh project, look for “GET STARTED” on Overview.",
        linkHref: "https://console.cloud.google.com/auth/overview",
        linkLabel: "Open Google Auth Platform",
        note: "“OAuth” is just the standard “Sign in with Google / allow access” mechanism. This whole section replaces what older guides call the “OAuth consent screen”.",
      },
      {
        instruction:
          "On the “Branding” page, set “App name” (what users see on the consent screen — your org/product name), pick your account under “User support email”, add your email under “Developer contact information”, then Save. Logo and home/privacy links are optional for testing.",
        locate: "Google Auth Platform → left nav “Branding”. Fields: App name, User support email, App logo, App domain, Developer contact information.",
        linkHref: "https://console.cloud.google.com/auth/branding",
        linkLabel: "Open the Branding page",
        note: "This is where the old consent screen’s top fields moved. Scopes and test users are NOT here — they’re on separate pages below.",
      },
      {
        instruction:
          "Open the “Audience” page and confirm “User type” shows “External”. For a personal @gmail.com account it’s already External and there’s nothing to change — only switch it if it shows “Internal”. Leave “Publishing status” as “Testing” for now.",
        locate: "Google Auth Platform → left nav “Audience”. Look for “User type” (Internal / External) and “Publishing status” (Testing / In production).",
        linkHref: "https://console.cloud.google.com/auth/audience",
        linkLabel: "Open the Audience page",
        note: "“Internal” only works if every connecting account belongs to your own Workspace org and it HARD-BLOCKS outside accounts; “External” + “Testing” + a test-user list is right for almost everyone. (Internal may not even be offered on a personal @gmail.com project.)",
      },
      {
        instruction:
          "Still on Audience, scroll to “Test users”, click “+ Add users”, paste the Google account email(s) that will connect (the account that hosts the calendar), and Save.",
        locate: "Audience page → “Test users” section → “+ Add users” → paste emails → Save.",
        linkHref: "https://console.cloud.google.com/auth/audience",
        linkLabel: "Open the Audience page (Test users)",
        note: "CRITICAL while status is “Testing”: ONLY the exact emails on this list can connect — everyone else gets a red “Access blocked” page with no way around it. Up to 100 testers; each grant also expires after 7 days, so if it stops working after a week, just reconnect.",
      },
      {
        instruction:
          "List the permissions (“scopes”) the app needs: open the “Data Access” page and click “ADD OR REMOVE SCOPES”. A panel opens on the right. Some of our permissions aren’t in the searchable list, so use the reliable route — expand the “Manually add scopes” box.",
        locate: "Google Auth Platform → left nav “Data Access” → “ADD OR REMOVE SCOPES” → in the panel, the “Manually add scopes” text box with an “Add to table” button.",
        linkHref: "https://console.cloud.google.com/auth/scopes",
        linkLabel: "Open the Data Access (scopes) page",
        note: "A “scope” is one specific permission (e.g. “manage calendar events”). Only scopes for APIs you already enabled show in the search list — which is why you enabled all three in Part 1. The “Manually add scopes” box works regardless.",
      },
      {
        instruction:
          "Paste these five scope values into the “Manually add scopes” box, one at a time, clicking “Add to table” after each. Then click “UPDATE” in the panel and “SAVE” on the Data Access page.",
        locate: "The “Manually add scopes” box inside the ADD OR REMOVE SCOPES panel; “Add to table” adds each, “UPDATE” applies them, “SAVE” persists.",
        code:
          "https://www.googleapis.com/auth/calendar.events\n" +
          "https://www.googleapis.com/auth/meetings.space.readonly\n" +
          "https://www.googleapis.com/auth/drive.meet.readonly\n" +
          "openid\n" +
          "https://www.googleapis.com/auth/userinfo.email",
        codeLabel: "The five scope values to add",
        note:
          "calendar.events = create/manage events (to mint the Meet link). meetings.space.readonly = read the Meet/transcript. " +
          "drive.meet.readonly = read the recording Meet saved to Drive. openid + userinfo.email = confirm which account connected. " +
          "Those last two look different from the three long URLs — that’s expected, and “openid” is often added automatically. After UPDATE, Google auto-sorts them into non-sensitive / sensitive / restricted tables (see the note at the end).",
      },
    ],
  },
  {
    title: "Part 3 — Create the connection key (OAuth client + redirect URI)",
    subtitle:
      "The “OAuth client” is the ID card that identifies this app to Google — it produces a “Client ID” (public " +
      "username) and “Client secret” (private password). The “redirect URI” is the exact web address Google sends " +
      "the user back to after they approve — it must be whitelisted here or Google refuses. In the reorg this moved " +
      "from the old “Credentials” page to “Google Auth Platform → Clients”.",
    steps: [
      {
        instruction: "Open the Clients page: hamburger ☰ → “Google Auth Platform” → “Clients” (or use the link), then click “+ CREATE CLIENT”.",
        locate: "Google Auth Platform → left nav “Clients” → “CREATE CLIENT” button above the clients table.",
        linkHref: "https://console.cloud.google.com/auth/clients",
        linkLabel: "Open the Clients page",
        note: "This is the same thing older guides call “Credentials → OAuth 2.0 Client IDs”. If it first asks you to finish Branding/Audience, do Part 2, then come back.",
      },
      {
        instruction: "For “Application type” choose “Web application”. In “Name”, type an internal label like “Live sessions server” (only you see it).",
        locate: "“Create OAuth client ID” form → “Application type” dropdown → “Web application” → “Name” field.",
        note: "Pick “Web application” — this is a server-side redirect flow. The application type CANNOT be changed after creation, so get it right.",
      },
      {
        instruction:
          "Scroll to “Authorized redirect URIs”, click “+ ADD URI”, and paste this EXACT address into the “URIs 1” field. Use the copy button so you get it character-for-character.",
        locate: "On the Web-application form, the “Authorized redirect URIs” section (helper text “For use with requests from a web server”) → “+ ADD URI” → the “URIs 1” input.",
        code: REDIRECT_URI_TOKEN,
        codeLabel: "Paste this exact redirect URI",
        note: "It must match byte-for-byte what our server sends: the https, the host, the path, and no trailing slash all matter. One character off gives the “redirect_uri_mismatch” error. Leave “Authorized JavaScript origins” completely empty — it isn’t needed here.",
      },
      {
        instruction:
          "Click “CREATE”. A dialog titled “OAuth client created” shows your “Client ID” and “Client secret”. Copy BOTH now (or click “Download JSON”) and keep them safe.",
        locate: "The “OAuth client created” pop-up with copy icons next to “Your Client ID” and “Your Client secret”, plus “Download JSON”.",
        note: "IMPORTANT: unlike the old console, Google will NOT show the full secret again later (only the last 4 chars). If you lose it, click “Add secret” to make a new one. You only need these two values for the Advanced path in Part 5 — using our shared app, you can ignore them.",
      },
      {
        instruction:
          "To add or fix the redirect URI on an existing client later: open Google Auth Platform → Clients, click the client’s name, edit “Authorized redirect URIs”, and click “SAVE”.",
        locate: "Google Auth Platform → Clients → click the client name → “Authorized redirect URIs” → edit → “SAVE”.",
        linkHref: "https://console.cloud.google.com/auth/clients",
        linkLabel: "Manage existing clients",
        note: "A banner says changes may take “5 minutes to a few hours”. Usually it’s seconds — but if a just-added URI still errors, recheck the exact string first (a typo is the more common cause), then wait a few minutes.",
      },
    ],
  },
  {
    title: "Part 4 — Connect on this screen",
    subtitle:
      "The actual connection. For most people using our shared Google app this is the ONLY part you need — " +
      "everything above is only for the Advanced path or to fix an Access-blocked error.",
    steps: [
      {
        instruction: "Close this help panel and click the “Connect Google” button on the card behind it.",
        locate: "The “Connect Google” button on the live-sessions connect card, just below this guide.",
        note: "A Google pop-up/redirect opens.",
      },
      {
        instruction:
          "In Google’s “Choose an account” screen, pick the account that will host your sessions — for our shared app, the account we allowlisted for you; if you’re running your own app (Part 5), the account you added as a Test user.",
        locate: "Google’s “Choose an account” / “to continue to [App name]” screen.",
        note: "Picking an account that isn’t allowlisted (while the app is in Testing) shows a red “Access blocked” page — see Troubleshooting. On the shared app, ask us to allowlist your account.",
      },
      {
        instruction:
          "If you see “Google hasn’t verified this app”, click “Advanced”, then “Go to [App name] (unsafe)” to continue. This warning is expected for a testing app and is safe when it’s your own app.",
        locate: "Warning page titled “Google hasn’t verified this app” → small “Advanced” link (bottom-left) → “Go to [App name] (unsafe)”.",
        note: "This softer warning only appears while an app is unverified, and an approved tester CAN get past it via Advanced. It’s different from the red “Access blocked” page, which has no bypass.",
      },
      {
        instruction: "On the permissions screen, make sure EVERY checkbox is ticked — especially the Calendar one — then click “Continue” (or “Allow”).",
        locate: "Consent card “[App name] wants access to your Google Account”, a checkbox per permission, a “Continue” button, and often a “Select all” option.",
        note: "CRITICAL: Google now leaves these UNCHECKED by default. If Calendar is left unchecked we can’t create Meet links and the connection looks broken. Tick everything (or “Select all”).",
      },
      {
        instruction: "You’re redirected back here and the card shows a connected state. Done.",
        locate: "Back on the live-sessions admin page — the card indicates the Google account is connected.",
        note: "If it doesn’t connect, match the exact error you saw against Troubleshooting below.",
      },
    ],
  },
  {
    title: "Part 5 — (Optional) Use your own Google app",
    subtitle:
      "By default we use our shared Google app and you need no Client ID or secret at all. Only follow this if you " +
      "specifically want the integration to run under YOUR OWN Google Cloud project — e.g. your own branding, data " +
      "ownership, or verification. Requires having finished Parts 1–3 in your own project.",
    steps: [
      {
        instruction:
          "Complete Parts 1–3 in your own project first: enable the three APIs, configure the consent screen and scopes, add yourself as a Test user, and create the Web-application OAuth client with the exact redirect URI.",
        locate: "All of Parts 1–3 above, done in the project YOU own.",
        note: "The redirect URI you whitelist on your client must be the exact same one shown in Part 3.",
      },
      {
        instruction:
          "On the connect card, open “Advanced” and paste in your own “Client ID” and “Client secret” (from the “OAuth client created” dialog in Part 3).",
        locate: "The “Advanced: use your own Google app” expander on the connect card, with Client ID and Client secret fields.",
        note: "Lost the secret? Google Auth Platform → Clients → your client → “Add secret” to generate a new one, then use that.",
      },
      {
        instruction: "Save the Advanced settings, then click “Connect Google” and complete the same account-picker → warning → permissions flow from Part 4.",
        locate: "Save on the Advanced panel, then the “Connect Google” button.",
        note: "Because it’s now YOUR app, the consent screen shows YOUR branding, and the Test-user list, verification status, and any Access-blocked behavior are governed by YOUR project.",
      },
    ],
  },
];

const TROUBLESHOOTING: TroubleItem[] = [
  {
    symptom: "Red page “Access blocked: … has not completed the Google verification process” / “Authorization Error” (error access_denied) with no way to click past it.",
    cause: "The app is in “Testing” and the account you signed in with is NOT on the Test-users allowlist. (Different from the softer “Google hasn’t verified this app” warning, which a test user CAN bypass via Advanced.)",
    fix: "Add that exact email as a test user: Google Auth Platform → Audience → “Test users” → “+ Add users” → Save, then retry. On our shared app, ask us to allowlist your account.",
  },
  {
    symptom: "Red page “Error 403: org_internal” / “This client is restricted to users within its organization.”",
    cause: "The app’s User type is “Internal”, which only allows accounts inside the project’s own Workspace org — but you connected an outside account.",
    fix: "Switch to External: Google Auth Platform → Audience → User type → External, then use the Test-users list (Part 2). For a per-tenant calendar integration, External is the correct choice.",
  },
  {
    symptom: "Red page “Error 400: admin_policy_enforced” / “Access to your account data is restricted by policies within your organization.”",
    cause: "The account is a Workspace (company) account whose admin blocks third-party/unverified apps or the Calendar/Meet/Drive scopes. This is decided on the tenant’s side — nothing in your Cloud project overrides it.",
    fix: "The company’s Workspace SUPER ADMIN must allowlist the app: admin.google.com → Security → Access and data control → API controls → “Manage Third-Party App Access” → Add app → search the app or paste its OAuth Client ID → “Trusted”. Only a super admin can do this.",
  },
  {
    symptom: "Red page “Error 400: redirect_uri_mismatch” (often printing the address it received).",
    cause: "The redirect address our server sent doesn’t EXACTLY match any Authorized redirect URI on the client. Matching is byte-exact: https vs http, host spelling, path, even a trailing slash.",
    fix: "Google Auth Platform → Clients → open the client → “Authorized redirect URIs” → add exactly " + REDIRECT_URI_TOKEN + " (use the copy button) → Save. Recheck for typos/trailing slash; if it still errors right after adding, wait a few minutes for propagation.",
  },
  {
    symptom: "Creating a live session fails with HTTP 403 “Google Calendar API has not been used in project … before or it is disabled”.",
    cause: "The Calendar API was never enabled for the selected project (or was just enabled and hasn’t propagated). The same 403 shape can appear for the Meet or Drive API.",
    fix: "Enable it: ☰ → APIs & Services → Library → search “Google Calendar API” → Enable. Also confirm “Google Meet REST API” and “Google Drive API” are on. Just enabled it? Wait 1–2 minutes, then retry — the error’s “Enable it” link drops you on the right page.",
  },
  {
    symptom: "Connection succeeds but Meet-link creation fails, or a grant that worked yesterday stops after ~a week.",
    cause: "Either the Calendar checkbox was left unticked on the consent screen (Google defaults them off → only a partial grant), or — for an app still in Testing — the test user’s 7-day approval expired.",
    fix: "Reconnect and tick EVERY permission (use “Select all”), especially Calendar. For the 7-day expiry just reconnect; to stop it recurring for a long-lived integration, publish the app (needs Google verification — see the note below).",
  },
  {
    symptom: "After a Google Meet session there’s no recording, transcript, or AI summary.",
    cause: "The host account isn’t on a Workspace plan that includes recording (recording isn’t available on personal @gmail.com), nobody pressed “Record”, or drive.meet.readonly wasn’t granted.",
    fix: "Use a Workspace edition that supports recording and have someone start recording during the session. Confirm drive.meet.readonly was ticked at connect time (reconnect and tick all boxes if not). Recordings also take time to process into Drive after the meeting ends.",
  },
];

const VERIFY_NOTE =
  "The permissions here are treated by Google as higher-risk: calendar.events and meetings.space.readonly are " +
  "“sensitive” scopes, and drive.meet.readonly is a “restricted” scope (Google’s most-guarded tier). Practically: " +
  "while your app stays in “Testing” you can use all of them WITHOUT any Google verification — you just add each " +
  "connecting account to the Test-users allowlist (up to 100). That’s the recommended setup for development and " +
  "small tenants, and why most people never touch verification (trade-offs: the 100-user cap and a 7-day grant " +
  "expiry, so users reconnect). If you ever need ANY Google account to connect — not just testers — click " +
  "“Publish app” on the Audience page to go “In production”, which triggers Google’s OAuth verification (brand " +
  "review, scope justification + a demo video for the sensitive scopes, and an annual independent CASA security " +
  "assessment for the restricted drive.meet.readonly scope). Verification can take weeks to months. So: stay in " +
  "Testing + Test users for dev and known tenants; only publish and verify if you must serve arbitrary Google accounts.";

/** Inline monospace token. */
function Code({ children }: { children: ReactNode }) {
  return (
    <Box
      component="code"
      sx={{
        fontFamily: "monospace",
        fontSize: "0.72rem",
        bgcolor: "var(--card-bg)",
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

/** Renders a string, substituting the redirect-URI sentinel with the live value shown as inline code. */
function RichText({ text, redirectUri }: { text: string; redirectUri: string }) {
  if (!text.includes(REDIRECT_URI_TOKEN)) return <>{text}</>;
  const parts = text.split(REDIRECT_URI_TOKEN);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <Code>{redirectUri}</Code>}
        </Fragment>
      ))}
    </>
  );
}

/** Copyable exact value block (redirect URI, scope list, …) with a copy-to-clipboard button. */
function CopyBlock({ value, label }: { value: string; label?: string }) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const copy = () =>
    navigator.clipboard.writeText(value).then(
      () => showToast(t("adminLiveSessions.copiedToClipboard", "Copied"), "success"),
      () => showToast(t("adminLiveSessions.failedToCopy", "Failed to copy"), "error")
    );
  return (
    <Box sx={{ mt: 0.5 }}>
      {label && (
        <Typography variant="caption" sx={{ color: "var(--font-tertiary)", display: "block", mb: 0.25 }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.5,
          p: 0.75,
          bgcolor: "var(--card-bg)",
          border: "1px solid var(--border-default)",
          borderRadius: 1,
        }}
      >
        <Box
          component="pre"
          sx={{
            m: 0,
            flex: 1,
            minWidth: 0,
            fontFamily: "monospace",
            fontSize: "0.72rem",
            lineHeight: 1.6,
            color: "var(--font-primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {value}
        </Box>
        <Tooltip title={t("adminLiveSessions.copy", "Copy")}>
          <IconButton size="small" onClick={copy} aria-label={t("adminLiveSessions.copy", "Copy")} sx={{ mt: "-2px" }}>
            <IconWrapper icon="mdi:content-copy" size={16} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

function StepHeading({ children }: { children: ReactNode }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mt: 2.5, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

const extLink = { color: "var(--accent-indigo)", fontWeight: 600, fontSize: "0.8125rem" } as const;
const bodySx = { color: "var(--font-secondary)", fontSize: "0.8125rem", lineHeight: 1.55 } as const;

function Step({ step, redirectUri }: { step: GuideStep; redirectUri: string }) {
  return (
    <Box component="li" sx={{ mb: 1.25, ...bodySx }}>
      <Box component="span" sx={{ color: "var(--font-primary)", fontWeight: 500 }}>
        {step.instruction}
      </Box>
      {step.locate && (
        <Box sx={{ mt: 0.35, display: "flex", gap: 0.5, alignItems: "flex-start" }}>
          <IconWrapper icon="mdi:map-marker-outline" size={14} color="var(--font-tertiary)" />
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.5 }}>
            <Box component="span" sx={{ fontWeight: 700 }}>Where: </Box>
            {step.locate}
          </Typography>
        </Box>
      )}
      {step.linkHref && (
        <Box sx={{ mt: 0.35 }}>
          <Link href={step.linkHref} target="_blank" rel="noopener" sx={extLink}>
            {step.linkLabel || step.linkHref} ↗
          </Link>
        </Box>
      )}
      {step.code && <CopyBlock value={step.code === REDIRECT_URI_TOKEN ? redirectUri : step.code} label={step.codeLabel} />}
      {step.note && (
        <Box sx={{ mt: 0.35, display: "flex", gap: 0.5, alignItems: "flex-start" }}>
          <IconWrapper icon="mdi:lightbulb-outline" size={14} color="var(--warning-500)" />
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", lineHeight: 1.5 }}>
            <RichText text={step.note} redirectUri={redirectUri} />
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export function GoogleSetupGuide({ redirectUri }: { redirectUri?: string }) {
  const { t } = useTranslation("common");
  const uri = redirectUri || "https://<your-backend>/central-auth/oauth/google/calendar/callback";

  return (
    <Box sx={{ mt: 1, p: 2, bgcolor: "var(--surface)", borderRadius: 1.5, border: "1px solid var(--border-default)" }}>
      {/* Prerequisites / "most people can skip this" */}
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
        <IconWrapper icon="mdi:information-outline" size={18} color="var(--warning-500)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.55 }}>
          <RichText text={PREREQ} redirectUri={uri} />
        </Typography>
      </Box>

      {SECTIONS.map((section) => (
        <Box key={section.title}>
          <StepHeading>{section.title}</StepHeading>
          {section.subtitle && (
            <Typography variant="caption" sx={{ display: "block", color: "var(--font-tertiary)", lineHeight: 1.5, mb: 1 }}>
              {section.subtitle}
            </Typography>
          )}
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            {section.steps.map((step, i) => (
              <Step key={i} step={step} redirectUri={uri} />
            ))}
          </Box>
        </Box>
      ))}

      {/* Troubleshooting — the exact error → why → fix */}
      <StepHeading>Troubleshooting — match the exact error you saw</StepHeading>
      <Box sx={{ display: "grid", gap: 1 }}>
        {TROUBLESHOOTING.map((item, i) => (
          <Box
            key={i}
            sx={{
              p: 1.25,
              borderRadius: 1,
              border: "1px solid var(--border-default)",
              bgcolor: "var(--card-bg)",
            }}
          >
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
              <IconWrapper icon="mdi:alert-circle-outline" size={16} color="var(--error-500, #ef4444)" />
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-primary)", lineHeight: 1.5 }}>
                {item.symptom}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "var(--font-secondary)", lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>Why: </Box>
              {item.cause}
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 0.35, color: "var(--font-secondary)", lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>Fix: </Box>
              <RichText text={item.fix} redirectUri={uri} />
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Scopes / verification note */}
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
        <IconWrapper icon="mdi:shield-check-outline" size={18} color="var(--accent-indigo)" />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", lineHeight: 1.55 }}>
          {t("adminLiveSessions.googleGuideVerifyNote", VERIFY_NOTE)}
        </Typography>
      </Box>
    </Box>
  );
}
