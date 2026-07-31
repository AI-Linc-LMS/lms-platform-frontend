"use client";

import { useEffect, useRef, useState } from "react";
import { clientTimezoneService, FALLBACK_TIMEZONES } from "@/lib/services/client-timezone.service";
import {
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PaymentAccountCard } from "@/components/admin/settings/PaymentAccountCard";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CourseVisibilitySetting } from "@/components/admin/settings/CourseVisibilitySetting";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  fetchClientBranding,
  patchClientBranding,
  uploadBrandingImage,
  uploadFavicon,
} from "@/lib/services/admin/branding.service";
import { MediaField } from "@/components/admin/branding/MediaField";

const FAVICON_ACCEPT =
  "image/png,image/webp,image/x-icon,image/vnd.microsoft.icon";
const BRANDING_ACCEPT = "image/png,image/jpeg,image/webp";
// Matches Client.URLField(max_length=2048). This was 200, which is what produced
// "Logo URL is too long (max 200 characters)" on any real CDN or storage URL.
const LOGO_URL_MAX = 2048;

function SettingCard({
  icon,
  title,
  description,
  children,
  tourId,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
  tourId?: string;
}) {
  return (
    <Paper
      elevation={0}
      data-tour-id={tourId}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "var(--accent-purple)",
            bgcolor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
          }}
        >
          <IconWrapper icon={icon} size={18} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "var(--font-primary)" }}>
          {title}
        </Typography>
      </Box>
      <Typography sx={{ color: "var(--font-secondary)", fontSize: "0.85rem", mb: 1.75, ml: 0.25 }}>
        {description}
      </Typography>
      {children}
    </Paper>
  );
}

/**
 * Live preview of how the branding inputs land in the product: the browser tab
 * (favicon + app name) and the login screen (logo + tagline) on the fixed
 * midnight-hyper palette. Updates as the admin types.
 */
/**
 * A realistic browser-tab chip showing the favicon in situ — and, crucially, a clear error state
 * when the URL can't load, so a broken favicon is *visible* instead of an invisible broken image.
 */
function FaviconTabPreview({ url, appName }: { url: string; appName: string }) {
  const [errored, setErrored] = useState(false);
  useEffect(() => setErrored(false), [url]);
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        pl: 1,
        pr: 1.5,
        py: 0.75,
        borderRadius: "10px 10px 4px 4px",
        border: "1px solid var(--border-default)",
        borderBottom: "none",
        bgcolor: "var(--surface)",
        maxWidth: 220,
      }}
    >
      {errored ? (
        <IconWrapper icon="mdi:image-broken-variant" size={18} color="var(--accent-red, #ef4444)" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          width={18}
          height={18}
          style={{ objectFit: "contain", flexShrink: 0 }}
          onError={() => setErrored(true)}
        />
      )}
      <Typography
        sx={{
          fontSize: "0.8rem",
          color: errored ? "var(--accent-red, #ef4444)" : "var(--font-secondary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {errored ? "Couldn’t load this URL" : appName}
      </Typography>
    </Box>
  );
}

function LivePreview({
  logoUrl,
  faviconUrl,
  loginSlogan,
  appName,
}: {
  logoUrl: string;
  faviconUrl: string;
  loginSlogan: string;
  appName: string;
}) {
  const logo = logoUrl.trim();
  const favicon = faviconUrl.trim();
  const slogan = loginSlogan.trim() || "Learn faster. Grow further.";

  return (
    <Box
      data-tour-id="settings-preview"
      sx={{
        position: { lg: "sticky" },
        top: { lg: 16 },
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2.25, pt: 2, pb: 1.25 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--font-primary)" }}>
          Live preview
        </Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)" }}>
          How your logo, favicon, and tagline appear.
        </Typography>
      </Box>

      {/* Browser-tab mock */}
      <Box sx={{ px: 2.25, pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              maxWidth: 220,
              px: 1.25,
              py: 0.75,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              bgcolor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderBottom: "none",
              boxShadow: "0 -1px 2px rgba(16,24,40,0.04)",
            }}
          >
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={favicon} alt="" width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} />
            ) : (
              <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#c4b5fd", flexShrink: 0 }} />
            )}
            <Typography noWrap sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#334155" }}>
              {appName}
            </Typography>
            <Box component="span" sx={{ ml: 0.25, color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1 }}>
              ×
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.75,
            borderRadius: "0 8px 8px 8px",
            bgcolor: "#f1f5f9",
            border: "1px solid #e5e7eb",
          }}
        >
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #cbd5e1", flexShrink: 0 }} />
          <Typography noWrap sx={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}>
            app.yourdomain.com
          </Typography>
        </Box>
      </Box>

      {/* Login-screen mock (fixed midnight-hyper palette) */}
      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <Box
          sx={{
            borderRadius: 2.5,
            p: 3,
            textAlign: "center",
            color: "#fff",
            background: "radial-gradient(120% 90% at 50% 0%, #2a1150 0%, #14061f 55%, #0f0518 100%)",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          <Box sx={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo" style={{ maxHeight: 44, maxWidth: 200, objectFit: "contain" }} />
            ) : (
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "rgba(255,255,255,0.5)" }}>Your logo</Typography>
            )}
          </Box>
          <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.72)", mb: 2, lineHeight: 1.5 }}>
            {slogan}
          </Typography>
          <Stack spacing={1} sx={{ mb: 1.75 }}>
            {["Email", "Password"].map((ph) => (
              <Box
                key={ph}
                sx={{
                  height: 34,
                  borderRadius: 1.5,
                  bgcolor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  display: "flex",
                  alignItems: "center",
                  px: 1.25,
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{ph}</Typography>
              </Box>
            ))}
          </Stack>
          <Box
            sx={{
              height: 36,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.82rem",
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
            }}
          >
            Sign in
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const { refreshClientInfo, clientInfo } = useClientInfo();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [appLogoUrl, setAppLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAppLogo, setUploadingAppLogo] = useState(false);
  const [loginSlogan, setLoginSlogan] = useState("");
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const b = await fetchClientBranding();
        if (!alive) return;
        setLogoUrl(b.login_logo_url || "");
        setAppLogoUrl(b.app_logo_url || "");
        setFaviconUrl(b.app_icon_url || "");
        const ts = (b.theme_settings || {}) as Record<string, unknown>;
        setLoginSlogan(typeof ts.loginHeroSlogan === "string" ? ts.loginHeroSlogan : "");
      } catch {
        if (alive) showToast("Couldn't load settings.", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [showToast]);

  /**
   * Uploads go to our own S3 and come back as a stable asset URL, never an S3 URL. A
   * persisted S3 URL is either de-signed (403 straight away) or signed and expiring in 7 days.
   */
  const makeUploadHandler = (
    setUrl: (v: string) => void,
    setBusy: (v: boolean) => void,
    what: string
  ) => async (file: File) => {
    setBusy(true);
    try {
      const res = await uploadBrandingImage(file);
      setUrl(res.url || "");
      showToast(`${what} uploaded. Click Save to apply.`, "success");
    } catch (e) {
      showToast(
        e instanceof Error && e.message ? e.message : `${what} upload failed.`,
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleLogoUpload = makeUploadHandler(setLogoUrl, setUploadingLogo, "Logo");
  const handleAppLogoUpload = makeUploadHandler(setAppLogoUrl, setUploadingAppLogo, "Logo");

  const handleFaviconFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const res = await uploadFavicon(file);
      setFaviconUrl(res.url || "");
      showToast("Favicon uploaded - click Save to apply.", "success");
    } catch {
      showToast("Favicon upload failed. Please try a PNG, ICO, or SVG.", "error");
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    }
  };

  // Timezone is saved on its own, NOT with the branding Save button. It changes how every live
  // session is scheduled and displayed, so it should not ride along with a logo edit — and it
  // writes to a different endpoint.
  const [tz, setTz] = useState("");
  const [tzOptions, setTzOptions] = useState<string[]>([]);
  const [tzSaving, setTzSaving] = useState(false);
  const [tzMsg, setTzMsg] = useState<string | null>(null);
  const [tzLoadFailed, setTzLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    clientTimezoneService
      .get()
      .then((d) => {
        if (cancelled) return;
        setTz(d.timezone || "");
        setTzOptions(d.common_timezones?.length ? d.common_timezones : FALLBACK_TIMEZONES);
        setTzLoadFailed(false);
      })
      .catch(() => {
        // Do NOT swallow this. Silently leaving the list empty renders a blank dropdown that also
        // claims "Not set", which is indistinguishable from a tenant with no zone configured.
        if (cancelled) return;
        setTzOptions(FALLBACK_TIMEZONES);
        setTzLoadFailed(true);
      });
    return () => { cancelled = true; };
  }, []);

  const saveTimezone = async (next: string) => {
    setTzSaving(true);
    setTzMsg(null);
    try {
      const d = await clientTimezoneService.set(next);
      setTz(d.timezone || "");
      setTzMsg("Timezone updated. New sessions will default to it.");
    } catch (e) {
      const detail = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setTzMsg(detail || "Couldn't update the timezone.");
    } finally {
      setTzSaving(false);
    }
  };

  const handleSave = async () => {
    const logo = logoUrl.trim();
    if (logo && logo.length > LOGO_URL_MAX) {
      showToast(`Logo URL is too long (max ${LOGO_URL_MAX} characters).`, "error");
      return;
    }
    setSaving(true);
    try {
      await patchClientBranding({
        login_logo_url: logo || null,
        app_logo_url: appLogoUrl.trim() || null,
        app_icon_url: faviconUrl.trim() || null,
        theme_settings: { loginHeroSlogan: loginSlogan },
      });
      await refreshClientInfo();
      showToast("Settings saved.", "success");
    } catch {
      showToast("Couldn't save settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Admin"
        title="Settings"
        description="Manage your app logo, favicon, and login-page text. Colours are set platform-wide and are not editable per client."
        accent="purple"
        icon="mdi:cog-outline"
        action={
          <HeaderActionButton
            icon={saving ? "mdi:loading" : "mdi:content-save-outline"}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving…" : "Save changes"}
          </HeaderActionButton>
        }
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 400px" },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* App logo */}
          <SettingCard
            tourId="settings-logo"
            icon="mdi:image-outline"
            title="App logo"
            description="Shown in the sidebar and on the login page. Upload an image, or paste a permanent image URL."
          >
            <MediaField
              label="Logo"
              value={logoUrl}
              onChange={setLogoUrl}
              onUpload={handleLogoUpload}
              uploading={uploadingLogo}
              accept={BRANDING_ACCEPT}
              aspect="landscape"
              brandText={clientInfo?.name || undefined}
              helperText="PNG, JPEG or WEBP, up to 2MB. Uploads are hosted by us, so the link never expires."
            />
          </SettingCard>

          {/* Email & certificate logo — Client.app_logo_url.
              Separate column from the login logo above, and until now it had no tenant-admin
              write path at all: only a superadmin or the setup wizard could change it, so every
              transactional email and certificate kept whatever was set at provisioning time. */}
          <SettingCard
            icon="mdi:email-outline"
            title="Email & certificate logo"
            description="Used on transactional emails and issued certificates. Often the same as your app logo."
          >
            <MediaField
              label="Logo"
              value={appLogoUrl}
              onChange={setAppLogoUrl}
              onUpload={handleAppLogoUpload}
              uploading={uploadingAppLogo}
              accept={BRANDING_ACCEPT}
              aspect="landscape"
              brandText={clientInfo?.name || undefined}
              helperText="Emails render on a light background, so a logo with a transparent or white background works best."
            />
          </SettingCard>

          {/* Favicon */}
          <SettingCard
            tourId="settings-favicon"
            icon="mdi:star-circle-outline"
            title="Favicon"
            description="The small icon in the browser tab. Upload a square image, or paste a permanent image URL."
          >
            <MediaField
              label="Favicon"
              value={faviconUrl}
              onChange={setFaviconUrl}
              onUpload={(file) => handleFaviconFile(file)}
              uploading={uploadingFavicon}
              accept={FAVICON_ACCEPT}
              aspect="square"
              helperText="PNG, WEBP or ICO, square, 32×32 or larger."
            />
            {faviconUrl.trim() && (
              <Box sx={{ mt: 1.5 }}>
                <FaviconTabPreview url={faviconUrl.trim()} appName={clientInfo?.name || "Your app"} />
              </Box>
            )}
          </SettingCard>

          {/* Login page text */}
          <SettingCard
            tourId="settings-login-text"
            icon="mdi:text-box-outline"
            title="Login page text"
            description="The tagline shown beside your logo on the login screen."
          >
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              value={loginSlogan}
              onChange={(e) => setLoginSlogan(e.target.value)}
              placeholder="e.g. Learn faster. Grow further."
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </SettingCard>

          <SettingCard
            icon="mdi:credit-card-outline"
            title="Payment account"
            description="Connect your institution's own Razorpay account. Until you do, you cannot charge for courses or assessments — and when you do, the money goes straight to you."
          >
            <PaymentAccountCard />
          </SettingCard>

          <SettingCard
            icon="mdi:earth-clock"
            title="Institution timezone"
            description="The zone your live sessions are scheduled and displayed in. Set this to where your learners are, not where you are — otherwise a session booked from another country shows everyone the wrong local time."
          >
            <TextField
              select
              fullWidth
              size="small"
              value={tz}
              disabled={tzSaving}
              onChange={(e) => saveTimezone(e.target.value)}
              helperText={
                tzMsg ??
                (tzLoadFailed
                  ? "Couldn't load the current timezone — pick one to set it, or reload the page."
                  : tz
                    ? "Saved automatically. Existing sessions keep the zone they were created in."
                    : "Not set — sessions fall back to the platform default.")
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            >
              {(tzOptions.length ? tzOptions : FALLBACK_TIMEZONES).map((z) => (
                <MenuItem key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </TextField>
          </SettingCard>

          <CourseVisibilitySetting />
          </Box>

          <LivePreview
            logoUrl={logoUrl}
            faviconUrl={faviconUrl}
            loginSlogan={loginSlogan}
            appName={clientInfo?.name || "Your app"}
          />
        </Box>
      )}
    </PageShell>
  );
}
