"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  adminLiveActivitiesService,
  WebinarBranding,
} from "@/lib/services/admin/admin-live-activities.service";
import { SectionCard, InfoCallout } from "@/components/live-sessions/ui/LiveSessionUI";

interface Props {
  liveClassId: number;
}

function BrandingImage({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <Box>
      <Typography variant="caption" sx={{ color: "var(--font-tertiary)", display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8, border: "1px solid var(--border-default)" }}
      />
    </Box>
  );
}

/** Branding tab — read-only mirror of the branding the webinar template applied. */
export function WebinarBrandingSection({ liveClassId }: Props) {
  const { t } = useTranslation("common");
  const [branding, setBranding] = useState<WebinarBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminLiveActivitiesService
      .getWebinarBranding(liveClassId)
      .then((b) => {
        if (!cancelled) setBranding(b);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [liveClassId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const vbs = branding?.virtual_backgrounds ?? [];
  const hasAny = Boolean(branding?.wallpaper || branding?.banner || branding?.logo || vbs.length);

  return (
    <SectionCard title={t("adminLiveSessions.branding", "Branding")} icon="mdi:palette-outline">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <InfoCallout icon="mdi:information-outline">
          {branding?.note ||
            t(
              "adminLiveSessions.brandingMirrorNote",
              "This is the branding applied from the webinar template. Edit it in Zoom; it appears live in the webinar."
            )}
        </InfoCallout>

        {hasAny ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <BrandingImage label={t("adminLiveSessions.wallpaper", "Wallpaper")} url={branding?.wallpaper ?? null} />
            <BrandingImage label={t("adminLiveSessions.banner", "Banner")} url={branding?.banner ?? null} />
            <BrandingImage label={t("adminLiveSessions.logo", "Logo")} url={branding?.logo ?? null} />
            {vbs.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)", display: "block", mb: 0.5 }}>
                  {t("adminLiveSessions.virtualBackgrounds", "Virtual backgrounds")}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {vbs.map((v, i) => (
                    <Box
                      key={v.id || i}
                      sx={{
                        width: 120,
                        height: 68,
                        borderRadius: 1,
                        border: "1px solid var(--border-default)",
                        bgcolor: "var(--surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {v.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.url} alt={v.name || "vb"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                          {v.name || "Background"}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {t("adminLiveSessions.noBrandingReadable", "No branding details are available to display for this webinar.")}
          </Typography>
        )}
      </Box>
    </SectionCard>
  );
}
