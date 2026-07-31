"use client";

import { Box, Skeleton, Typography } from "@mui/material";
import type { LoginHeroBrandingUi } from "@/lib/theme/authHeroBranding";
import { AUTH, FONT, RADIUS, TYPE } from "./authTokens";

interface AuthRightPanelDefaultProps {
  clientInfoLoading: boolean;
  sloganText: string;
  logoUrl: string;
  brandName: string;
  loginImgUrl?: string | null;
  heroBranding?: LoginHeroBrandingUi;
  useCustomSlogan?: boolean;
  supportingText?: string;
}

/**
 * The dark brand surface.
 *
 * Three things drive this design:
 *
 * 1. It matches the product you land in. ModulePageHeader and the student dashboard already
 *    define a dark violet identity; auth previously shared none of it, so signing in felt
 *    like a different product.
 *
 * 2. A tenant's uploaded image can never carry the quality of the screen. The old hero branch
 *    rendered `login_img_url` full-bleed and sharp at 50vw, so a small upload was scaled to
 *    ~720px wide and rendered visibly pixelated, with dark text laid straight over it and no
 *    scrim. Here the image sits behind the composition at low opacity, blurred, under a scrim.
 *    The panel is already finished without it; the image only adds texture.
 *
 * 3. No blurred floating blobs, no glassmorphism, no gradient text highlight keyed on the
 *    literal English words "the" and "world" (which did nothing in Arabic and nothing for any
 *    tenant-authored slogan).
 */
export function AuthRightPanelDefault({
  clientInfoLoading,
  sloganText,
  logoUrl,
  brandName,
  loginImgUrl,
  supportingText,
}: AuthRightPanelDefaultProps) {
  const heroSrc = loginImgUrl?.trim() || "";

  return (
    <Box
      sx={{
        flex: { xs: 0, md: "0 0 48%" },
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        px: 7,
        py: 7,
        backgroundColor: AUTH.night,
        backgroundImage: `radial-gradient(120% 120% at 8% 108%, ${AUTH.violet}59 0%, ${AUTH.violetDeep}33 38%, transparent 68%), linear-gradient(160deg, ${AUTH.night2} 0%, ${AUTH.night} 62%)`,
      }}
    >
      {heroSrc ? (
        <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* Plain <img>, NOT next/image: tenant assets are arbitrary admin-supplied URLs,
              often SVG or on hosts the optimizer 400s on, and it silently dropped them for
              many clients. Blur + low opacity is deliberate, not decoration: it makes a
              low-resolution upload physically incapable of looking broken. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: 0.22,
              filter: "blur(2px) saturate(0.85)",
              transform: "scale(1.06)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(160deg, ${AUTH.night2}d9 0%, ${AUTH.night}f2 70%)`,
            }}
          />
        </Box>
      ) : null}

      <Box sx={{ position: "relative", zIndex: 1 }}>
        {clientInfoLoading ? (
          <Skeleton
            variant="rounded"
            width={150}
            height={36}
            sx={{ bgcolor: "rgba(255,255,255,0.10)", borderRadius: `${RADIUS}px` }}
          />
        ) : logoUrl ? (
          /* A light chip, not a bare image. Tenant logos are arbitrary uploads: transparent
             SVGs sit fine on dark, but a raster with a baked-in white background reads as a
             sticker floating on the panel. The chip makes both look deliberate. */
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              px: 1.75,
              py: 1.25,
              borderRadius: `${RADIUS}px`,
              backgroundColor: "rgba(255,255,255,0.94)",
              maxWidth: 220,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={brandName || "Logo"}
              style={{ maxHeight: 28, maxWidth: 180, objectFit: "contain", display: "block" }}
            />
          </Box>
        ) : brandName ? (
          <Typography
            sx={{ ...TYPE.section, fontFamily: FONT, color: "#ffffff" }}
          >
            {brandName}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 460 }}>
        {clientInfoLoading ? (
          <>
            <Skeleton
              variant="text"
              width="90%"
              height={52}
              sx={{ bgcolor: "rgba(255,255,255,0.10)" }}
            />
            <Skeleton
              variant="text"
              width="70%"
              height={52}
              sx={{ bgcolor: "rgba(255,255,255,0.10)" }}
            />
          </>
        ) : (
          <Typography
            component="p"
            sx={{
              ...TYPE.display,
              fontFamily: FONT,
              color: "#ffffff",
              // Arabic joins cursively; negative tracking breaks the joins.
              '[dir="rtl"] &': { letterSpacing: "normal" },
            }}
          >
            {sloganText}
          </Typography>
        )}

        {supportingText ? (
          <Typography
            component="p"
            sx={{
              ...TYPE.body,
              fontFamily: FONT,
              color: "rgba(255,255,255,0.68)",
              mt: 2.5,
              maxWidth: 400,
            }}
          >
            {supportingText}
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: AUTH.pink,
          }}
        />
        <Typography
          sx={{
            ...TYPE.eyebrow,
            fontFamily: FONT,
            color: "rgba(255,255,255,0.55)",
            '[dir="rtl"] &': { letterSpacing: "normal" },
          }}
        >
          {brandName || "AI Linc"}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Compact dark bar for phones, where the panel above is not rendered.
 *
 * Without this a tenant's users saw zero branding on mobile: the brand panel is display:none
 * below md, and the old shell could not scroll to reveal anything anyway.
 */
export function AuthMobileBrandBar({
  logoUrl,
  brandName,
  clientInfoLoading,
}: {
  logoUrl: string;
  brandName: string;
  clientInfoLoading: boolean;
}) {
  return (
    <Box
      sx={{
        px: 3,
        py: 2.5,
        minHeight: 76,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        backgroundColor: AUTH.night,
        backgroundImage: `radial-gradient(120% 200% at 4% 120%, ${AUTH.violet}4d 0%, transparent 62%), linear-gradient(160deg, ${AUTH.night2} 0%, ${AUTH.night} 70%)`,
      }}
    >
      {clientInfoLoading ? (
        <Skeleton
          variant="rounded"
          width={120}
          height={28}
          sx={{ bgcolor: "rgba(255,255,255,0.10)" }}
        />
      ) : logoUrl ? (
        // Same light chip as the desktop panel, for the same reason: a tenant logo with a
        // baked-in white background reads as a sticker when placed bare on dark.
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1.25,
            py: 0.75,
            borderRadius: `${RADIUS}px`,
            backgroundColor: "rgba(255,255,255,0.94)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={brandName || "Logo"}
            style={{ maxHeight: 24, maxWidth: 150, objectFit: "contain", display: "block" }}
          />
        </Box>
      ) : (
        <Typography
          sx={{ ...TYPE.section, fontFamily: FONT, color: "#ffffff" }}
        >
          {brandName || "AI Linc"}
        </Typography>
      )}
    </Box>
  );
}
