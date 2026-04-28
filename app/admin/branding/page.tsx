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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import { useToast } from "@/components/common/Toast";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import {
  fetchBrandingPresets,
  fetchBrandingPresetDetail,
  fetchClientBranding,
  patchClientBranding,
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
  draftThemeRaw: Record<string, string>;
};

export default function AdminBrandingPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { clientInfo, loading: loadingClientInfo, refreshClientInfo } = useClientInfo();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [presets, setPresets] = useState<BrandingPresetSummary[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [loginImgUrl, setLoginImgUrl] = useState("");
  const [loginLogoUrl, setLoginLogoUrl] = useState("");
  const [draftThemeRaw, setDraftThemeRaw] = useState<Record<string, string>>({});
  const [baseline, setBaseline] = useState<BrandingBaseline | null>(null);
  const [presetApplyingId, setPresetApplyingId] = useState<string | null>(null);
  const [loginAdvancedOpen, setLoginAdvancedOpen] = useState(false);

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
    return themeFingerprint(draftThemeRaw) !== themeFingerprint(baseline.draftThemeRaw);
  }, [baseline, selectedPreset, loginImgUrl, loginLogoUrl, draftThemeRaw]);

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

  const applyBaseline = useCallback((b: BrandingBaseline) => {
    setSelectedPreset(b.selectedPreset);
    setLoginImgUrl(b.loginImgUrl);
    setLoginLogoUrl(b.loginLogoUrl);
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
      showToast(t("branding.presetAppliedHint"), "info");
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
            mb: 3,
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
                theme.palette.primary.dark,
                0.04
              )} 50%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: (theme) =>
                    `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                  "& svg": { color: "currentColor" },
                }}
              >
                <IconWrapper
                  icon="mdi:palette-swatch"
                  size={30}
                  style={{ color: "currentColor" }}
                />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
                  {t("branding.title")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
                  {t("branding.subtitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 640 }}>
                  {t("branding.subtitlePlain")}
                </Typography>
              </Box>
            </Stack>
            {isDirty ? (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={t("branding.unsavedChanges")}
                sx={{ fontWeight: 600 }}
              />
            ) : (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={t("branding.allSaved")}
                sx={{ fontWeight: 600 }}
              />
            )}
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
                icon={<IconWrapper icon="mdi:map-marker-path" size={22} />}
                sx={{
                  borderRadius: 2,
                  alignItems: "flex-start",
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--surface)",
                  color: "var(--font-primary)",
                  "& .MuiAlert-icon": {
                    color: "var(--accent-indigo)",
                  },
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                <Typography fontWeight={800} sx={{ mb: 1, color: "var(--font-primary)" }}>
                  {t("branding.guideTitle")}
                </Typography>
                <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.25, listStyle: "disc" }}>
                  <Typography component="li" variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {t("branding.guideStep1")}
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {t("branding.guideStep2")}
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {t("branding.guideStep3")}
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {t("branding.guideStep4")}
                  </Typography>
                </Stack>
              </Alert>

              <BrandingSectionCard
                step={1}
                icon="mdi:shape-outline"
                title={t("branding.sectionPalette")}
                description={t("branding.sectionPaletteDesc")}
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
                step={2}
                icon="mdi:dock-left"
                title={t("branding.sectionAppChrome")}
                description={t("branding.sectionAppChromeDesc")}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                  {t("branding.sectionAppChromeTip")}
                </Typography>
                <Stack spacing={2}>
                  <BrandingColorField
                    label={t("branding.sidebarBg")}
                    hint={t("branding.sidebarBgHint")}
                    value={draftThemeRaw.secondary500 ?? ""}
                    onChange={(hex) =>
                      setDraftThemeRaw((prev) => ({ ...prev, secondary500: hex }))
                    }
                    fallbackHex={normalizedPreview.secondary500}
                    helperText={t("branding.sidebarBgHelp")}
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
                    helperText={t("branding.brandPrimaryHelp")}
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
                </Stack>
              </BrandingSectionCard>

              <BrandingSectionCard
                step={3}
                icon="mdi:image-outline"
                title={t("branding.sectionSignInMedia")}
                description={t("branding.sectionSignInMediaDesc")}
              >
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("branding.loginImageUrl")}
                    value={loginImgUrl}
                    onChange={(e) => setLoginImgUrl(e.target.value)}
                    helperText={t("branding.loginImageHelpFriendly")}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      component="label"
                      disabled={uploading}
                      startIcon={
                        uploading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              color: "primary.contrastText",
                            }}
                          >
                            <IconWrapper
                              icon="mdi:cloud-upload-outline"
                              size={20}
                              style={{ color: "currentColor" }}
                            />
                          </Box>
                        )
                      }
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      {uploading ? t("branding.uploading") : t("branding.uploadBg")}
                      <input
                        type="file"
                        hidden
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleUpload}
                      />
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("branding.loginLogoUrl")}
                    value={loginLogoUrl}
                    onChange={(e) => setLoginLogoUrl(e.target.value)}
                    helperText={t("branding.loginLogoUrlHelp")}
                  />
                </Stack>
              </BrandingSectionCard>

              <BrandingSectionCard
                step={4}
                icon="mdi:format-text"
                title={t("branding.loginCopySection")}
                description={t("branding.loginCopyHintShort")}
              >
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    label={t("branding.loginSlogan")}
                    value={draftThemeRaw.loginHeroSlogan ?? ""}
                    onChange={(e) => setHeroField("loginHeroSlogan", e.target.value)}
                    placeholder={t("auth.slogan")}
                    helperText={t("branding.loginSloganHelp")}
                  />

                  <Button
                    variant="text"
                    onClick={() => setLoginAdvancedOpen((o) => !o)}
                    endIcon={
                      <IconWrapper
                        icon={loginAdvancedOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                        size={20}
                      />
                    }
                    sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                  >
                    {loginAdvancedOpen
                      ? t("branding.loginAdvancedHide")
                      : t("branding.loginAdvancedShow")}
                  </Button>

                  <Collapse in={loginAdvancedOpen}>
                    <Stack spacing={2.5}>
                      <Divider sx={{ my: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t("branding.loginAdvancedIntro")}
                      </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
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
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <BrandingColorField
                        label={t("branding.loginSloganColor")}
                        hint={t("branding.loginSloganColorHint")}
                        value={draftThemeRaw.loginHeroSloganColor ?? ""}
                        onChange={(hex) => setHeroField("loginHeroSloganColor", hex)}
                        fallbackHex={normalizedPreview.loginHeroSloganColor}
                      />
                    </Box>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t("branding.loginBrandSize")}
                        value={draftThemeRaw.loginHeroBrandNameFontSize ?? ""}
                        onChange={(e) =>
                          setHeroField("loginHeroBrandNameFontSize", e.target.value)
                        }
                        placeholder="2.75rem"
                        helperText={t("branding.fontSizeHelp")}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <BrandingColorField
                        label={t("branding.loginBrandColor")}
                        hint={t("branding.loginBrandColorHint")}
                        value={draftThemeRaw.loginHeroBrandNameColor ?? ""}
                        onChange={(hex) =>
                          setHeroField("loginHeroBrandNameColor", hex)
                        }
                        fallbackHex={normalizedPreview.loginHeroBrandNameColor}
                      />
                    </Box>
                  </Stack>

                  <FormControl fullWidth size="small">
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

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
                  </Stack>

                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {t("branding.sidebarLogoSection")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("branding.sidebarLogoSectionHint")}
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
                  </Stack>
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
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.white, 0.04)
                      : "var(--surface)",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? `0 10px 30px ${alpha(theme.palette.common.black, 0.28)}`
                      : "0 12px 28px color-mix(in srgb, var(--font-primary) 10%, transparent)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <IconWrapper icon="mdi:monitor-eye" size={20} style={{ opacity: 0.85 }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("branding.previewColumnTitle")}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  {t("branding.previewLiveHint")}
                </Typography>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  {t("branding.loginPanelPreview")}
                </Typography>
                <LoginHeroPreview
                  loginImgUrl={loginImgUrl}
                  loginLogoUrl={loginLogoUrl}
                  normalizedTheme={normalizedPreview}
                  sampleClientName={t("branding.loginPreviewClient")}
                />

                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ mt: 2.5, mb: 1, display: "block" }}
                >
                  {t("branding.previewAppTitle")}
                </Typography>
                <Box
                  ref={previewRef}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 2.5,
                    backgroundColor: "var(--background)",
                    boxShadow:
                      "inset 0 1px 2px color-mix(in srgb, var(--font-primary) 6%, transparent)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "var(--primary-700)",
                      fontWeight: 700,
                      fontSize: "1.15rem",
                      mb: 1,
                    }}
                  >
                    {t("branding.previewHeading")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--font-secondary)", mb: 2 }}
                  >
                    {t("branding.previewBody")}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: "var(--primary-600)",
                      "&:hover": { bgcolor: "var(--primary-700)" },
                    }}
                  >
                    {t("branding.previewCta")}
                  </Button>
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
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  title={!isDirty ? t("branding.saveDisabledHint") : undefined}
                  startIcon={
                    saving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
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
                    )
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
                  {saving ? t("branding.saving") : t("branding.save")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
      </Box>
    </MainLayout>
  );
}
