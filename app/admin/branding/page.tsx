"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
import { alpha } from "@mui/material/styles";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import { useToast } from "@/components/common/Toast";
import { useClientInfo, useThemePreview } from "@/lib/contexts/ClientInfoContext";
import {
  fetchBrandingPresets,
  fetchBrandingPresetDetail,
  fetchClientBranding,
  patchClientBranding,
  uploadFavicon,
  uploadLoginBackground,
  type BrandingPresetSummary,
} from "@/lib/services/admin/branding.service";
import { normalizeThemeSettings } from "@/lib/theme/normalizeThemeSettings";
import { setCssVariablesOnElement } from "@/lib/theme/applyDocumentTheme";
import { useTranslation } from "react-i18next";
import { LoginHeroPreview } from "@/components/admin/branding/LoginHeroPreview";
import { BrandingSectionCard } from "@/components/admin/branding/BrandingSectionCard";
import { BrandingColorField } from "@/components/admin/branding/BrandingColorField";
import { BrandingPresetGallery } from "@/components/admin/branding/BrandingPresetGallery";
import { MediaField } from "@/components/admin/branding/MediaField";

const WEIGHT_OPTIONS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];

function themeFingerprint(d: Record<string, string>): string {
  const keys = Object.keys(d).sort();
  const sorted: Record<string, string> = {};
  for (const k of keys) sorted[k] = d[k];
  return JSON.stringify(sorted);
}

type BrandingBaseline = {
  selectedPreset: string;
  loginImgUrl: string;
  loginLogoUrl: string;
  appIconUrl: string;
  draftThemeRaw: Record<string, string>;
};

export default function AdminBrandingPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const {
    clientInfo,
    loading: loadingClientInfo,
    refreshClientInfo,
  } = useClientInfo();
  const { setThemeOverride } = useThemePreview();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [presets, setPresets] = useState<BrandingPresetSummary[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [loginImgUrl, setLoginImgUrl] = useState("");
  const [loginLogoUrl, setLoginLogoUrl] = useState("");
  const [appIconUrl, setAppIconUrl] = useState("");
  const [draftThemeRaw, setDraftThemeRaw] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<BrandingBaseline | null>(null);
  const [presetApplyingId, setPresetApplyingId] = useState<string | null>(null);
  const [loginAdvancedOpen, setLoginAdvancedOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<"shell" | "login" | "modal" | "tokens">(
    "shell"
  );

  const previewRef = useRef<HTMLDivElement>(null);

  const normalizedPreview = useMemo(
    () => normalizeThemeSettings(draftThemeRaw),
    [draftThemeRaw]
  );

  const setHeroField = useCallback((key: string, value: string) => {
    setDraftThemeRaw((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isDirty = useMemo(() => {
    if (!baseline) return false;
    if (selectedPreset !== baseline.selectedPreset) return true;
    if (loginImgUrl.trim() !== baseline.loginImgUrl.trim()) return true;
    if (loginLogoUrl.trim() !== baseline.loginLogoUrl.trim()) return true;
    if (appIconUrl.trim() !== baseline.appIconUrl.trim()) return true;
    return themeFingerprint(draftThemeRaw) !== themeFingerprint(baseline.draftThemeRaw);
  }, [baseline, selectedPreset, loginImgUrl, loginLogoUrl, appIconUrl, draftThemeRaw]);

  const hasBrandingFeature = useMemo(() => {
    const features = clientInfo?.features ?? [];
    // Backward-compatible fallback: if no features are configured, keep branding accessible.
    if (features.length === 0) return true;
    return features.some((f) => f.name === "admin_branding");
  }, [clientInfo?.features]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    setCssVariablesOnElement(el, normalizedPreview);
  }, [normalizedPreview]);

  // Live preview: push the draft into the dedicated ThemePreviewContext.
  // ClientThemeSync subscribes to that context and owns the single
  // applyDocumentTheme call — we don't paint twice from here.
  //
  // Critical: don't push until `baseline` is loaded (the API has filled
  // `draftThemeRaw`). Otherwise the empty `{}` initial state would override
  // every theme consumer with normalized defaults — causing the whole app to
  // flash to blue-slate the moment the admin navigates to /admin/branding,
  // then jump back to the real theme once the fetch lands.
  useEffect(() => {
    if (!baseline) return;
    setThemeOverride(draftThemeRaw);
  }, [draftThemeRaw, baseline, setThemeOverride]);

  useEffect(() => {
    return () => {
      // Clear the override so the rest of the app falls back to the committed
      // theme. ClientThemeSync's useLayoutEffect will re-fire and revert the
      // document CSS variables; useTenantShellTheme / MUI rebuild from the
      // committed source.
      setThemeOverride(null);
    };
  }, [setThemeOverride]);

  // Live favicon preview — cache-bust so a new URL takes effect immediately.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const trimmed = appIconUrl.trim();
    const href = trimmed
      ? `${trimmed}?v=${Date.now()}`
      : clientInfo?.app_icon_url || "/favicon.ico";
    const links = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    );
    links.forEach((link) => {
      link.href = href;
    });
    if (links.length === 0) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [appIconUrl, clientInfo?.app_icon_url]);

  const applyBaseline = useCallback((b: BrandingBaseline) => {
    setSelectedPreset(b.selectedPreset);
    setLoginImgUrl(b.loginImgUrl);
    setLoginLogoUrl(b.loginLogoUrl);
    setAppIconUrl(b.appIconUrl);
    setDraftThemeRaw(JSON.parse(JSON.stringify(b.draftThemeRaw)));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, b] = await Promise.all([
        fetchBrandingPresets(),
        fetchClientBranding(),
      ]);
      setPresets(p);
      const draft =
        b.theme_settings && typeof b.theme_settings === "object"
          ? { ...(b.theme_settings as Record<string, string>) }
          : {};
      const nextBaseline: BrandingBaseline = {
        selectedPreset: b.theme_preset_id || "",
        loginImgUrl: b.login_img_url?.trim() || "",
        loginLogoUrl: b.login_logo_url?.trim() || "",
        appIconUrl: b.app_icon_url?.trim() || "",
        draftThemeRaw: draft,
      };
      applyBaseline(nextBaseline);
      setBaseline({
        ...nextBaseline,
        draftThemeRaw: JSON.parse(JSON.stringify(draft)),
      });
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : t("branding.loadError"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast, t, applyBaseline]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isClientOrgAdminRole(user.role)) {
      router.replace("/admin/dashboard");
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  const handlePresetChange = async (presetId: string) => {
    if (!presetId) {
      setSelectedPreset("");
      return;
    }
    setPresetApplyingId(presetId);
    try {
      const detail = await fetchBrandingPresetDetail(presetId);
      setSelectedPreset(presetId);
      setDraftThemeRaw({
        ...detail.theme_settings,
        _preset: detail.id,
      });
      showToast(
        "Preset applied — your custom color overrides have been replaced.",
        "info"
      );
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : t("branding.presetError"),
        "error"
      );
    } finally {
      setPresetApplyingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Parameters<typeof patchClientBranding>[0] = {
        login_img_url: loginImgUrl.trim() || null,
        login_logo_url: loginLogoUrl.trim() || null,
        app_icon_url: appIconUrl.trim() || null,
      };
      if (selectedPreset) {
        body.theme_preset_id = selectedPreset;
      }
      if (Object.keys(draftThemeRaw).length > 0) {
        body.theme_settings = { ...draftThemeRaw };
      }
      await patchClientBranding(body);
      await refreshClientInfo();
      const next: BrandingBaseline = {
        selectedPreset,
        loginImgUrl: loginImgUrl.trim(),
        loginLogoUrl: loginLogoUrl.trim(),
        appIconUrl: appIconUrl.trim(),
        draftThemeRaw: JSON.parse(JSON.stringify(draftThemeRaw)),
      };
      setBaseline(next);
      showToast(t("branding.saved"), "success");
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : t("branding.saveError"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!baseline) return;
    applyBaseline(baseline);
    showToast(t("branding.discarded"), "info");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadLoginBackground(file);
      if (res.url) {
        setLoginImgUrl(res.url);
        showToast(t("branding.uploaded"), "success");
      }
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : t("branding.uploadError"),
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const res = await uploadFavicon(file);
      if (res.url) {
        setAppIconUrl(res.url);
        showToast(t("branding.uploaded"), "success");
      }
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : t("branding.uploadError"),
        "error"
      );
    } finally {
      setUploadingFavicon(false);
    }
  };

  if (authLoading || loadingClientInfo || !user || !isClientOrgAdminRole(user.role)) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!hasBrandingFeature) {
    return (
      <MainLayout>
        <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Branding & Theme is disabled for this client. Enable `admin_branding` in the super admin feature selection to access this page.
          </Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, md: 3 },
          pb: 10,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            mb: 3,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: "1px solid var(--border-default)",
            overflow: "hidden",
            background: (theme) =>
              `radial-gradient(ellipse 80% 60% at 0% 0%, ${alpha(
                theme.palette.primary.main,
                0.14
              )} 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 100% 100%, ${alpha(
                theme.palette.primary.light,
                0.12
              )} 0%, transparent 55%), linear-gradient(135deg, var(--surface) 0%, var(--card-bg) 100%)`,
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, transparent 60%, color-mix(in srgb, var(--font-primary) 3%, transparent) 100%)",
              pointerEvents: "none",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            sx={{ position: "relative" }}
          >
            <Stack direction="row" spacing={2.25} alignItems="center">
              <Box
                sx={{
                  position: "relative",
                  width: 60,
                  height: 60,
                  borderRadius: 2,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: "primary.contrastText",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: (theme) =>
                    `0 12px 28px ${alpha(
                      theme.palette.primary.main,
                      0.45
                    )}, inset 0 1px 0 ${alpha("#ffffff", 0.25)}`,
                  "& svg": { color: "currentColor" },
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon="mdi:palette-swatch"
                  size={32}
                  style={{ color: "currentColor" }}
                />
              </Box>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    letterSpacing="-0.02em"
                    sx={{ color: "var(--font-primary)" }}
                  >
                    Branding &amp; theme
                  </Typography>
                  <Chip
                    size="small"
                    label="Beta"
                    sx={{
                      height: 18,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      backgroundColor:
                        "color-mix(in srgb, var(--primary-500) 14%, var(--surface) 86%)",
                      color: "var(--primary-700)",
                      border: "1px solid var(--border-default)",
                    }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    mt: 0.5,
                    maxWidth: 620,
                    lineHeight: 1.55,
                  }}
                >
                  Pick a preset, tweak the palette, drop in logos and a favicon —
                  every change repaints the whole site as you edit. Click{" "}
                  <Box
                    component="strong"
                    sx={{ color: "var(--font-primary)", fontWeight: 700 }}
                  >
                    Save
                  </Box>{" "}
                  to commit; navigate away to revert.
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ rowGap: 1 }}
            >
              <Chip
                size="small"
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-500)",
                      ml: "8px !important",
                      mr: "-2px !important",
                      animation: "awBrandPulse 1.6s ease-in-out infinite",
                    }}
                  />
                }
                label="Live preview"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 26,
                  border: "1px solid var(--border-default)",
                  backgroundColor:
                    "color-mix(in srgb, var(--primary-500) 10%, var(--surface) 90%)",
                  color: "var(--primary-700)",
                }}
              />
              <Chip
                size="small"
                icon={
                  <IconWrapper
                    icon={isDirty ? "mdi:circle-medium" : "mdi:check-circle"}
                    size={14}
                  />
                }
                label={isDirty ? t("branding.unsavedChanges") : t("branding.allSaved")}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 26,
                  border: "1px solid var(--border-default)",
                  backgroundColor: isDirty
                    ? "color-mix(in srgb, var(--warning-500, #ffb800) 14%, var(--surface) 86%)"
                    : "color-mix(in srgb, var(--success-500, #5fa564) 12%, var(--surface) 88%)",
                  color: isDirty
                    ? "var(--warning-500, #ffb800)"
                    : "var(--success-500, #5fa564)",
                  "& .MuiChip-icon": {
                    color: "inherit",
                    ml: "8px !important",
                    mr: "-2px !important",
                  },
                }}
              />
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Stack spacing={2.5}>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
          </Stack>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 400px" },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Stack spacing={2.5}>
              <Alert
                severity="info"
                icon={<IconWrapper icon="mdi:flash-outline" size={22} />}
                sx={{
                  borderRadius: 2,
                  alignItems: "center",
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--surface)",
                  color: "var(--font-primary)",
                  "& .MuiAlert-icon": { color: "var(--primary-500)" },
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                <Typography variant="body2" sx={{ color: "var(--font-primary)" }}>
                  <strong>Live across the app.</strong> Picking a preset or editing
                  any color instantly repaints the sidebar, nav, modals, and cards
                  site-wide. Nothing is saved until you click <strong>Save</strong>
                  — closing this page reverts unsaved changes.
                </Typography>
              </Alert>

              <BrandingSectionCard
                icon="mdi:shape-outline"
                title="Theme"
                description="Pick a starter palette. Customizations below layer on top."
              >
                <BrandingPresetGallery
                  presets={presets}
                  selectedId={selectedPreset}
                  applyingId={presetApplyingId}
                  onSelectPreset={(id) => void handlePresetChange(id)}
                  onSelectCustom={() => setSelectedPreset("")}
                />
              </BrandingSectionCard>

              <BrandingSectionCard
                icon="mdi:palette-outline"
                title="Colors"
                description="Fine-tune individual tokens — every field repaints the whole site live."
              >
                <Stack spacing={2.5}>
                  <ColorGroup
                    icon="mdi:dock-left"
                    label="App chrome"
                    blurb="Sidebar, top nav, and the brand primary used across CTAs and active states."
                  >
                    <BrandingColorField
                      label={t("branding.sidebarBg")}
                      hint={t("branding.sidebarBgHint")}
                      value={draftThemeRaw.secondary500 ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({ ...prev, secondary500: hex }))
                      }
                      fallbackHex={normalizedPreview.secondary500}
                    />
                    <BrandingColorField
                      label={t("branding.sidebarText")}
                      hint={t("branding.sidebarTextHint")}
                      value={draftThemeRaw.fontLightNav ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({ ...prev, fontLightNav: hex }))
                      }
                      fallbackHex={normalizedPreview.fontLightNav}
                    />
                    <BrandingColorField
                      label={t("branding.brandPrimary")}
                      hint={t("branding.brandPrimaryHint")}
                      value={draftThemeRaw.primary500 ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({
                          ...prev,
                          primary500: hex,
                          muiPrimaryMain: hex,
                        }))
                      }
                      fallbackHex={normalizedPreview.primary500}
                    />
                    <BrandingColorField
                      label={t("branding.navActiveText")}
                      hint={t("branding.navActiveTextHint")}
                      value={draftThemeRaw.primary300 ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({ ...prev, primary300: hex }))
                      }
                      fallbackHex={normalizedPreview.primary300}
                    />
                  </ColorGroup>

                  <ColorGroup
                    icon="mdi:cards-outline"
                    label="Surfaces"
                    blurb="Card backgrounds and dividers used across dashboards, modals, and lists."
                  >
                    <BrandingColorField
                      label="Card surface"
                      hint="Background of dashboard cards and modal bodies."
                      value={draftThemeRaw.surfaceBlueLight ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({
                          ...prev,
                          surfaceBlueLight: hex,
                        }))
                      }
                      fallbackHex={normalizedPreview.surfaceBlueLight}
                    />
                    <BrandingColorField
                      label="Border"
                      hint="Card outlines, table rules, divider lines."
                      value={draftThemeRaw.neutral200 ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({ ...prev, neutral200: hex }))
                      }
                      fallbackHex={normalizedPreview.neutral200}
                    />
                  </ColorGroup>

                  <ColorGroup
                    icon="mdi:traffic-light-outline"
                    label="Status accents"
                    blurb="Semantic colors for confirmation and destructive actions."
                  >
                    <BrandingColorField
                      label="Success"
                      hint="Live status, completed lessons, positive metrics."
                      value={draftThemeRaw.success500 ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({ ...prev, success500: hex }))
                      }
                      fallbackHex={normalizedPreview.success500}
                    />
                    <BrandingColorField
                      label="Danger"
                      hint="Errors, destructive actions, overdue badges."
                      value={draftThemeRaw.error500 ?? ""}
                      onChange={(hex) =>
                        setDraftThemeRaw((prev) => ({ ...prev, error500: hex }))
                      }
                      fallbackHex={normalizedPreview.error500}
                    />
                  </ColorGroup>
                </Stack>
              </BrandingSectionCard>

              <BrandingSectionCard
                icon="mdi:image-multiple-outline"
                title="Brand identity"
                description="Logos, favicon, and the sign-in hero image — uploads or hosted URLs."
              >
                <Stack spacing={2}>
                  {/* === Login hero — big banner preview === */}
                  <BrandAssetCard
                    label="Login hero image"
                    hint="Background image on the right-hand panel of the sign-in screen."
                    value={loginImgUrl}
                    onChange={setLoginImgUrl}
                    onUpload={async (file) => {
                      const fakeEvent = {
                        target: {
                          files: [file],
                          value: "",
                        } as unknown as HTMLInputElement,
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      await handleUpload(fakeEvent);
                    }}
                    uploading={uploading}
                    uploadLabel="Upload hero image"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    preview={
                      <HeroPreviewTile
                        imageUrl={loginImgUrl}
                        logoUrl={loginLogoUrl}
                        clientName={clientInfo?.name || "Acme Learning"}
                        slogan={
                          (draftThemeRaw.loginHeroSlogan ||
                            "Changing the way the world learns")
                        }
                      />
                    }
                  />

                  {/* === Logo + Favicon side-by-side === */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 2,
                    }}
                  >
                    <BrandAssetCard
                      label="App logo"
                      hint="Shown in the sidebar and on the sign-in hero. Wide transparent PNG/SVG works best."
                      value={loginLogoUrl}
                      onChange={setLoginLogoUrl}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      preview={<LogoOnSidebarPreview logoUrl={loginLogoUrl} />}
                      compact
                    />
                    <BrandAssetCard
                      label="Favicon"
                      hint="32×32 icon shown in browser tabs and bookmarks."
                      value={appIconUrl}
                      onChange={setAppIconUrl}
                      onUpload={async (file) => {
                        const fakeEvent = {
                          target: {
                            files: [file],
                            value: "",
                          } as unknown as HTMLInputElement,
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        await handleFaviconUpload(fakeEvent);
                      }}
                      uploading={uploadingFavicon}
                      uploadLabel="Upload favicon"
                      accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                      preview={
                        <FaviconInTabPreview
                          iconUrl={appIconUrl}
                          clientName={clientInfo?.name || "Acme Learning"}
                        />
                      }
                      compact
                    />
                  </Box>
                </Stack>
              </BrandingSectionCard>

              <BrandingSectionCard
                icon="mdi:format-text"
                title="Login page"
                description="Slogan copy and typography for the sign-in screen."
                action={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setLoginAdvancedOpen((o) => !o)}
                    endIcon={
                      <IconWrapper
                        icon={loginAdvancedOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                        size={18}
                      />
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "var(--border-default)",
                      color: "var(--font-primary)",
                      "&:hover": {
                        borderColor: "var(--primary-500)",
                        backgroundColor:
                          "color-mix(in srgb, var(--primary-500) 8%, var(--card-bg) 92%)",
                      },
                    }}
                  >
                    {loginAdvancedOpen ? "Hide advanced" : "Advanced"}
                  </Button>
                }
              >
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid var(--border-default)",
                      backgroundColor: "var(--card-bg)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ color: "var(--font-primary)", mb: 0.5 }}
                    >
                      {t("branding.loginSlogan")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-secondary)", display: "block", mb: 1 }}
                    >
                      {t("branding.loginSloganHelp")}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      value={draftThemeRaw.loginHeroSlogan ?? ""}
                      onChange={(e) => setHeroField("loginHeroSlogan", e.target.value)}
                      placeholder={t("auth.slogan") as string}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.25,
                          backgroundColor: "var(--surface)",
                        },
                      }}
                    />
                  </Box>

                  <Collapse in={loginAdvancedOpen} unmountOnExit>
                    <Stack spacing={2}>
                      <ColorGroup
                        icon="mdi:format-quote-close"
                        label="Slogan typography"
                        blurb="Size, weight, style, and color of the sign-in tagline."
                      >
                        <TextField
                          fullWidth
                          size="small"
                          label={t("branding.loginSloganSize")}
                          value={draftThemeRaw.loginHeroSloganFontSize ?? ""}
                          onChange={(e) =>
                            setHeroField("loginHeroSloganFontSize", e.target.value)
                          }
                          placeholder="2.75rem"
                          helperText={t("branding.fontSizeHelp")}
                        />
                        <BrandingColorField
                          label={t("branding.loginSloganColor")}
                          hint={t("branding.loginSloganColorHint")}
                          value={draftThemeRaw.loginHeroSloganColor ?? ""}
                          onChange={(hex) => setHeroField("loginHeroSloganColor", hex)}
                          fallbackHex={normalizedPreview.loginHeroSloganColor}
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel>{t("branding.loginSloganWeight")}</InputLabel>
                          <Select
                            label={t("branding.loginSloganWeight")}
                            value={draftThemeRaw.loginHeroSloganFontWeight ?? ""}
                            onChange={(e) =>
                              setHeroField(
                                "loginHeroSloganFontWeight",
                                String(e.target.value)
                              )
                            }
                          >
                            <MenuItem value="">
                              <em>{t("branding.inheritDefault")}</em>
                            </MenuItem>
                            {WEIGHT_OPTIONS.map((w) => (
                              <MenuItem key={w} value={w}>
                                {t(`branding.fontWeight_${w}`)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel>{t("branding.loginSloganStyle")}</InputLabel>
                          <Select
                            label={t("branding.loginSloganStyle")}
                            value={draftThemeRaw.loginHeroSloganFontStyle ?? ""}
                            onChange={(e) =>
                              setHeroField(
                                "loginHeroSloganFontStyle",
                                String(e.target.value)
                              )
                            }
                          >
                            <MenuItem value="">
                              <em>{t("branding.inheritDefault")}</em>
                            </MenuItem>
                            <MenuItem value="normal">{t("branding.styleNormal")}</MenuItem>
                            <MenuItem value="italic">{t("branding.styleItalic")}</MenuItem>
                          </Select>
                        </FormControl>
                      </ColorGroup>

                      <ColorGroup
                        icon="mdi:format-bold"
                        label="Brand-name typography"
                        blurb="Size, weight, and color of the organisation name on the hero."
                      >
                        <TextField
                          fullWidth
                          size="small"
                          label={t("branding.loginBrandSize")}
                          value={draftThemeRaw.loginHeroBrandNameFontSize ?? ""}
                          onChange={(e) =>
                            setHeroField(
                              "loginHeroBrandNameFontSize",
                              e.target.value
                            )
                          }
                          placeholder="2.75rem"
                          helperText={t("branding.fontSizeHelp")}
                        />
                        <BrandingColorField
                          label={t("branding.loginBrandColor")}
                          hint={t("branding.loginBrandColorHint")}
                          value={draftThemeRaw.loginHeroBrandNameColor ?? ""}
                          onChange={(hex) =>
                            setHeroField("loginHeroBrandNameColor", hex)
                          }
                          fallbackHex={normalizedPreview.loginHeroBrandNameColor}
                        />
                        <FormControl fullWidth size="small" sx={{ gridColumn: { sm: "span 2" } }}>
                          <InputLabel>{t("branding.loginBrandWeight")}</InputLabel>
                          <Select
                            label={t("branding.loginBrandWeight")}
                            value={draftThemeRaw.loginHeroBrandNameFontWeight ?? ""}
                            onChange={(e) =>
                              setHeroField(
                                "loginHeroBrandNameFontWeight",
                                String(e.target.value)
                              )
                            }
                          >
                            <MenuItem value="">
                              <em>{t("branding.inheritDefault")}</em>
                            </MenuItem>
                            {WEIGHT_OPTIONS.map((w) => (
                              <MenuItem key={w} value={w}>
                                {t(`branding.fontWeight_${w}`)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </ColorGroup>

                      <ColorGroup
                        icon="mdi:ruler"
                        label="Logo dimensions"
                        blurb="Pixel sizing for the login hero logo and the sidebar logo box."
                      >
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={t("branding.loginLogoMax")}
                          value={draftThemeRaw.loginHeroLogoMaxWidthPx ?? ""}
                          onChange={(e) =>
                            setHeroField("loginHeroLogoMaxWidthPx", e.target.value)
                          }
                          inputProps={{ min: 40, max: 900 }}
                          helperText={t("branding.loginLogoDimHelp")}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={t("branding.loginLogoHeight")}
                          value={draftThemeRaw.loginHeroLogoHeightPx ?? ""}
                          onChange={(e) =>
                            setHeroField("loginHeroLogoHeightPx", e.target.value)
                          }
                          inputProps={{ min: 24, max: 400 }}
                          helperText={t("branding.loginLogoDimHelp")}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={t("branding.sidebarLogoMax")}
                          value={draftThemeRaw.sidebarLogoMaxWidthPx ?? ""}
                          onChange={(e) =>
                            setHeroField("sidebarLogoMaxWidthPx", e.target.value)
                          }
                          inputProps={{ min: 40, max: 220 }}
                          helperText={t("branding.sidebarLogoDimHelp")}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label={t("branding.sidebarLogoHeight")}
                          value={draftThemeRaw.sidebarLogoHeightPx ?? ""}
                          onChange={(e) =>
                            setHeroField("sidebarLogoHeightPx", e.target.value)
                          }
                          inputProps={{ min: 24, max: 80 }}
                          helperText={t("branding.sidebarLogoDimHelp")}
                        />
                      </ColorGroup>
                    </Stack>
                  </Collapse>
                </Stack>
              </BrandingSectionCard>
            </Stack>

            <Box
              sx={{
                position: { xs: "static", md: "sticky" },
                top: { md: 84 },
                width: { lg: 400 },
                maxHeight: { md: "calc(100vh - 108px)" },
                overflowY: { md: "auto" },
                alignSelf: "start",
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                pr: { md: 0.5 },
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid var(--border-default)",
                  bgcolor: "var(--surface)",
                  overflow: "hidden",
                  boxShadow:
                    "0 12px 28px color-mix(in srgb, var(--font-primary) 10%, transparent)",
                }}
              >
                {/* Preview header — live pulse + browser-tab simulation */}
                <Box
                  sx={{
                    px: 2,
                    pt: 1.75,
                    pb: 1.25,
                    borderBottom: "1px solid var(--border-default)",
                    background: (theme) =>
                      `linear-gradient(180deg, ${alpha(
                        theme.palette.primary.main,
                        0.05
                      )} 0%, var(--surface) 100%)`,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconWrapper icon="mdi:monitor-eye" size={20} />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "var(--font-primary)" }}>
                        Live preview
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      label="Painting"
                      icon={
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: "var(--success-500, #5fa564)",
                            ml: "8px !important",
                            mr: "-2px !important",
                            animation: "awBrandPulse 1.4s ease-in-out infinite",
                            "@keyframes awBrandPulse": {
                              "0%, 100%": {
                                boxShadow:
                                  "0 0 0 0 color-mix(in srgb, var(--success-500, #5fa564) 70%, transparent)",
                              },
                              "50%": {
                                boxShadow:
                                  "0 0 0 6px color-mix(in srgb, var(--success-500, #5fa564) 0%, transparent)",
                              },
                            },
                          }}
                        />
                      }
                      sx={{
                        height: 22,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--font-secondary)",
                        bgcolor:
                          "color-mix(in srgb, var(--success-500, #5fa564) 12%, var(--surface) 88%)",
                        border: "1px solid var(--border-default)",
                      }}
                    />
                  </Stack>

                  {/* Browser-tab simulation */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "stretch",
                      borderRadius: "10px 10px 0 0",
                      overflow: "hidden",
                      bgcolor: "color-mix(in srgb, var(--font-primary) 6%, var(--surface) 94%)",
                      px: 0.75,
                      pt: 0.75,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1,
                        py: 0.6,
                        borderRadius: "8px 8px 0 0",
                        bgcolor: "var(--card-bg)",
                        maxWidth: 240,
                        minWidth: 160,
                        boxShadow:
                          "0 -1px 2px color-mix(in srgb, var(--font-primary) 8%, transparent)",
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                          borderRadius: 0.5,
                          backgroundColor: "#ffffff",
                          backgroundImage: appIconUrl.trim()
                            ? `url("${appIconUrl.trim()}")`
                            : undefined,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                          border: appIconUrl.trim()
                            ? "none"
                            : "1px dashed var(--border-default)",
                        }}
                      />
                      <Typography
                        noWrap
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 500,
                          color: "var(--font-primary)",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {clientInfo?.name || t("branding.loginPreviewClient")}
                      </Typography>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          color: "var(--font-secondary)",
                          fontSize: "0.8rem",
                          lineHeight: "10px",
                          textAlign: "center",
                          opacity: 0.5,
                        }}
                      >
                        ×
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Tab strip */}
                <Tabs
                  value={previewTab}
                  onChange={(_, v) => setPreviewTab(v)}
                  variant="fullWidth"
                  sx={{
                    minHeight: 38,
                    borderBottom: "1px solid var(--border-default)",
                    bgcolor: "var(--background)",
                    "& .MuiTab-root": {
                      minHeight: 38,
                      textTransform: "none",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--font-secondary)",
                      "&.Mui-selected": { color: "var(--primary-700)" },
                    },
                    "& .MuiTabs-indicator": {
                      height: 2,
                      backgroundColor: "var(--primary-500)",
                    },
                  }}
                >
                  <Tab value="shell" label="App" />
                  <Tab value="login" label="Login" />
                  <Tab value="modal" label="Modal" />
                  <Tab value="tokens" label="Tokens" />
                </Tabs>

                <Box
                  ref={previewRef}
                  sx={{
                    p: 1.75,
                    backgroundColor: "var(--background)",
                  }}
                >
                  {previewTab === "shell" && (
                    <Box
                      sx={{
                        borderRadius: 2,
                        border: "1px solid var(--border-default)",
                        overflow: "hidden",
                        backgroundColor: "var(--background)",
                        boxShadow:
                          "inset 0 1px 2px color-mix(in srgb, var(--font-primary) 6%, transparent)",
                      }}
                    >
                      <Box sx={{ display: "flex", minHeight: 220 }}>
                        <Stack
                          spacing={0.75}
                          sx={{
                            width: 88,
                            backgroundColor: "var(--shell-sidebar-bg)",
                            color: "var(--font-light-nav)",
                            py: 1.25,
                            px: 1,
                          }}
                        >
                          <Box
                            sx={{
                              height: 18,
                              borderRadius: 1,
                              backgroundColor:
                                "color-mix(in srgb, var(--font-light-nav) 18%, transparent)",
                            }}
                          />
                          <Box
                            sx={{
                              height: 10,
                              borderRadius: 0.75,
                              backgroundColor: "var(--primary-500)",
                              mt: 1,
                            }}
                          />
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 0.75,
                              backgroundColor:
                                "color-mix(in srgb, var(--font-light-nav) 14%, transparent)",
                            }}
                          />
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 0.75,
                              backgroundColor:
                                "color-mix(in srgb, var(--font-light-nav) 10%, transparent)",
                            }}
                          />
                          <Box
                            sx={{
                              height: 8,
                              borderRadius: 0.75,
                              backgroundColor:
                                "color-mix(in srgb, var(--font-light-nav) 10%, transparent)",
                            }}
                          />
                        </Stack>
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box
                            sx={{
                              height: 34,
                              px: 1.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              backgroundColor: "var(--nav-background)",
                              borderBottom: "1px solid var(--border-default)",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "var(--font-dark-nav)",
                              }}
                            >
                              Dashboard
                            </Typography>
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                backgroundColor: "var(--primary-500)",
                              }}
                            />
                          </Box>
                          <Box sx={{ flex: 1, p: 1.5 }}>
                            <Box
                              sx={{
                                borderRadius: 1.5,
                                border: "1px solid var(--border-default)",
                                backgroundColor: "var(--card-bg)",
                                p: 1.5,
                                boxShadow:
                                  "0 6px 16px color-mix(in srgb, var(--font-primary) 8%, transparent)",
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "var(--primary-700)",
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                  mb: 0.5,
                                }}
                              >
                                {t("branding.previewHeading")}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "var(--font-secondary)",
                                  display: "block",
                                  mb: 1.25,
                                }}
                              >
                                {t("branding.previewBody")}
                              </Typography>
                              <Stack direction="row" spacing={0.75}>
                                <Box
                                  sx={{
                                    px: 1.25,
                                    py: 0.4,
                                    borderRadius: 0.75,
                                    backgroundColor: "var(--primary-600)",
                                    color: "var(--font-light)",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {t("branding.previewCta")}
                                </Box>
                                <Box
                                  sx={{
                                    px: 1.25,
                                    py: 0.4,
                                    borderRadius: 0.75,
                                    border: "1px solid var(--border-default)",
                                    color: "var(--font-primary)",
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                    backgroundColor: "var(--surface)",
                                  }}
                                >
                                  Cancel
                                </Box>
                              </Stack>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {previewTab === "login" && (
                    <LoginHeroPreview
                      loginImgUrl={loginImgUrl}
                      loginLogoUrl={loginLogoUrl}
                      normalizedTheme={normalizedPreview}
                      sampleClientName={t("branding.loginPreviewClient")}
                    />
                  )}

                  {previewTab === "modal" && (
                    <Box
                      sx={{
                        position: "relative",
                        minHeight: 220,
                        borderRadius: 2,
                        border: "1px solid var(--border-default)",
                        backgroundColor:
                          "color-mix(in srgb, var(--font-primary) 10%, var(--background) 90%)",
                        p: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: 320,
                          borderRadius: 2,
                          border: "1px solid var(--border-default)",
                          backgroundColor: "var(--modal-bg)",
                          p: 2,
                          boxShadow:
                            "0 24px 56px color-mix(in srgb, var(--font-primary) 22%, transparent)",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "var(--font-primary)",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            mb: 0.5,
                          }}
                        >
                          Confirm delete
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "var(--font-secondary)", display: "block", mb: 1.5 }}
                        >
                          This action cannot be undone. Your records will be permanently removed.
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 0.75,
                              border: "1px solid var(--border-default)",
                              color: "var(--font-primary)",
                              backgroundColor: "var(--surface)",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                            }}
                          >
                            Cancel
                          </Box>
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 0.75,
                              backgroundColor: "var(--error-500)",
                              color: "var(--font-light)",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                            }}
                          >
                            Delete
                          </Box>
                        </Stack>
                      </Box>
                    </Box>
                  )}

                  {previewTab === "tokens" && (
                    <Stack spacing={1.25}>
                      {[
                        { label: "Primary", value: normalizedPreview.primary500 },
                        { label: "Primary deep", value: normalizedPreview.primary700 },
                        { label: "Sidebar", value: normalizedPreview.secondary500 },
                        { label: "Nav background", value: normalizedPreview.navBackground },
                        { label: "Card surface", value: normalizedPreview.surfaceBlueLight },
                        { label: "Border", value: normalizedPreview.neutral200 },
                        { label: "Success", value: normalizedPreview.success500 },
                        { label: "Danger", value: normalizedPreview.error500 },
                      ].map((token) =>
                        token.value ? (
                          <Stack
                            key={token.label}
                            direction="row"
                            alignItems="center"
                            spacing={1.25}
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              backgroundColor: "var(--card-bg)",
                              border: "1px solid var(--border-default)",
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                backgroundColor: token.value,
                                border: "1px solid var(--border-default)",
                                flexShrink: 0,
                              }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  color: "var(--font-primary)",
                                  lineHeight: 1.2,
                                }}
                              >
                                {token.label}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: "monospace",
                                  fontSize: "0.72rem",
                                  color: "var(--font-secondary)",
                                  textTransform: "uppercase",
                                }}
                              >
                                {token.value}
                              </Typography>
                            </Box>
                          </Stack>
                        ) : null
                      )}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {!loading ? (
          <Paper
            elevation={8}
            sx={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              mt: 3,
              py: 2,
              px: { xs: 2, sm: 3 },
              borderRadius: "12px 12px 0 0",
              border: "1px solid",
              borderBottom: "none",
              borderColor: "divider",
              zIndex: (theme) => theme.zIndex.appBar - 1,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.92)
                  : alpha(theme.palette.background.paper, 0.97),
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
                {t("branding.footerHint")}
              </Typography>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap" alignItems="center">
                {!isDirty && !saving ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: { xs: "block", sm: "none" }, width: "100%", order: -1 }}
                  >
                    {t("branding.saveDisabledHint")}
                  </Typography>
                ) : null}
                <Button
                  variant="outlined"
                  disabled={!isDirty || saving}
                  onClick={handleDiscard}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "var(--border-default)",
                    color: "var(--font-primary)",
                    backgroundColor: "var(--surface)",
                    "&:hover": {
                      borderColor: "var(--accent-indigo)",
                      backgroundColor:
                        "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                    },
                    "&.Mui-disabled": {
                      color: "var(--font-secondary)",
                      borderColor: "var(--border-default)",
                      backgroundColor:
                        "color-mix(in srgb, var(--surface) 70%, var(--background) 30%)",
                    },
                  }}
                >
                  {t("branding.discard")}
                </Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleSave}
                  disabled={!isDirty}
                  loading={saving}
                  loadingText={t("common.saving")}
                  title={!isDirty ? t("branding.saveDisabledHint") : undefined}
                  startIcon={
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        color: "var(--font-light)",
                      }}
                    >
                      <IconWrapper
                        icon="mdi:content-save-outline"
                        size={20}
                        style={{ color: "currentColor" }}
                      />
                    </Box>
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    minWidth: 160,
                    backgroundColor: "var(--accent-indigo)",
                    color: "var(--font-light)",
                    "&:hover": {
                      backgroundColor: "var(--accent-indigo-dark)",
                    },
                    "&.Mui-disabled": {
                      color: "var(--font-secondary)",
                      backgroundColor:
                        "color-mix(in srgb, var(--accent-indigo) 26%, var(--surface) 74%)",
                    },
                  }}
                >
                  {t("branding.save")}
                </LoadingButton>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Box>
    </MainLayout>
  );
}

function ColorGroup({
  icon,
  label,
  blurb,
  children,
}: {
  icon: string;
  label: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "color-mix(in srgb, var(--surface) 60%, var(--background) 40%)",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          px: 1.5,
          py: 1.25,
          borderBottom: "1px solid var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              "color-mix(in srgb, var(--primary-500) 14%, var(--surface) 86%)",
            color: "var(--primary-700)",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon={icon} size={18} style={{ color: "currentColor" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: "0.72rem",
              color: "var(--font-primary)",
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "var(--font-secondary)",
              lineHeight: 1.35,
              mt: 0.25,
            }}
          >
            {blurb}
          </Typography>
        </Box>
      </Stack>
      <Box
        sx={{
          p: 1.25,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: 1.25,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// ============================================================================
// Brand identity — rich asset cards with contextual previews
// ============================================================================

function BrandAssetCard({
  label,
  hint,
  value,
  onChange,
  onUpload,
  uploading,
  uploadLabel = "Upload",
  accept,
  preview,
  compact,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  onUpload?: (file: File) => Promise<void> | void;
  uploading?: boolean;
  uploadLabel?: string;
  accept?: string;
  preview: React.ReactNode;
  compact?: boolean;
}) {
  const inputId = `brand-asset-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const trimmed = value.trim();
  const { t } = useTranslation("common");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUpload) return;
    void onUpload(file);
  };

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2.5,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
        "&:hover": {
          borderColor:
            "color-mix(in srgb, var(--primary-500) 35%, var(--border-default) 65%)",
          boxShadow:
            "0 8px 22px color-mix(in srgb, var(--primary-500) 10%, transparent)",
          transform: "translateY(-1px)",
        },
      }}
    >
      {/* Contextual preview strip */}
      <Box
        sx={{
          position: "relative",
          backgroundColor:
            "color-mix(in srgb, var(--font-primary) 4%, var(--surface) 96%)",
          borderBottom: "1px solid var(--border-default)",
          p: compact ? 1.5 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: compact ? 120 : 160,
        }}
      >
        {preview}
        {trimmed ? (
          <Tooltip title="Clear" arrow placement="top">
            <IconButton
              size="small"
              onClick={() => onChange("")}
              sx={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 26,
                height: 26,
                backgroundColor: "color-mix(in srgb, var(--card-bg) 88%, transparent)",
                color: "var(--font-secondary)",
                border: "1px solid var(--border-default)",
                "&:hover": {
                  color: "var(--error-500)",
                  borderColor: "var(--error-500)",
                },
              }}
              aria-label={`Clear ${label}`}
            >
              <IconWrapper icon="mdi:close" size={14} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>

      {/* Controls */}
      <Box sx={{ p: 1.75 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ mb: 0.5 }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: trimmed
                ? "var(--success-500, #5fa564)"
                : "var(--font-tertiary)",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ color: "var(--font-primary)", lineHeight: 1.2 }}
          >
            {label}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.66rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: trimmed
                ? "var(--success-500, #5fa564)"
                : "var(--font-tertiary)",
            }}
          >
            {trimmed ? "Set" : "Empty"}
          </Typography>
        </Stack>
        <Typography
          variant="caption"
          sx={{
            color: "var(--font-secondary)",
            display: "block",
            lineHeight: 1.4,
            mb: 1.25,
          }}
        >
          {hint}
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          inputProps={{
            spellCheck: false,
            "aria-label": `${label} URL`,
            style: {
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.8rem",
            },
          }}
          sx={{
            mb: onUpload ? 1 : 0,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.25,
              backgroundColor: "var(--surface)",
            },
          }}
        />
        {onUpload ? (
          <Box>
            <LoadingButton
              variant="outlined"
              component="label"
              htmlFor={inputId as any}
              size="small"
              fullWidth
              loading={uploading}
              loadingText={t("common.uploading")}
              startIcon={<IconWrapper icon="mdi:cloud-upload-outline" size={16} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "var(--border-default)",
                color: "var(--font-primary)",
                backgroundColor: "var(--surface)",
                "&:hover": {
                  borderColor: "var(--primary-500)",
                  backgroundColor:
                    "color-mix(in srgb, var(--primary-500) 8%, var(--surface) 92%)",
                },
              }}
            >
              {uploadLabel}
              <input
                id={inputId}
                type="file"
                hidden
                accept={accept}
                onChange={handleFile}
              />
            </LoadingButton>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

function HeroPreviewTile({
  imageUrl,
  logoUrl,
  clientName,
  slogan,
}: {
  imageUrl: string;
  logoUrl?: string;
  clientName: string;
  slogan: string;
}) {
  const trimmedImg = imageUrl.trim();
  const trimmedLogo = (logoUrl || "").trim();
  // Mirror the real /login layout: left 50% is the sign-in form panel,
  // right 50% is the hero image with logo + brand name + slogan overlaid
  // (see components/auth/layout/AuthRightPanelDefault.tsx). The preview is
  // a faithful miniature so the admin can judge how the chosen hero image
  // composes with the rest of the screen.
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 1.5,
        overflow: "hidden",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--background)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {/* === LEFT — faux login form ============================================ */}
      <Box
        sx={{
          position: "relative",
          backgroundColor: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 1,
        }}
      >
        <Box
          sx={{
            width: "82%",
            maxWidth: 180,
            borderRadius: 1.25,
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border-default)",
            boxShadow:
              "0 6px 16px color-mix(in srgb, var(--font-primary) 8%, transparent)",
            p: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.62rem",
              fontWeight: 800,
              color: "var(--font-primary)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              mb: 0.25,
            }}
          >
            Login
          </Typography>
          {/* Google button */}
          <Box
            sx={{
              height: 12,
              borderRadius: 0.5,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--surface)",
              display: "flex",
              alignItems: "center",
              gap: 0.4,
              px: 0.6,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  "conic-gradient(from 0deg, #ea4335 25%, #fbbc05 25% 50%, #34a853 50% 75%, #4285f4 75%)",
              }}
            />
            <Box
              sx={{
                height: 3,
                width: "60%",
                borderRadius: 0.5,
                backgroundColor:
                  "color-mix(in srgb, var(--font-secondary) 35%, transparent)",
              }}
            />
          </Box>
          {/* Email + Password fields */}
          <Box
            sx={{
              height: 10,
              borderRadius: 0.5,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--surface)",
              mt: 0.25,
            }}
          />
          <Box
            sx={{
              height: 10,
              borderRadius: 0.5,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--surface)",
            }}
          />
          {/* Login CTA (uses brand primary) */}
          <Box
            sx={{
              height: 13,
              borderRadius: 0.5,
              backgroundColor: "var(--primary-500)",
              mt: 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                height: 3,
                width: "26%",
                borderRadius: 0.4,
                backgroundColor:
                  "color-mix(in srgb, var(--font-light) 75%, transparent)",
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* === RIGHT — hero image with logo + brand name + slogan =============== */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: trimmedImg
            ? "var(--background)"
            : "color-mix(in srgb, var(--font-primary) 4%, var(--surface) 96%)",
          backgroundImage: trimmedImg ? `url("${trimmedImg}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 0.5,
          px: 1.25,
          py: 1,
          borderLeft: "1px dashed var(--border-default)",
        }}
      >
        {!trimmedImg ? (
          <Stack alignItems="center" spacing={0.5} sx={{ color: "var(--font-tertiary)" }}>
            <IconWrapper icon="mdi:image-area" size={28} />
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.62rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--font-tertiary)",
              }}
            >
              Hero image
            </Typography>
          </Stack>
        ) : (
          <>
            {/* Logo on the hero */}
            {trimmedLogo ? (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor:
                    "color-mix(in srgb, var(--card-bg) 88%, transparent)",
                  backgroundImage: `url("${trimmedLogo}")`,
                  backgroundSize: "70% auto",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  border:
                    "1px solid color-mix(in srgb, var(--card-bg) 70%, transparent)",
                  boxShadow:
                    "0 4px 12px color-mix(in srgb, var(--font-primary) 18%, transparent)",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border:
                    "1px dashed color-mix(in srgb, var(--font-primary) 24%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--card-bg) 70%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--font-tertiary)",
                }}
              >
                <IconWrapper icon="mdi:image-outline" size={16} />
              </Box>
            )}
            {/* Brand name */}
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "var(--font-primary)",
                lineHeight: 1.1,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {clientName}
            </Typography>
            {/* Slogan */}
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--font-primary)",
                lineHeight: 1.15,
                maxWidth: "100%",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {slogan}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

function LogoOnSidebarPreview({ logoUrl }: { logoUrl: string }) {
  const trimmed = logoUrl.trim();
  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 1.5,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--shell-sidebar-bg)",
        color: "var(--font-light-nav)",
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 1,
        minHeight: 72,
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 44,
          borderRadius: 1,
          backgroundColor: trimmed
            ? "transparent"
            : "color-mix(in srgb, var(--font-light-nav) 8%, transparent)",
          backgroundImage: trimmed ? `url("${trimmed}")` : undefined,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          border: trimmed
            ? "none"
            : "1px dashed color-mix(in srgb, var(--font-light-nav) 25%, transparent)",
        }}
      >
        {!trimmed ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              color: "color-mix(in srgb, var(--font-light-nav) 60%, transparent)",
            }}
          >
            <IconWrapper icon="mdi:image-outline" size={20} />
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Logo
            </Typography>
          </Stack>
        ) : null}
      </Box>
      <Stack spacing={0.5} sx={{ width: 22, flexShrink: 0 }}>
        <Box
          sx={{
            height: 4,
            borderRadius: 0.5,
            backgroundColor:
              "color-mix(in srgb, var(--font-light-nav) 22%, transparent)",
          }}
        />
        <Box
          sx={{
            height: 4,
            borderRadius: 0.5,
            backgroundColor:
              "color-mix(in srgb, var(--font-light-nav) 14%, transparent)",
          }}
        />
        <Box
          sx={{
            height: 4,
            borderRadius: 0.5,
            backgroundColor:
              "color-mix(in srgb, var(--font-light-nav) 10%, transparent)",
          }}
        />
      </Stack>
    </Box>
  );
}

function FaviconInTabPreview({
  iconUrl,
  clientName,
}: {
  iconUrl: string;
  clientName: string;
}) {
  const trimmed = iconUrl.trim();
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          height: 30,
          backgroundColor:
            "color-mix(in srgb, var(--font-primary) 8%, var(--surface) 92%)",
          borderRadius: "10px 10px 0 0",
          px: 0.75,
          pt: 0.75,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.85,
            py: 0.45,
            borderRadius: "8px 8px 0 0",
            bgcolor: "var(--card-bg)",
            border: "1px solid var(--border-default)",
            borderBottom: "none",
            maxWidth: 170,
            minWidth: 110,
            boxShadow:
              "0 -1px 2px color-mix(in srgb, var(--font-primary) 6%, transparent)",
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              flexShrink: 0,
              borderRadius: 0.5,
              backgroundColor: "#ffffff",
              backgroundImage: trimmed ? `url("${trimmed}")` : undefined,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              border: trimmed ? "none" : "1px dashed var(--border-default)",
            }}
          />
          <Typography
            noWrap
            sx={{
              fontSize: "0.66rem",
              fontWeight: 600,
              color: "var(--font-primary)",
              flex: 1,
              minWidth: 0,
              lineHeight: 1.2,
            }}
          >
            {clientName}
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              fontSize: "0.7rem",
              lineHeight: "8px",
              textAlign: "center",
              color: "var(--font-secondary)",
              opacity: 0.55,
            }}
          >
            ×
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          height: 44,
          borderRadius: "0 0 10px 10px",
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-default)",
          borderTop: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          color: "var(--font-tertiary)",
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: 0.75,
            backgroundColor: trimmed ? "#ffffff" : "transparent",
            backgroundImage: trimmed ? `url("${trimmed}")` : undefined,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            border: trimmed ? "1px solid var(--border-default)" : "1px dashed var(--border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!trimmed ? <IconWrapper icon="mdi:earth" size={16} /> : null}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.62rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--font-tertiary)",
          }}
        >
          Browser tab
        </Typography>
      </Box>
    </Box>
  );
}
