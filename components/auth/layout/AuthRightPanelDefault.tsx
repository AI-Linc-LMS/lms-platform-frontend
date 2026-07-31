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
 * Owned atmosphere: a dot lattice fading from the top-left, plus a violet bloom with a pink
 * counterweight.
 *
 * These exist because the panel used to rely on the tenant's hero image for all of its texture,
 * which fails in both directions: a low-resolution upload turns into visible compression blocks
 * at low opacity, and a tenant with no hero at all gets a flat gradient. Neither layer depends
 * on tenant content, so the panel is finished before any asset arrives.
 */
function PanelTexture() {
  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,255,255,0.15) 0.8px, transparent 0.9px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(120% 95% at 12% 8%, #000 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(120% 95% at 12% 8%, #000 0%, transparent 72%)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(60% 44% at 82% 16%, rgba(168,85,247,0.24) 0%, transparent 70%), radial-gradient(52% 40% at 6% 62%, rgba(236,72,153,0.15) 0%, transparent 72%)",
        }}
      />
    </>
  );
}

/**
 * The dark brand surface.
 *
 * The tenant's NAME is the mark, set in the panel's own type. The uploaded logo sits in the
 * footer at a size it can survive.
 *
 * This inverts what was here before, where the logo led inside an opaque white chip. That chip
 * existed purely to rescue logos with a baked-in white background, so it penalised every good
 * logo to protect against the bad ones, and it read as a sticker on the dark field either way.
 * Type always looks intentional, so this is the only arrangement whose quality does not depend
 * on what a tenant happened to upload. It also connects the top of the panel to the headline,
 * which are now both type rather than two unrelated fragments.
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
  const displayName = brandName || "AI Linc";

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
          {/* Plain <img>, NOT next/image: tenant assets are arbitrary admin-supplied URLs, often
              SVG or on hosts the optimizer 400s on, and it silently dropped them for many
              clients. The hero now sits UNDER the owned texture rather than instead of it, so a
              low-resolution upload can no longer be the only thing carrying the panel. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: 0.18,
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

      <PanelTexture />

      {/* Wordmark. The tenant name is already in clientInfo, so this is correct on day one for
          every tenant with no admin work and nothing to upload. */}
      <Box sx={{ position: "relative", zIndex: 2 }}>
        {clientInfoLoading ? (
          <Skeleton
            variant="text"
            width={190}
            height={30}
            sx={{ bgcolor: "rgba(255,255,255,0.10)" }}
          />
        ) : (
          <>
            <Typography
              component="p"
              sx={{
                ...TYPE.section,
                fontFamily: FONT,
                color: "#ffffff",
                '[dir="rtl"] &': { letterSpacing: "normal" },
              }}
            >
              {displayName}
            </Typography>
            <Box
              aria-hidden
              sx={{
                width: 34,
                height: 2,
                mt: 1.25,
                borderRadius: "2px",
                background: `linear-gradient(90deg, ${AUTH.violet}, ${AUTH.pink})`,
              }}
            />
          </>
        )}
      </Box>

      <Box sx={{ position: "relative", zIndex: 2, maxWidth: 460 }}>
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

      {/* The uploaded logo, demoted to the footer where 28px is the right size rather than an
          accident. No chip: at this scale a mark reads as a signature, and a tenant who never
          uploaded one simply has a cleaner panel instead of a hole. */}
      <Box sx={{ position: "relative", zIndex: 2, minHeight: 28, display: "flex", alignItems: "center" }}>
        {clientInfoLoading ? (
          <Skeleton variant="rounded" width={110} height={22} sx={{ bgcolor: "rgba(255,255,255,0.08)" }} />
        ) : logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={brandName || "Logo"}
            style={{ maxHeight: 28, maxWidth: 170, objectFit: "contain", opacity: 0.8 }}
          />
        ) : null}
      </Box>
    </Box>
  );
}

/**
 * Compact dark bar for phones, where the panel above is not rendered.
 *
 * Same inversion as the desktop panel: the name leads as type, and the uploaded logo trails it
 * small. Without this a tenant's users saw zero branding on mobile, because the brand panel is
 * display:none below md.
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
  const displayName = brandName || "AI Linc";

  return (
    <Box
      sx={{
        px: 3,
        py: 2.5,
        minHeight: 76,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        backgroundColor: AUTH.night,
        backgroundImage: `radial-gradient(120% 200% at 4% 120%, ${AUTH.violet}4d 0%, transparent 62%), linear-gradient(160deg, ${AUTH.night2} 0%, ${AUTH.night} 70%)`,
      }}
    >
      {clientInfoLoading ? (
        <Skeleton variant="text" width={140} height={24} sx={{ bgcolor: "rgba(255,255,255,0.10)" }} />
      ) : (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="p"
            sx={{
              ...TYPE.body,
              fontFamily: FONT,
              fontWeight: 600,
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </Typography>
          <Box
            aria-hidden
            sx={{
              width: 26,
              height: 2,
              mt: 0.75,
              borderRadius: `${RADIUS}px`,
              background: `linear-gradient(90deg, ${AUTH.violet}, ${AUTH.pink})`,
            }}
          />
        </Box>
      )}

      {!clientInfoLoading && logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoUrl}
          alt={brandName || "Logo"}
          style={{ maxHeight: 22, maxWidth: 96, objectFit: "contain", opacity: 0.8, flex: "none" }}
        />
      ) : null}
    </Box>
  );
}
